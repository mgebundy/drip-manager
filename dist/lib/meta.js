'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _child_process = require('child_process');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _musicmetadata = require('musicmetadata');

var _musicmetadata2 = _interopRequireDefault(_musicmetadata);

var _flacMetadata = require('flac-metadata');

var _flacMetadata2 = _interopRequireDefault(_flacMetadata);

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
    key: 'getFlacStreamInfo',
    value: function getFlacStreamInfo(file) {
      return new Promise(function (resolve, reject) {
        var reader = _fs2.default.createReadStream(file);
        var processor = new _flacMetadata2.default.Processor({ parseMetaDataBlocks: true });
        var data = {};

        processor.on('postprocess', function (mdb) {
          if (mdb.type === _flacMetadata2.default.Processor.MDB_TYPE_STREAMINFO) {
            mdb.isLast = true;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = mdb.toString().split('\n')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var line = _step.value;

                line = /^([A-Z0-9]*): (.*)/i.exec(line.trim());
                if (line) {
                  data[line[1]] = line[2];
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

            resolve(data);
          }
          reader.close();
        });

        reader.pipe(processor);
      });
    }
  }, {
    key: 'getGlobalBitDepth',
    value: function getGlobalBitDepth(files) {
      var promises = [];

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = files[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var file = _step2.value;

          var ext = _path2.default.extname(file);

          if (ext === '.flac') {
            var p = this.getFlacStreamInfo(file).then(function (metadata) {
              console.log(metadata);
              return parseInt(metadata.bitsPerSample);
            }, function (someerr) {
              console.log('ERROR', someerr);
            });
            promises.push(p);
          }
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

      console.log('promises', promises.length);

      return Promise.all(promises).then(function (values) {
        return _lodash2.default.max(values);
      });
    }
  }, {
    key: 'getGlobalDate',
    value: function getGlobalDate(files) {
      var promises = [];

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = files[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var file = _step3.value;

          var p = Meta.getMetadata(file);
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

      return _utils2.default.oneSuccess(promises).then(function (metadata) {
        return metadata.year;
      });
    }
  }, {
    key: 'getAlbumArtist',
    value: function getAlbumArtist(files) {
      var promises = [];

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = files[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var file = _step4.value;

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
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
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