'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _request2 = require('request');

var _request3 = _interopRequireDefault(_request2);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _path3 = require('path');

var _path4 = _interopRequireDefault(_path3);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var host = 'https://drip.kickstarter.com/api';

var API = function () {
  function API() {
    _classCallCheck(this, API);
  }

  _createClass(API, null, [{
    key: '_options',
    value: function _options() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      options.baseUrl = host;
      options.headers = {
        'User-Agent': 'DripManager/' + _package2.default.version
      };

      try {
        options.jar = this.getCookieJar();
      } catch (e) {
        options.jar = true;
      }

      return options;
    }
  }, {
    key: '_handleResponse',
    value: function _handleResponse(response, body) {
      if (response.headers['content-type'] === 'application/json') {
        return JSON.parse(body);
      }
      return body;
    }
  }, {
    key: '_promisify',
    value: function _promisify(request, tick) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        request.on('error', reject).on('response', function (response) {
          var body = [];
          var bytes = 0;

          response.on('data', function (chunk) {
            if (tick) {
              bytes += chunk.length;
              tick(bytes);
            }
            body.push(chunk);
          });

          response.on('end', function () {
            body = Buffer.concat(body).toString();
            var data = _this._handleResponse(response, body);
            if (data && data.errors) {
              reject(new Error(data.errors.join(',')));
            } else {
              resolve({ data: data, response: response });
            }
          });
        });
      });
    }
  }, {
    key: 'getCookieJar',
    value: function getCookieJar() {
      var cookies = _fs2.default.readFileSync(_config2.default.cookieFile).toString();
      var jar = _request3.default.jar();

      var json = null;

      try {
        json = JSON.parse(cookies);
      } catch (e) {
        // Not JSON, probably Netscape format
      }

      if (json !== null) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = json[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var cookie = _step.value;

            cookie = cookie.split(';').map(function (s) {
              return s.trim();
            });

            var _cookie = cookie,
                _cookie2 = _slicedToArray(_cookie, 5),
                keyval = _cookie2[0],
                _path = _cookie2[1],
                /* expiry */secure = _cookie2[3];

            secure = secure === 'secure';
            _path = _path.split('=');
            var urlObject = _url2.default.parse(host);
            var cookieUrl = 'http' + (secure ? 's' : '') + '://' + urlObject.hostname + _path[1];
            jar.setCookie(_request3.default.cookie(keyval), cookieUrl);
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

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = cookies.split('\n')[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _cookie3 = _step2.value;

          if (_cookie3 === '' || _cookie3.indexOf('#') === 0) continue;
          _cookie3 = _cookie3.split('\t');

          var _cookie4 = _cookie3,
              _cookie5 = _slicedToArray(_cookie4, 7),
              domain = _cookie5[0],
              /* flag */_path2 = _cookie5[2],
              secure = _cookie5[3],
              /* expiration */name = _cookie5[5],
              value = _cookie5[6];

          domain = domain.replace(/^\./, '');
          secure = secure === 'TRUE';

          var _cookieUrl = 'http' + (secure ? 's' : '') + '://' + domain + _path2;
          jar.setCookie(_request3.default.cookie(name + '=' + value), _cookieUrl);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return jar;
    }
  }, {
    key: 'request',
    value: function request(method, path) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      options = this._options(options);

      options.method = method.toUpperCase();
      options.url = path;

      return this._promisify((0, _request3.default)(options));
    }
  }, {
    key: 'post',
    value: function post(path) {
      var body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (body) {
        options.body = body;
        options.json = true;
      }

      return this.request('POST', path, options);
    }
  }, {
    key: 'get',
    value: function get(path) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.request('GET', path, options);
    }
  }, {
    key: 'doAuth',
    value: function doAuth(_ref) {
      var email = _ref.email,
          password = _ref.password;

      return API.post('/users/login', { email: email, password: password }).then(function (_ref2) {
        var data = _ref2.data,
            response = _ref2.response;

        if (data && data.email === email) {
          var cookies = response.headers['set-cookie'];
          _fs2.default.writeFileSync(_config2.default.cookieFile, JSON.stringify(cookies));
        }
      });
    }
  }, {
    key: 'getUser',
    value: function getUser() {
      return this.post('/users/login');
    }
  }, {
    key: 'getReleaseDownloadName',
    value: function getReleaseDownloadName(creativeId, id, format) {
      var reqUrl = '/creatives/' + creativeId + '/releases/' + id + '/download?release_format=' + format;

      return this.get(reqUrl, { followRedirect: false }).then(function (_ref3) {
        var data = _ref3.data,
            response = _ref3.response;

        if (response.statusCode === 401) {
          throw new Error('You don\'t have permissions to download this.');
        }

        var resUrl = _url2.default.parse(response.headers.location);
        var fileName = decodeURI(_path4.default.basename(resUrl.pathname));

        return fileName;
      });
    }
  }, {
    key: 'getReleaseDownload',
    value: function getReleaseDownload(creativeId, id, format, tick) {
      var _this2 = this;

      return this.getReleaseDownloadName(creativeId, id, format).then(function (fileName) {
        return new Promise(function (resolve, reject) {
          var options = _this2._options();
          options.url = '/creatives/' + creativeId + '/releases/' + id + '/download?release_format=' + format;

          var tmpobj = _tmp2.default.dirSync();
          var filePath = _path4.default.resolve(tmpobj.name, fileName);

          doDownload();

          function doDownload() {
            var retry = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;

            if (retry >= _config2.default.timeout) {
              reject(new Error('Download timed out.'));
              return;
            }

            var total = 0;
            var bytes = 0;

            (0, _request3.default)(options).on('response', function (response) {
              if (response.statusCode === 401) {
                reject(new Error('You don\'t have permissions to download this.'));
                return;
              }
              total = response.headers['content-length'];

              if (response.headers['content-type'] !== 'application/zip') {
                setTimeout(function () {
                  doDownload(retry * 2);
                }, retry);
                return;
              }

              response.on('data', function (data) {
                bytes += data.length;
                tick(bytes, total);
              });

              response.pipe(_fs2.default.createWriteStream(filePath));

              response.on('end', function () {
                resolve(filePath);
              });
            });
          }
        });
      });
    }
  }]);

  return API;
}();

;

exports.default = API;