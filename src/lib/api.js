import fs from 'fs';
import request from 'request';
import appCfg from './config';
import url from 'url';

const host = 'https://drip.kickstarter.com/api';

class API {
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
              reject({errors: data.errors, response});
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
    options.method = method.toUpperCase();
    options.url = path;
    options.baseUrl = host;

    options.jar = this.getCookieJar();

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

  static getRelease (reqUrl, callback) {
    let reqPath = url.parse(reqUrl).path;

    return this.get(`/creatives${reqPath}`);
  }
};

export default API;
