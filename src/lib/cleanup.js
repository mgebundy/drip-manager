import sanitize from 'sanitize-filename';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';

import Utils from './utils';
import Meta from './meta';
import appCfg from './config';

class Cleanup {
  static track (file) {
    return Meta.getMetadata(file).then(metadata => {
      let ext = path.extname(file);
      if (['.flac', '.mp3'].indexOf(ext) === -1) {
        throw new Error(`${file} is not a valid file type`);
      }

      let fileName = _.template(appCfg.templates.track)({
        track: _.padStart(metadata.track.no, 2, 0),
        artist: sanitize(metadata.artist.join(', ')),
        title: sanitize(metadata.title)
      });

      let filePath = path.join(path.dirname(file), `${fileName}${ext}`);

      fs.renameSync(file, filePath);

      return filePath;
    });
  }

  static album (dir) {
    let files = Utils.walkDir(dir);

    return Meta
    .getGlobalDate(files)
    .then(date => {
      // @TODO audio folder template
      return ` (${date})`;
    })
    .then(append => {
      return Meta.getGlobalBitDepth(files).then(bitdepth => {
        if (bitdepth) {
          append += ` [FLAC-${bitdepth}]`;
        } else {
          append += ' [FLAC]';
        }

        return append;
      });
    })
    .then(append => {
      if (path.basename(dir).lastIndexOf(append) !== -1 &&
        path.basename(dir).lastIndexOf(append) === path.basename(dir).length - append.length) {
        return dir;
      }

      let dirName = path.basename(dir) + append;
      let newDir = path.join(path.resolve(dir, '..'), dirName);
      fs.renameSync(dir, newDir);

      return newDir;
    });
  }

  static addToPath (filePath) {
    if (!fs.lstatSync(filePath).isDirectory()) {
      throw new Error({ message: 'Not a directory', code: 'ENOENT' });
    }

    let files = Utils.walkDir(filePath);
    if (files.length === 0) {
      throw new Error('Directory is empty.');
    }

    return Meta.getAlbumArtist(files).then(artist => {
      let artistPath = path.join(appCfg.musicFolder, artist);
      let albumPath = path.join(artistPath, path.basename(filePath));

      if (!fs.existsSync(artistPath)) {
        console.log(chalk.green('New artist. Creating directory.'));
        fs.mkdirSync(artistPath);
      }

      if (fs.existsSync(albumPath)) {
        throw new Error('Album already exists');
      }

      console.log(chalk.green(`Moving "${path.basename(filePath)}" to "${artistPath}"`));
      // @TODO don't spawn 'mv', we need these to be compatible on all platforms yo.
      spawn('mv', [
        filePath,
        albumPath
      ]);

      return albumPath;
    });
  }
};

export default Cleanup;
