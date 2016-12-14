import rc from 'rc';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { spawnSync } from 'child_process';

let userHome = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
let configFolder = path.resolve(userHome, '.config', 'drip-manager');

// Ensure config folder exists
function isDir (dpath) {
  try {
    return fs.lstatSync(dpath).isDirectory();
  } catch (e) {
    return false;
  }
};

function mkdirp (dirname) {
  dirname = path.normalize(dirname).split(path.sep);
  dirname.forEach((sdir, index) => {
    var pathInQuestion = dirname.slice(0, index + 1).join(path.sep);
    if ((!isDir(pathInQuestion)) && pathInQuestion) fs.mkdirSync(pathInQuestion);
  });
};

mkdirp(configFolder);

let appCfg = rc('drip-manager', {
  cookieFile: path.join(configFolder, 'cookies'),
  musicFolder: path.join(userHome, 'Music'),
  preferredFormats: ['flac', 'wav'],
  templates: {
    track: '${track} ${artist} - ${title}'
  },
  timeout: 30 * 1000
}, null);

appCfg.dependencies = {};

let checkDependencies = {
  metaflac: ['--version']
};

for (let dep of _.keys(checkDependencies)) {
  let call = spawnSync(dep, checkDependencies[dep]);

  if (call.error) appCfg.dependencies[dep] = false;
  else appCfg.dependencies[dep] = true;
}

export default appCfg;
