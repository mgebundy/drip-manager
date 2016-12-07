'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rc = require('rc');

var _rc2 = _interopRequireDefault(_rc);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var userHome = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

var appCfg = (0, _rc2.default)('drip-manager', {
  cookieFile: _path2.default.join(userHome, 'cookies.txt'),
  musicFolder: _path2.default.join(userHome, 'Music'),
  preferredFormats: ['flac', 'wav'],
  templates: {
    track: '${track} ${artist} - ${title}.${format}'
  }
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