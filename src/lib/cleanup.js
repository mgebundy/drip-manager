import sanitize from 'sanitize-filename';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';

import avprobe from './avprobe';
import Utils from './utils';
import Meta from './meta';
import appCfg from './config';

class Cleanup {
  static audioFile (file) {
    let meta = avprobe(file);
    let format = meta.format.format_name;

    if (['flac', 'mp3'].indexOf(format) === -1) {
      throw new Error(`${file} is not a valid file type`);
    }

    let tags = meta.format.tags;

    let fileName = _.template(appCfg.templates.track)({
      track: _.padStart(tags.track, 2, 0),
      artist: sanitize(tags.ARTIST),
      title: sanitize(tags.TITLE),
      format
    });

    let filePath = path.join(path.dirname(file), fileName);

    fs.renameSync(file, filePath);

    return filePath;
  }

  static audioFolder (dir) {
    let files = Utils.walkDir(dir);

    let date = Meta.getGlobalDate(files);

    // @TODO audio folder template
    let append = ` (${date})`;

    let bitdepth = null;
    if (appCfg.dependencies.metaflac) {
      bitdepth = Meta.getGlobalBitDepth(files);
    }
    if (bitdepth) {
      append += ` [FLAC-${sanitize(bitdepth)}]`;
    } else {
      append += ' [FLAC]';
    }

    if (path.basename(dir).lastIndexOf(append) !== -1 &&
      path.basename(dir).lastIndexOf(append) === path.basename(dir).length - append.length) {
      return dir;
    }

    let dirName = path.basename(dir) + append;
    let newDir = path.join(path.resolve(dir, '..'), dirName);
    fs.renameSync(dir, newDir);

    return newDir;
  }

  static addToPath (filePath) {
    if (!fs.lstatSync(filePath).isDirectory()) {
      throw new Error({ message: 'Not a directory', code: 'ENOENT' });
    }

    let files = Utils.walkDir(filePath);
    if (files.length === 0) {
      throw new Error('Directory is empty.');
    }

    let artist = Meta.getAlbumArtist(files);

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
  }
};

export default Cleanup;
