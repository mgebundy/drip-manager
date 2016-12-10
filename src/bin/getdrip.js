#!/usr/bin/env node

import commander from 'commander';
import chalk from 'chalk';
import url from 'url';
import extract from 'extract-zip';
import path from 'path';
import tmp from 'tmp';
import inquirer from 'inquirer';

import Scraper from '../lib/scraper';
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

function getAuthentication () {
  return new Promise(
    function (resolve, reject) {
      API.getUser().then(() => {
        resolve(true);
      }, () => {
        log('Let\'s log in to Drip.');

        inquirer
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
        .then(resolve, reject);
      });
    }
  );
};

function getRelease () {
  return new Promise(
    function (resolve, reject) {
      if (['http:', 'https:'].indexOf(url.parse(reqUrl).protocol) === -1 &&
        path.extname(reqUrl) === '.zip') {
        log(chalk.blue('Already have a zip file. Extracting...'));
        resolve(reqUrl);
        // extractZip(reqUrl);
      } else if (url.parse(reqUrl).hostname !== 'drip.kickstarter.com') {
        throw new Error('This URL isn\'t from drip.kickstarter.com');
      } else {
        let reqPath = url.parse(reqUrl).path;
        API.get(`/creatives${reqPath}`).then(({data, response}) => {
          data = data.data;
          if (!data || !data.id) {
            throw new Error('Can\'t find this release...');
          }
          log(chalk.blue(`Snagging this release by ${data.artist.trim()} for you...`));
          // getZip(data.creative_id, data.id);
        }, reject);
      }
    }
  );
}

getAuthentication()
.catch(err => {
  log(error('Unable to Authenticate.'));
  log(error(err));
  process.exit(1);
})
.then(res => {
  if (typeof reqUrl === 'undefined') {
    throw new Error('We need a url or file!');
  }
})
.then(getRelease)
// .then(extractZip)
.catch(err => {
  log(error(err.message));
  process.exit(1);
});

// function getZip (creativeId, id) {
//   Scraper.getDripDownload(creativeId, id, (err, response) => {
//     if (err) {
//       log(error(err.message));
//       process.exit(1);
//     }
//
//     log(chalk.blue('Got the zip. Extracting...'));
//     extractZip(response);
//   });
// }
//
// function extractZip (zip) {
//   let tmpobj = tmp.dirSync();
//   let dir = path.resolve(tmpobj.name, path.basename(zip, '.zip'));
//   extract(zip, { dir }, (err) => {
//     if (err) {
//       log(error(err.message));
//       process.exit(1);
//     }
//
//     log(chalk.green('Downloaded and extracted.'));
//     cleanupDir(dir);
//   });
// }
//
// function cleanupDir (dir) {
//   log(chalk.blue('Cleaning things up...'));
//
//   let newPath = dir;
//   if (appCfg.dependencies.avprobe) {
//     newPath = Cleanup.audioFolder(dir);
//   } else {
//     log(chalk.yellow('Can\'t find avprobe, so no files can be cleaned up.'));
//   }
//   log(chalk.green(path.basename(newPath)));
//
//   let files = Utils.walkDir(newPath);
//   for (let file of files) {
//     try {
//       let audioFile = Cleanup.audioFile(file);
//       log(chalk.green(` - ${path.basename(audioFile)}`));
//     } catch (e) {
//       log(chalk.blue(` - ${path.basename(file)}`));
//     }
//   }
//
//   Cleanup.addToPath(newPath);
//   log(chalk.green('Done.'));
// }
