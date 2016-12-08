import fs from 'fs';
import request from 'request';
import path from 'path';
import url from 'url';
import chalk from 'chalk';
import tmp from 'tmp';

import appCfg from './config';
import pjson from '../../package.json';

class Scraper {
  static isAuth () {
    try {
      Scraper.getCookieJar();
      return true;
    } catch (e) {
      return false;
    }
  }

  static doAuth ({email, password}) {
    return new Promise(
      function (resolve, reject) {
        request.post('https://drip.kickstarter.com/api/users/login', {
          body: {email, password},
          json: true,
          jar: true
        }).on('response', response => {
          response.on('data', data => {
            try {
              data = JSON.parse(data);
              if (data.errors) {
                reject(data.errors);
              }
            } catch (e) {
              let cookies = response.headers['set-cookie'];
              fs.writeFile(appCfg.cookieFile, JSON.stringify(cookies));
              resolve(true);
            }
          });
        });
      }
    );
  }

  static getCookieJar () {
    let cookies = fs.readFileSync(appCfg.cookieFile).toString();
    let jar = request.jar();

    for (let cookie of cookies.split('\n')) {
      if (cookie === '' || cookie.indexOf('#') === 0) continue;
      cookie = cookie.split('\t');

      let [domain, /* flag */, path, secure, /* expiration */, name, value] = cookie;
      domain = domain.replace(/^\./, '');
      secure = secure === 'TRUE';

      let url = `http${(secure ? 's' : '')}://${domain}${path}`;
      jar.setCookie(request.cookie(`${name}=${value}`), url);
    }

    return jar;
  }

  static getDrip (reqUrl, callback) {
    let jar = this.getCookieJar();
    let reqPath = url.parse(reqUrl).path;

    request({
      url: `https://drip.kickstarter.com/api/creatives${reqPath}`,
      jar
    }).on('data', data => {
      callback(JSON.parse(data));
    });
  }

  static getDripDownload (creativeId, id, callback) {
    let jar = this.getCookieJar();
    let format = appCfg.preferredFormats[0];

    let reqUrl = `https://drip.kickstarter.com/api/creatives/${creativeId}/releases/${id}/download?release_format=${format}`;

    request({
      url: reqUrl,
      jar,
      followRedirect: false
    }).on('response', response => {
      if (response.statusCode === 401) {
        callback(new Error('You don\'t have permissions to download this.'), null);
        return;
      }
      let resUrl = url.parse(response.headers.location);
      let fileName = decodeURI(path.basename(resUrl.pathname));

      let tmpobj = tmp.dirSync();
      let filePath = path.resolve(tmpobj.name, fileName);

      console.log(chalk.blue('Getting the zip.'));
      doDownload(filePath, callback);
    });

    function doDownload (filePath, callback, retry = 1000) {
      if (retry >= appCfg.timeout) {
        callback(new Error('Download timed out.'), null);
        return;
      }

      let total = 0;
      let bytes = 0;

      request({
        url: reqUrl,
        jar,
        headers: {
          'User-Agent': `DripManager/${pjson.version}`
        }
      })
      .on('response', response => {
        if (response.statusCode === 401) {
          callback(new Error('You don\'t have permissions to download this.'), null);
          return;
        }
        total = response.headers['content-length'];

        if (response.headers['content-type'] !== 'application/zip') {
          setTimeout(() => {
            doDownload(filePath, callback, retry * 2);
          }, retry);
          return;
        }

        response.on('data', data => {
          bytes += data.length;
          process.stdout.clearLine();
          process.stdout.write(chalk.blue(`Downloading... ${Math.ceil(bytes / total * 100)}%`));
          process.stdout.cursorTo(0);
        });

        response.pipe(fs.createWriteStream(filePath));

        response.on('end', () => {
          process.stdout.write('\n');
          callback(null, filePath);
        });
      });
    }
  }
};

export default Scraper;
