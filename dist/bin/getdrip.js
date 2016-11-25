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

var _scraper = require('../lib/scraper');

var _scraper2 = _interopRequireDefault(_scraper);

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

if (typeof reqUrl === 'undefined') {
  log(error('We need a url or file!'));
  process.exit(1);
}

if (['http:', 'https:'].indexOf(_url2.default.parse(reqUrl).protocol) === -1 && _path2.default.extname(reqUrl) === '.zip') {
  log(_chalk2.default.blue('Already have a zip file. Extracting...'));
  extractZip(reqUrl);
} else if (_url2.default.parse(reqUrl).hostname !== 'drip.kickstarter.com') {
  log(error('This URL isn\'t from drip.kickstarter.com'));
  process.exit(1);
} else {
  _scraper2.default.getDrip(reqUrl, function (response) {
    var data = response.data;
    if (!data || !data.id) {
      log(error('Can\'t find this...'));
      process.exit(1);
    }
    log(_chalk2.default.blue('Snagging this release by ' + data.artist.trim() + ' for you...'));

    getZip(data.creative_id, data.id);
  });
}

function getZip(creativeId, id) {
  _scraper2.default.getDripDownload(creativeId, id, function (err, response) {
    if (err) {
      log(error(err.message));
      process.exit(1);
    }

    log(_chalk2.default.blue('Got the zip. Extracting...'));
    extractZip(response);
  });
}

function extractZip(zip) {
  var tmpobj = _tmp2.default.dirSync();
  var dir = _path2.default.resolve(tmpobj.name, _path2.default.basename(zip, '.zip'));
  (0, _extractZip2.default)(zip, { dir: dir }, function (err) {
    if (err) {
      log(error(err.message));
      process.exit(1);
    }

    log(_chalk2.default.green('Downloaded and extracted.'));
    cleanupDir(dir);
  });
}

function cleanupDir(dir) {
  log(_chalk2.default.blue('Cleaning things up...'));

  var newPath = dir;
  if (_config2.default.dependencies.avprobe) {
    newPath = _cleanup2.default.audioFolder(dir);
  } else {
    log(_chalk2.default.yellow('Can\'t find avprobe, so no files can be cleaned up.'));
  }
  log(_chalk2.default.green(_path2.default.basename(newPath)));

  var files = _utils2.default.walkDir(newPath);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var file = _step.value;

      try {
        var audioFile = _cleanup2.default.audioFile(file);
        log(_chalk2.default.green(' - ' + _path2.default.basename(audioFile)));
      } catch (e) {
        log(_chalk2.default.blue(' - ' + _path2.default.basename(file)));
      }
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

  _cleanup2.default.addToPath(newPath);
  log(_chalk2.default.green('Done.'));
}