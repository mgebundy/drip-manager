'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sanitizeFilename = require('sanitize-filename');

var _sanitizeFilename2 = _interopRequireDefault(_sanitizeFilename);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _child_process = require('child_process');

var _avprobe = require('./avprobe');

var _avprobe2 = _interopRequireDefault(_avprobe);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _meta = require('./meta');

var _meta2 = _interopRequireDefault(_meta);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cleanup = function () {
  function Cleanup() {
    _classCallCheck(this, Cleanup);
  }

  _createClass(Cleanup, null, [{
    key: 'audioFile',
    value: function audioFile(file) {
      var meta = (0, _avprobe2.default)(file);
      var format = meta.format.format_name;

      if (['flac', 'mp3'].indexOf(format) === -1) {
        throw new Error(file + ' is not a valid file type');
      }

      var tags = meta.format.tags;

      var fileName = _lodash2.default.template(_config2.default.templates.track)({
        track: _lodash2.default.padStart(tags.track, 2, 0),
        artist: (0, _sanitizeFilename2.default)(tags.ARTIST),
        title: (0, _sanitizeFilename2.default)(tags.TITLE),
        format: format
      });

      var filePath = _path2.default.join(_path2.default.dirname(file), fileName);

      _fs2.default.renameSync(file, filePath);

      return filePath;
    }
  }, {
    key: 'audioFolder',
    value: function audioFolder(dir) {
      var files = _utils2.default.walkDir(dir);

      var date = _meta2.default.getGlobalDate(files);

      // @TODO audio folder template
      var append = ' (' + date + ')';

      var bitdepth = null;
      if (_config2.default.dependencies.metaflac) {
        bitdepth = _meta2.default.getGlobalBitDepth(files);
      }
      if (bitdepth) {
        append += ' [FLAC-' + (0, _sanitizeFilename2.default)(bitdepth) + ']';
      } else {
        append += ' [FLAC]';
      }

      if (_path2.default.basename(dir).lastIndexOf(append) !== -1 && _path2.default.basename(dir).lastIndexOf(append) === _path2.default.basename(dir).length - append.length) {
        return dir;
      }

      var dirName = _path2.default.basename(dir) + append;
      var newDir = _path2.default.join(_path2.default.resolve(dir, '..'), dirName);
      _fs2.default.renameSync(dir, newDir);

      return newDir;
    }
  }, {
    key: 'addToPath',
    value: function addToPath(filePath) {
      if (!_fs2.default.lstatSync(filePath).isDirectory()) {
        throw new Error({ message: 'Not a directory', code: 'ENOENT' });
      }

      var files = _utils2.default.walkDir(filePath);
      if (files.length === 0) {
        throw new Error('Directory is empty.');
      }

      var artist = _meta2.default.getAlbumArtist(files);

      var artistPath = _path2.default.join(_config2.default.musicFolder, artist);
      var albumPath = _path2.default.join(artistPath, _path2.default.basename(filePath));

      if (!_fs2.default.existsSync(artistPath)) {
        console.log(_chalk2.default.green('New artist. Creating directory.'));
        _fs2.default.mkdirSync(artistPath);
      }

      if (_fs2.default.existsSync(albumPath)) {
        throw new Error('Album already exists');
      }

      console.log(_chalk2.default.green('Moving "' + _path2.default.basename(filePath) + '" to "' + artistPath + '"'));
      // @TODO don't spawn 'mv', we need these to be compatible on all platforms yo.
      (0, _child_process.spawn)('mv', [filePath, albumPath]);

      return albumPath;
    }
  }]);

  return Cleanup;
}();

;

exports.default = Cleanup;