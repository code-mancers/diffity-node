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

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    debug( 'browser launched ');

    page.setViewport(this.viewPort);
    debug( 'view port set to ', this.viewPort);

    await page.goto(this.url);

    debug( 'naviagted to ', this.url);

    const outputPath = path.join(__dirname, 'tmp', this.identifier +'.png');

    await page.screenshot({path: outputPath, fullPage: true});

    debug( 'screenshot saved ', outputPath);

    browser.close();
    return this;
  }

  createRun(details = {}) {
    if (!details.project) {
      details.project = this.projectName;
    }
    if (!details.name) {
      details.name = `${details.project}-${new Date()}`;
    }
    const query = `project=${details.project}&name=${details.name}&js_driver=${details.js_driver || 'diffity-node'}&group=${details.group || 'group'}&author=${details.author || 'author'}`;
    request
      .post({url: this.apiBaseUrl + `/api/v1/runs?${query}`}, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return console.error('create run failed:', err);
        }
        debug('Run created.', body);
      })
      .auth(this.apiKey, 'X', false);
  }

  upload(screenshotPath) {
    const formData = {
      identifier: this.identifier, 
      image: fs.createReadStream(screenshotPath), 
      browser: this.browser, 
      device: this.device, 
      os: this.os,
      // browser_version: , 
      device_name: this.deviceName, 
      // os_version: 
    };
    request
      .auth(this.apiKey, 'X', false)
      .post({url: this.apiBaseUrl + '/api/v1/run', formData: formData}, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return console.error('upload failed:', err);
        }
        debug('Upload successful!  Server responded with:', body);
      });
  }
}

module.exports = Diffity;