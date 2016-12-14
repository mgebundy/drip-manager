import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import mm from 'musicmetadata';
import flac from 'flac-metadata';

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

  static getFlacStreamInfo (file) {
    return new Promise(
      function (resolve, reject) {
        let reader = fs.createReadStream(file);
        let processor = new flac.Processor({ parseMetaDataBlocks: true });
        let data = {};

        processor.on('postprocess', mdb => {
          if (mdb.type === flac.Processor.MDB_TYPE_STREAMINFO) {
            mdb.isLast = true;
            for (let line of mdb.toString().split('\n')) {
              line = /^([A-Z0-9]*): (.*)/i.exec(line.trim());
              if (line) {
                data[line[1]] = line[2];
              }
            }
            resolve(data);
          }
          reader.close();
        });

        reader.pipe(processor);
      }
    );
  }

  static getGlobalBitDepth (files) {
    let promises = [];

    for (let file of files) {
      let ext = path.extname(file);

      if (ext === '.flac') {
        let p = this.getFlacStreamInfo(file).then(metadata => parseInt(metadata.bitsPerSample));
        promises.push(p);
      }
    }

    return Promise.all(promises).then(values => _.max(values));
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
