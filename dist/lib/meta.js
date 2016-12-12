'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _child_process = require('child_process');

var _musicmetadata = require('musicmetadata');

var _musicmetadata2 = _interopRequireDefault(_musicmetadata);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _avprobe = require('./avprobe');

var _avprobe2 = _interopRequireDefault(_avprobe);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Meta = function () {
  function Meta() {
    _classCallCheck(this, Meta);
  }

  _createClass(Meta, null, [{
    key: 'getMetadata',
    value: function getMetadata(file) {
      return new Promise(function (resolve, reject) {
        var stream = _fs2.default.createReadStream(file);
        (0, _musicmetadata2.default)(stream, function (err, metadata) {
          if (err) reject({ err: err, file: file });
          resolve(metadata);
          stream.close();
        });
      });
    }
  }, {
    key: 'getGlobalBitDepth',
    value: function getGlobalBitDepth(files) {
      var bitdepth = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var file = _step.value;

          var ext = _path2.default.extname(file);

          if (ext === '.flac') {
            var bd = (0, _child_process.execSync)('metaflac --show-bps "' + file + '"', {
              encoding: 'utf8'
            });

            if (bd > bitdepth) {
              bitdepth = bd;
            }
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

      return bitdepth;
    }
  }, {
    key: 'getGlobalDate',
    value: function getGlobalDate(files) {
      var promises = [];

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = files[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var file = _step2.value;

          var p = Meta.getMetadata(file);
          promises.push(p);
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

      return _utils2.default.oneSuccess(promises).then(function (metadata) {
        return metadata.year;
      });
    }
  }, {
    key: 'getAlbumArtist',
    value: function getAlbumArtist(files) {
      var promises = [];

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = files[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var file = _step3.value;

          var p = Meta.getMetadata(file).then(function (metadata) {
            if (metadata.albumartist.length > 0) {
              return metadata.albumartist.join(', ');
            } else if (metadata.artist.length > 0) {
              return metadata.artist.join(', ');
            } else {
              throw new Error('No Album Artist or Artist field');
            }
          });
          promises.push(p);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return _utils2.default.oneSuccess(promises).catch(function () {
        return 'Unknown Artist';
      });
    }
  }]);

  return Meta;
}();

;

exports.default = Meta;