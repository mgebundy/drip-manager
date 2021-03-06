#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _extractZip = require('extract-zip');

var _extractZip2 = _interopRequireDefault(_extractZip);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _api = require('../lib/api');

var _api2 = _interopRequireDefault(_api);

var _cleanup = require('../lib/cleanup');

var _cleanup2 = _interopRequireDefault(_cleanup);

var _utils = require('../lib/utils');

var _utils2 = _interopRequireDefault(_utils);

var _config = require('../lib/config');

var _config2 = _interopRequireDefault(_config);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = console.log;
var error = _chalk2.default.bold.red;

var reqUrl = void 0;

_commander2.default.version(_package2.default.version).usage('[options] <url,file>').arguments('<url>').action(function (cmdUrl) {
  reqUrl = cmdUrl;
}).parse(process.argv);

function Authentication() {
  return _api2.default.getUser().catch(function () {
    log('Let\'s log in to Drip.');

    return _inquirer2.default.prompt([{
      name: 'email',
      message: 'Email Address',
      validate: function validate(input) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(input);
      }
    }, { name: 'password', message: 'Password', type: 'password' }]).then(_api2.default.doAuth).catch(function (err) {
      log(error(err));
      throw new Error('Unable to Authenticate');
    });
  });
};

function getRelease() {
  if (typeof reqUrl === 'undefined') {
    throw new Error('We need a url or file!');
  }

  if (['http:', 'https:'].indexOf(_url2.default.parse(reqUrl).protocol) === -1 && _path2.default.extname(reqUrl) === '.zip') {
    log(_chalk2.default.blue('Already have a zip file. Extracting...'));
    return reqUrl;
  } else if (_url2.default.parse(reqUrl).hostname !== 'drip.kickstarter.com') {
    throw new Error('This URL isn\'t from drip.kickstarter.com');
  } else {
    var reqPath = _url2.default.parse(reqUrl).path;
    return _api2.default.get('/creatives' + reqPath).then(function (_ref) {
      var data = _ref.data,
          response = _ref.response;

      data = data.data;
      log(_chalk2.default.blue('Snagging this release by ' + data.artist.trim() + ' for you...'));
      var format = _config2.default.preferredFormats[0];

      return _api2.default.getReleaseDownload(data.creative_id, data.id, format, function (bytes, total) {
        process.stdout.clearLine();
        process.stdout.write(_chalk2.default.blue('Downloading... ' + Math.ceil(bytes / total * 100) + '%'));
        process.stdout.cursorTo(0);
      }).then(function (filePath) {
        process.stdout.write('\n');
        log(_chalk2.default.green('Downloaded.'));
        return filePath;
      });
    });
  }
}

function extractZip(zip) {
  return new Promise(function (resolve, reject) {
    var tmpobj = _tmp2.default.dirSync();
    var dir = _path2.default.resolve(tmpobj.name, _path2.default.basename(zip, '.zip'));
    (0, _extractZip2.default)(zip, { dir: dir }, function (err) {
      if (err) {
        reject(err);
        return;
      }

      log(_chalk2.default.green('Extracted.'));
      resolve(dir);
    });
  });
}

function cleanupDir(newPath) {
  log(_chalk2.default.blue('Cleaning things up...'));
  log(_chalk2.default.green(_path2.default.basename(newPath)));

  var files = _utils2.default.walkDir(newPath);
  var promises = [];

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var file = _step.value;

      var p = _cleanup2.default.track(file).then(function (audioFile) {
        log(_chalk2.default.green(' - ' + _path2.default.basename(audioFile)));
        return audioFile;
      }, function (_ref2) {
        var e = _ref2.e,
            file = _ref2.file;

        log(_chalk2.default.blue(' - ' + _path2.default.basename(file)));
        return file;
      });
      promises.push(p);
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

  return Promise.all(promises).then(function () {
    return newPath;
  });
}

Authentication().then(getRelease).then(extractZip).then(_cleanup2.default.album).then(cleanupDir).then(_cleanup2.default.addToPath).then(function () {
  log(_chalk2.default.green('Done.'));
}).catch(function (err) {
  log(error(err.message));
  process.exit(1);
});