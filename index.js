const path = require('path');
const fs = require('fs');

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
    this._validateProps();

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    debug( 'browser launched ');

    page.setViewport(this.viewPort);
    debug( 'view port set to ', this.viewPort);

    await page.goto(this.url);

    debug( 'naviagted to ', this.url);

    const outputPath = path.join(__dirname, 'tmp', identifier +'.png');

    await page.screenshot({path: outputPath, fullPage: true});

    debug( 'screenshot saved ', outputPath);

    browser.close();
    return this;
  }
}

module.exports = Diffity;