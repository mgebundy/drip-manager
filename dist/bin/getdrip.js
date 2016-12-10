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

var _scraper = require('../lib/scraper');

var _scraper2 = _interopRequireDefault(_scraper);

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
  return new Promise(function (resolve, reject) {
    _api2.default.getUser().then(function () {
      resolve(true);
    }, function () {
      log('Let\'s log in to Drip.');

      _inquirer2.default.prompt([{
        name: 'email',
        message: 'Email Address',
        validate: function validate(input) {
          var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(input);
        }
      }, { name: 'password', message: 'Password', type: 'password' }]).then(_api2.default.doAuth).then(resolve, reject);
    });
  });
};

function getRelease() {
  if (['http:', 'https:'].indexOf(_url2.default.parse(reqUrl).protocol) === -1 && _path2.default.extname(reqUrl) === '.zip') {
    log(_chalk2.default.blue('Already have a zip file. Extracting...'));
    return reqUrl;
    // extractZip(reqUrl);
  } else if (_url2.default.parse(reqUrl).hostname !== 'drip.kickstarter.com') {
    throw new Error('This URL isn\'t from drip.kickstarter.com');
  } else {
    var reqPath = _url2.default.parse(reqUrl).path;
    return _api2.default.get('/creatives' + reqPath).then(function (_ref) {
      var data = _ref.data,
          response = _ref.response;

      data = data.data;
      log(_chalk2.default.blue('Snagging this release by ' + data.artist.trim() + ' for you...'));
      return _api2.default.getReleaseDownload(data.creative_id, data.id, 'flac', function (bytes, total) {
        process.stdout.clearLine();
        process.stdout.write(_chalk2.default.blue('Downloading... ' + Math.ceil(bytes / total * 100) + '%'));
        process.stdout.cursorTo(0);
      }).then(function () {
        process.stdout.write('\n');
      });
    });
  }
}

Authentication().catch(function (err) {
  log(error('Unable to Authenticate.'));
  log(error(err));
  process.exit(1);
}).then(function (res) {
  if (typeof reqUrl === 'undefined') {
    throw new Error('We need a url or file!');
  }
}).then(getRelease)
// .then(extractZip)
.catch(function (err) {
  log(error(err.message));
  process.exit(1);
});

// function getZip (creativeId, id) {
//   Scraper.getDripDownload(creativeId, id, (err, response) => {
//     if (err) {
//       log(error(err.message));
//       process.exit(1);
//     }
//
//     log(chalk.blue('Got the zip. Extracting...'));
//     extractZip(response);
//   });
// }
//
// function extractZip (zip) {
//   let tmpobj = tmp.dirSync();
//   let dir = path.resolve(tmpobj.name, path.basename(zip, '.zip'));
//   extract(zip, { dir }, (err) => {
//     if (err) {
//       log(error(err.message));
//       process.exit(1);
//     }
//
//     log(chalk.green('Downloaded and extracted.'));
//     cleanupDir(dir);
//   });
// }
//
// function cleanupDir (dir) {
//   log(chalk.blue('Cleaning things up...'));
//
//   let newPath = dir;
//   if (appCfg.dependencies.avprobe) {
//     newPath = Cleanup.audioFolder(dir);
//   } else {
//     log(chalk.yellow('Can\'t find avprobe, so no files can be cleaned up.'));
//   }
//   log(chalk.green(path.basename(newPath)));
//
//   let files = Utils.walkDir(newPath);
//   for (let file of files) {
//     try {
//       let audioFile = Cleanup.audioFile(file);
//       log(chalk.green(` - ${path.basename(audioFile)}`));
//     } catch (e) {
//       log(chalk.blue(` - ${path.basename(file)}`));
//     }
//   }
//
//   Cleanup.addToPath(newPath);
//   log(chalk.green('Done.'));
// }