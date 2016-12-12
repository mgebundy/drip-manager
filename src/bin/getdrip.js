#!/usr/bin/env node

import commander from 'commander';
import chalk from 'chalk';
import url from 'url';
import extract from 'extract-zip';
import path from 'path';
import tmp from 'tmp';
import inquirer from 'inquirer';

import API from '../lib/api';
import Cleanup from '../lib/cleanup';
import Utils from '../lib/utils';
import appCfg from '../lib/config';
import pjson from '../../package.json';

const log = console.log;
const error = chalk.bold.red;

let reqUrl;

commander
  .version(pjson.version)
  .usage('[options] <url,file>')
  .arguments('<url>')
  .action((cmdUrl) => {
    reqUrl = cmdUrl;
  })
  .parse(process.argv);

function Authentication () {
  return API.getUser().catch(() => {
    log('Let\'s log in to Drip.');

    return inquirer
    .prompt([
      {
        name: 'email',
        message: 'Email Address',
        validate (input) {
          let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(input);
        }
      },
      { name: 'password', message: 'Password', type: 'password' }
    ])
    .then(API.doAuth)
    .catch(err => {
      log(error(err));
      throw new Error('Unable to Authenticate');
    });
  });
};

function getRelease () {
  if (typeof reqUrl === 'undefined') {
    throw new Error('We need a url or file!');
  }

  if (['http:', 'https:'].indexOf(url.parse(reqUrl).protocol) === -1 &&
    path.extname(reqUrl) === '.zip') {
    log(chalk.blue('Already have a zip file. Extracting...'));
    return reqUrl;
  } else if (url.parse(reqUrl).hostname !== 'drip.kickstarter.com') {
    throw new Error('This URL isn\'t from drip.kickstarter.com');
  } else {
    let reqPath = url.parse(reqUrl).path;
    return API.get(`/creatives${reqPath}`).then(({ data, response }) => {
      data = data.data;
      log(chalk.blue(`Snagging this release by ${data.artist.trim()} for you...`));
      let format = appCfg.preferredFormats[0];

      return API.getReleaseDownload(data.creative_id, data.id, format, (bytes, total) => {
        process.stdout.clearLine();
        process.stdout.write(chalk.blue(`Downloading... ${Math.ceil(bytes / total * 100)}%`));
        process.stdout.cursorTo(0);
      }).then((filePath) => {
        process.stdout.write('\n');
        log(chalk.green('Downloaded.'));
        return filePath;
      });
    });
  }
}

function extractZip (zip) {
  return new Promise(
    function (resolve, reject) {
      let tmpobj = tmp.dirSync();
      let dir = path.resolve(tmpobj.name, path.basename(zip, '.zip'));
      extract(zip, { dir }, (err) => {
        if (err) {
          reject(err);
          return;
        }

        log(chalk.green('Extracted.'));
        resolve(dir);
      });
    }
  );
}

function cleanupDir (newPath) {
  log(chalk.blue('Cleaning things up...'));
  log(chalk.green(path.basename(newPath)));

  let files = Utils.walkDir(newPath);
  let promises = [];

  for (let file of files) {
    let p = Cleanup.track(file).then(audioFile => {
      log(chalk.green(` - ${path.basename(audioFile)}`));
      return audioFile;
    }, ({ e, file }) => {
      log(chalk.blue(` - ${path.basename(file)}`));
      return file;
    });
    promises.push(p);
  }

  return Promise.all(promises).then(() => newPath);
}

Authentication()
.then(getRelease)
.then(extractZip)
.then(Cleanup.album)
.then(cleanupDir)
.then(Cleanup.addToPath)
.then(() => {
  log(chalk.green('Done.'));
})
.catch(err => {
  log(error(err.message));
  process.exit(1);
});
