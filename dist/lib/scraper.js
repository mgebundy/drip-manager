'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

var _url2 = require('url');

var _url3 = _interopRequireDefault(_url2);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Scraper = function () {
  function Scraper() {
    _classCallCheck(this, Scraper);
  }

  _createClass(Scraper, null, [{
    key: 'isAuth',
    value: function isAuth() {
      try {
        Scraper.getCookieJar();
        return true;
      } catch (e) {
        return false;
      }
    }
  }, {
    key: 'doAuth',
    value: function doAuth(_ref) {
      var email = _ref.email,
          password = _ref.password;

      return new Promise(function (resolve, reject) {
        _request2.default.post('https://drip.kickstarter.com/api/users/login', {
          body: { email: email, password: password },
          json: true,
          jar: true
        }).on('response', function (response) {
          response.on('data', function (data) {
            try {
              data = JSON.parse(data);
              if (data.errors) {
                reject(data.errors);
              }
            } catch (e) {
              var cookies = response.headers['set-cookie'];
              _fs2.default.writeFile(_config2.default.cookieFile, JSON.stringify(cookies));
              resolve(true);
            }
          });
        });
      });
    }
  }, {
    key: 'getCookieJar',
    value: function getCookieJar() {
      var cookies = _fs2.default.readFileSync(_config2.default.cookieFile).toString();
      var jar = _request2.default.jar();

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = cookies.split('\n')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var cookie = _step.value;

          if (cookie === '' || cookie.indexOf('#') === 0) continue;
          cookie = cookie.split('\t');

          var _cookie = cookie,
              _cookie2 = _slicedToArray(_cookie, 7),
              domain = _cookie2[0],
              /* flag */_path = _cookie2[2],
              secure = _cookie2[3],
              /* expiration */name = _cookie2[5],
              value = _cookie2[6];

          domain = domain.replace(/^\./, '');
          secure = secure === 'TRUE';

          var _url = 'http' + (secure ? 's' : '') + '://' + domain + _path;
          jar.setCookie(_request2.default.cookie(name + '=' + value), _url);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return jar;
    }
  }, {
    key: 'getDrip',
    value: function getDrip(reqUrl, callback) {
      var jar = this.getCookieJar();
      var reqPath = _url3.default.parse(reqUrl).path;

      (0, _request2.default)({
        url: 'https://drip.kickstarter.com/api/creatives' + reqPath,
        jar: jar
      }).on('data', function (data) {
        callback(JSON.parse(data));
      });
    }
  }, {
    key: 'getDripDownload',
    value: function getDripDownload(creativeId, id, callback) {
      var jar = this.getCookieJar();
      var format = _config2.default.preferredFormats[0];

      var reqUrl = 'https://drip.kickstarter.com/api/creatives/' + creativeId + '/releases/' + id + '/download?release_format=' + format;

      (0, _request2.default)({
        url: reqUrl,
        jar: jar,
        followRedirect: false
      }).on('response', function (response) {
        if (response.statusCode === 401) {
          callback(new Error('You don\'t have permissions to download this.'), null);
          return;
        }
        var resUrl = _url3.default.parse(response.headers.location);
        var fileName = decodeURI(_path3.default.basename(resUrl.pathname));

        var tmpobj = _tmp2.default.dirSync();
        var filePath = _path3.default.resolve(tmpobj.name, fileName);

        console.log(_chalk2.default.blue('Getting the zip.'));
        doDownload(filePath, callback);
      });

      function doDownload(filePath, callback) {
        var retry = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;

        if (retry >= _config2.default.timeout) {
          callback(new Error('Download timed out.'), null);
          return;
        }

        var total = 0;
        var bytes = 0;

        (0, _request2.default)({
          url: reqUrl,
          jar: jar,
          headers: {
            'User-Agent': 'DripManager/' + _package2.default.version
          }
        }).on('response', function (response) {
          if (response.statusCode === 401) {
            callback(new Error('You don\'t have permissions to download this.'), null);
            return;
          }
          total = response.headers['content-length'];

          if (response.headers['content-type'] !== 'application/zip') {
            setTimeout(function () {
              doDownload(filePath, callback, retry * 2);
            }, retry);
            return;
          }

          response.on('data', function (data) {
            bytes += data.length;
            process.stdout.clearLine();
            process.stdout.write(_chalk2.default.blue('Downloading... ' + Math.ceil(bytes / total * 100) + '%'));
            process.stdout.cursorTo(0);
          });

          response.pipe(_fs2.default.createWriteStream(filePath));

          response.on('end', function () {
            process.stdout.write('\n');
            callback(null, filePath);
          });
        });
      }
    }
  }]);

  return Scraper;
}();

;

exports.default = Scraper;