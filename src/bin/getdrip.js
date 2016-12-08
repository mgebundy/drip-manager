#!/usr/bin/env node

import commander from 'commander';
import chalk from 'chalk';
import url from 'url';
import extract from 'extract-zip';
import path from 'path';
import tmp from 'tmp';
import inquirer from 'inquirer';

import Scraper from '../lib/scraper';
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
      if (!Scraper.isAuth()) {
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
        ]).then(answers => {
          Scraper.doAuth(answers).then(resolve).catch(reject);
        });
      } else {
        resolve(true);
      }
    }
  );
};

getAuthentication().then(res => {
  log('Logged In.');
  if (typeof reqUrl === 'undefined') {
    log(error('We need a url or file!'));
    process.exit(1);
  }
}).catch(err => {
  log(error('Unable to Authenticate.'));
  log(error(err));
  process.exit(1);
});
//
// if (['http:', 'https:'].indexOf(url.parse(reqUrl).protocol) === -1 &&
//   path.extname(reqUrl) === '.zip') {
//   log(chalk.blue('Already have a zip file. Extracting...'));
//   extractZip(reqUrl);
// } else if (url.parse(reqUrl).hostname !== 'drip.kickstarter.com') {
//   log(error('This URL isn\'t from drip.kickstarter.com'));
//   process.exit(1);
// } else {
//   Scraper.getDrip(reqUrl, (response) => {
//     let data = response.data;
//     if (!data || !data.id) {
//       log(error('Can\'t find this...'));
//       process.exit(1);
//     }
//     log(chalk.blue(`Snagging this release by ${data.artist.trim()} for you...`));
//
//     getZip(data.creative_id, data.id);
//   });
// }
//
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
