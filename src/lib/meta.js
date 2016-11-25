import { execSync } from 'child_process';

import avprobe from './avprobe';

class Meta {
  static getGlobalBitDepth (files) {
    let bitdepth = 0;
    for (let file of files) {
      let meta = avprobe(file);
      let format = meta.format.format_name;

      if (format === 'flac') {
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
    for (let file of files) {
      let meta = avprobe(file);

      let tags = meta.format.tags;
      if (tags && tags.DATE) {
        return tags.DATE;
      }
    }
  }

  static getAlbumArtist (files) {
    for (let file of files) {
      let meta = avprobe(file);

      let tags = meta.format.tags;
      if (tags && tags.album_artist) {
        return tags.album_artist;
      } else if (tags && tags.ARTIST) {
        return tags.ARTIST;
      }
    }

    return 'Unknown Artist';
  }
};

export default Meta;
