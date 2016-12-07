import rc from 'rc';
import path from 'path';
import _ from 'lodash';
import { spawnSync } from 'child_process';

let userHome = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];

let appCfg = rc('drip-manager', {
  cookieFile: path.join(userHome, 'cookies.txt'),
  musicFolder: path.join(userHome, 'Music'),
  preferredFormats: ['flac', 'wav'],
  templates: {
    track: '${track} ${artist} - ${title}.${format}'
  },
  timeout: 30 * 1000
}, null);

appCfg.dependencies = {};

let checkDependencies = {
  avprobe: ['-version'],
  metaflac: ['--version']
};

for (let dep of _.keys(checkDependencies)) {
  let call = spawnSync(dep, checkDependencies[dep]);

  if (call.error) appCfg.dependencies[dep] = false;
  else appCfg.dependencies[dep] = true;
}

export default appCfg;
