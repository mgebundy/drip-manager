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

  static oneSuccess (promises) {
    return Promise.all(promises.map(p => {
      // If a request fails, count that as a resolution so it will keep
      // waiting for other possible successes. If a request succeeds,
      // treat it as a rejection so Promise.all immediately bails out.
      return p.then(
        val => Promise.reject(val),
        err => Promise.resolve(err)
      );
    })).then(
      // If '.all' resolved, we've just got an array of errors.
      errors => Promise.reject(errors),
      // If '.all' rejected, we've got the result we wanted.
      val => Promise.resolve(val)
    );
  }
};

export default Utils;
