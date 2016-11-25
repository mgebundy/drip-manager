import fs from 'fs';
import path from 'path';

class Utils {
  static walkDir (dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    for (let file of list) {
      if (/^\..*/i.test(file)) {
        continue;
      }
      file = path.resolve(dir, file);
      let stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        let res = Utils.walkDir(file);
        results = results.concat(res);
      } else {
        results.push(file);
      }
    }
    return results;
  }

  static getIfObj (key) {
    if (this instanceof String) {
      return this.valueOf();
    }

    if (typeof this === 'string') {
      return this;
    }

    return this[key];
  }
};

export default Utils;
