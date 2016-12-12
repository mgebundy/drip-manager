import { execSync } from 'child_process';
import mm from 'musicmetadata';
import fs from 'fs';
import path from 'path';

import Utils from './utils';

class Meta {
  static getMetadata (file) {
    return new Promise(
      function (resolve, reject) {
        let stream = fs.createReadStream(file);
        mm(stream, function (err, metadata) {
          if (err) reject({err, file});
          resolve(metadata);
          stream.close();
        });
      }
    );
  }

  static getGlobalBitDepth (files) {
    let bitdepth = 0;
    for (let file of files) {
      let ext = path.extname(file);

      if (ext === '.flac') {
        let bd = execSync(`metaflac --show-bps "${file}"`, {
          encoding: 'utf8'
        });

        if (bd > bitdepth) {
          bitdepth = bd;
        }
      }
    }

    return bitdepth;
  }

  static getGlobalDate (files) {
    let promises = [];

    for (let file of files) {
      let p = Meta.getMetadata(file);
      promises.push(p);
    }

    return Utils.oneSuccess(promises).then(metadata => metadata.year);
  }

  static getAlbumArtist (files) {
    let promises = [];

    for (let file of files) {
      let p = Meta.getMetadata(file).then(metadata => {
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

    return Utils.oneSuccess(promises).catch(() => 'Unknown Artist');
  }
};

export default Meta;
