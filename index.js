const path = require('path');
const fs = require('fs');

const request = require('request');
const puppeteer = require('puppeteer');
const debug = require('debug')('diffity:screenshoter');

class Diffity {
  constructor(options = {}) {
    this.setOptions(options);
  }

  setOptions(opts = {}) {
    const options = {
      os: 'linux',
      browser: 'chrome',
      deviceName: '',
      viewPort: {width: 1024, height: 768},
      device: 'desktop',
      apiBaseUrl: 'https://diffity.herokuapp.com',
      ...opts
    }


    this.viewPort = options.viewPort;
    this.apiKey = options.apiKey;
    this.os = options.os;
    this.browser = options.browser;
    this.deviceName = options.deviceName;
    this.device = options.device;
    this.projectName = options.projectName;
    this.apiBaseUrl = options.apiBaseUrl;
    this.currentRunId = null;

    this.uploadQueue = [];
    this.browser = await puppeteer.launch();
    this.page =  await browser.newPage();

    debug( 'browser launched ');
  }

  _validateProps() {
    if (!this.apiKey) {
      throw new Error('Missing mandatory property :: apiKey');
    }
    if (!this.projectName) {
      throw new Error('Missing mandatory property :: projectName');
    }
    if (!this.url) {
      throw new Error('Missing URL :: use loadUrl to set');
    }
  }

  loadUrl(url) {
    this.url = url;
    return this;
  }

  async screenshot(identifier) {
    this.identifier = identifier;
    this._validateProps();

    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // debug( 'browser launched ');

    this.page.setViewport(this.viewPort);
    debug( 'view port set to ', this.viewPort);

    await this.page.goto(this.url);

    debug( 'naviagted to ', this.url);

    const outputPath = path.join(__dirname, 'tmp', this.identifier +'.png');

    await this.page.screenshot({path: outputPath, fullPage: true});

    debug( 'screenshot saved ', outputPath);
    this.uploadQueue.push(outputPath);

    // this.upload(outputPath);

    // browser.close();
    return this;
  }

  uploadAll() {
    this.uploadQueue.forEach(uploadImage => {
      this.upload(uploadImage);
    });
  }

  createRun(details = {}) {
    if (!details.project) {
      details.project = this.projectName;
    }
    if (!details.name) {
      details.name = `${details.project}-${new Date()}`;
    }
    debug( 'creating run with name ', details.name);
    const query = `project=${details.project}&name=${details.name}&js_driver=${details.js_driver || 'diffity-node'}&group=${details.group || 'group'}&author=${details.author || 'author'}`;
    return new Promise((resolve, reject) => {
      request
        .post({url: this.apiBaseUrl + `/api/v1/runs?${query}`}, function optionalCallback(err, httpResponse, body) {
          if (err) {
            console.error('create run failed:', err);
            return reject(new Error("Create Run Failed"));
          }
          const response = JSON.parse(body);
          if(response.id) {
            debug('Run created :: ', response.id);
            return resolve(response.id);
          }
          debug('Run create failed :: ', errors);
          return reject(errors);
        })
        .auth(this.apiKey, 'X', false);
      });
  }

  async upload(screenshotPath) {
    const formData = {
      identifier: this.identifier,
      image: {
        value: fs.createReadStream(screenshotPath),
        options: {
          contentLength: 0,
          contentType: "image/png"
        }
      },
      // attachments: [
      //   fs.createReadStream(screenshotPath)
      // ],
      browser: this.browser,
      device: this.device,
      os: this.os,
      // browser_version: ,
      device_name: this.deviceName,
      // os_version:
      // multipart: [
      //   {body: fs.createReadStream(screenshotPath)},
      // ]
    };

    if (!this.currentRunId) {
      this.currentRunId = await this.createRun();
    }

    debug( 'uploding screenshot ', screenshotPath);
    return new Promise((resolve, reject) =>{
      request
        .post({url: this.apiBaseUrl + `/api/v1/runs/${this.currentRunId}/run_images`, formData: formData}, function optionalCallback(err, httpResponse, body) {
          if (err) {
            console.error('upload failed:', err);
            return reject(new Error('Upload Failed'));
          }
          debug(body);
          try {
            const response = JSON.parse(body);

            if(response.data) {
              debug('Upload successful!  Server responded with:', body);
              return resolve(response);
            }
            debug('Upload failed!  Server responded with:', body);
            return reject(response);
          } catch(e) {}
        })
        .auth(this.apiKey, 'X', false);
    })

  }
}

module.exports = Diffity;
