'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

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
    key: 'getDrip',
    value: function getDrip(reqUrl, callback) {
      var jar = _api2.default.getCookieJar();
      var reqPath = _url2.default.parse(reqUrl).path;

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
      var jar = _api2.default.getCookieJar();
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
        var resUrl = _url2.default.parse(response.headers.location);
        var fileName = decodeURI(_path2.default.basename(resUrl.pathname));

        var tmpobj = _tmp2.default.dirSync();
        var filePath = _path2.default.resolve(tmpobj.name, fileName);

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