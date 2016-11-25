'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _child_process = require('child_process');

function avprobe(file) {
  var meta = (0, _child_process.execSync)('avprobe -show_format -of json "' + file + '"', {
    stdio: [0]
  });

  return JSON.parse(meta);
}

exports.default = avprobe;