import fs from 'fs';
import request from 'request';
import url from 'url';
import tmp from 'tmp';
import path from 'path';

import appCfg from './config';
import pjson from '../../package.json';

const host = 'https://drip.kickstarter.com/api';

class API {
  static _options (options = {}) {
    options.baseUrl = host;
    options.headers = {
      'User-Agent': `DripManager/${pjson.version}`
    };

    try {
      options.jar = this.getCookieJar();
    } catch (e) {
      options.jar = true;
    }

    return options;
  }

  static _handleResponse (response, body) {
    if (response.headers['content-type'] === 'application/json') {
      return JSON.parse(body);
    }
    return body;
  }

  static _promisify (request, tick) {
    return new Promise(
      (resolve, reject) => {
        request
        .on('error', reject)
        .on('response', response => {
          let body = [];
          let bytes = 0;

          response.on('data', chunk => {
            if (tick) {
              bytes += chunk.length;
              tick(bytes);
            }
            body.push(chunk);
          });

          response.on('end', () => {
            body = Buffer.concat(body).toString();
            let data = this._handleResponse(response, body);
            if (data && data.errors) {
              reject(new Error(data.errors.join(',')));
            } else {
              resolve({data, response});
            }
          });
        });
      }
    );
  }

  static getCookieJar () {
    let cookies = fs.readFileSync(appCfg.cookieFile).toString();
    let jar = request.jar();

    let json = null;

    try {
      json = JSON.parse(cookies);
    } catch (e) {
      // Not JSON, probably Netscape format
    }

    if (json !== null) {
      for (let cookie of json) {
        cookie = cookie.split(';').map(s => s.trim());
        let [ keyval, path, /* expiry */, secure, /* httponly */, ] = cookie;
        secure = secure === 'secure';
        path = path.split('=');
        let urlObject = url.parse(host);
        let cookieUrl = `http${(secure ? 's' : '')}://${urlObject.hostname}${path[1]}`;
        jar.setCookie(request.cookie(keyval), cookieUrl);
      }

      return jar;
    }

    for (let cookie of cookies.split('\n')) {
      if (cookie === '' || cookie.indexOf('#') === 0) continue;
      cookie = cookie.split('\t');

      let [domain, /* flag */, path, secure, /* expiration */, name, value] = cookie;
      domain = domain.replace(/^\./, '');
      secure = secure === 'TRUE';

      let cookieUrl = `http${(secure ? 's' : '')}://${domain}${path}`;
      jar.setCookie(request.cookie(`${name}=${value}`), cookieUrl);
    }

    return jar;
  }

  static request (method, path, options = {}) {
    options = this._options(options);

    options.method = method.toUpperCase();
    options.url = path;

    return this._promisify(request(options));
  }

  static post (path, body = {}, options = {}) {
    if (body) {
      options.body = body;
      options.json = true;
    }

    return this.request('POST', path, options);
  }

  static get (path, options = {}) {
    return this.request('GET', path, options);
  }

  static doAuth ({email, password}) {
    return API.post('/users/login', { email, password }).then(({data, response}) => {
      if (data && data.email === email) {
        let cookies = response.headers['set-cookie'];
        fs.writeFileSync(appCfg.cookieFile, JSON.stringify(cookies));
      }
    });
  }

  static getUser () {
    return this.post('/users/login');
  }

  static getReleaseDownloadName (creativeId, id, format) {
    let reqUrl = `/creatives/${creativeId}/releases/${id}/download?release_format=${format}`;

    return this.get(reqUrl, { followRedirect: false })
    .then(({data, response}) => {
      if (response.statusCode === 401) {
        throw new Error('You don\'t have permissions to download this.');
      }

      let resUrl = url.parse(response.headers.location);
      let fileName = decodeURI(path.basename(resUrl.pathname));

      return fileName;
    });
  }

  static getReleaseDownload (creativeId, id, format, tick) {
    return this
    .getReleaseDownloadName(creativeId, id, format)
    .then(fileName => {
      return new Promise(
        (resolve, reject) => {
          let options = this._options();
          options.url = `/creatives/${creativeId}/releases/${id}/download?release_format=${format}`;

          let tmpobj = tmp.dirSync();
          let filePath = path.resolve(tmpobj.name, fileName);

          doDownload();

          function doDownload (retry = 1000) {
            if (retry >= appCfg.timeout) {
              reject(new Error('Download timed out.'));
              return;
            }

            let total = 0;
            let bytes = 0;

            request(options)
            .on('response', response => {
              if (response.statusCode === 401) {
                reject(new Error('You don\'t have permissions to download this.'));
                return;
              }
              total = response.headers['content-length'];

              if (response.headers['content-type'] !== 'application/zip') {
                setTimeout(() => {
                  doDownload(retry * 2);
                }, retry);
                return;
              }

              response.on('data', data => {
                bytes += data.length;
                tick(bytes, total);
              });

              response.pipe(fs.createWriteStream(filePath));

              response.on('end', () => {
                resolve(filePath);
              });
            });
          }
        }
      );
    });
  }
};

export default API;
