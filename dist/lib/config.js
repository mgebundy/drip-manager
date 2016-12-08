'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rc = require('rc');

var _rc2 = _interopRequireDefault(_rc);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var userHome = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
var configFolder = _path2.default.resolve(userHome, '.config', 'drip-manager');

// Ensure config folder exists
function isDir(dpath) {
  try {
    return _fs2.default.lstatSync(dpath).isDirectory();
  } catch (e) {
    return false;
  }
};

function mkdirp(dirname) {
  dirname = _path2.default.normalize(dirname).split(_path2.default.sep);
  dirname.forEach(function (sdir, index) {
    var pathInQuestion = dirname.slice(0, index + 1).join(_path2.default.sep);
    if (!isDir(pathInQuestion) && pathInQuestion) _fs2.default.mkdirSync(pathInQuestion);
  });
};

mkdirp(configFolder);

var appCfg = (0, _rc2.default)('drip-manager', {
  cookieFile: _path2.default.join(configFolder, 'cookies'),
  musicFolder: _path2.default.join(userHome, 'Music'),
  preferredFormats: ['flac', 'wav'],
  templates: {
    track: '${track} ${artist} - ${title}.${format}'
  },
  timeout: 30 * 1000
}, null);

appCfg.dependencies = {};

var checkDependencies = {
  avprobe: ['-version'],
  metaflac: ['--version']
};

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  for (var _iterator = _lodash2.default.keys(checkDependencies)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    var dep = _step.value;

    var call = (0, _child_process.spawnSync)(dep, checkDependencies[dep]);

    if (call.error) appCfg.dependencies[dep] = false;else appCfg.dependencies[dep] = true;
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

exports.default = appCfg;