const path = require('path');
const fs = require('fs');

const axios = require('axios');
const FormData = require('form-data');
const puppeteer = require('puppeteer');
const debug = require('debug')('diffity:screenshoter');

class Diffity {
  constructor(options = {}) {
    this.setOptions(options);
  }

  async setOptions(opts = {}) {
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
  }

  async start() {
    this.headlessBrowser = await puppeteer.launch();
    this.page =  await this.headlessBrowser.newPage();

    debug( 'browser launched ');

    this.page.setViewport(this.viewPort);
    debug( 'view port set to ', this.viewPort);


    return this;
  }

  end() {
    this.headlessBrowser.close();
    this._updateStatus();
  }

  _updateStatus(status = "completed") {
    return axios.put(this.apiBaseUrl + `/api/v1/runs/${this.currentRunId}/status`, { status }, {
      auth: {
        username: this.apiKey,
        password: 'X'
      }
    })
    .then((response) => {
      if(response.data.id) {
        debug('Run status updated successfully :: ', response.data.screenshot_progress);
        return response.data;
      }
      debug('Run status updated failed :: ', response.data);
      return response.data;
    })
  }

  _validateProps() {
    if (!this.apiKey) {
      throw new Error('Missing mandatory property :: apiKey');
    }
    if (!this.projectName) {
      throw new Error('Missing mandatory property :: projectName');
    }
  }

  async loadUrl(url) {
    if (!this.page) {
      await this.start();
    }
    debug( 'navigating to ', url);
    return this.page.goto(url);
  }

  async screenshot(identifier) {
    this._validateProps();

    const outputPath = path.join(__dirname, 'tmp', identifier +'.png');

    await this.page.screenshot({path: outputPath, fullPage: true});
    debug( 'screenshot saved ', outputPath);

    return this.upload(outputPath, identifier);
  }

  uploadAll() {
    this.uploadQueue.forEach(uploadImage => {
      this.upload(uploadImage.outputPath, uploadImage.identifier);
    });
  }

  createRun(details = {}) {
    const runDetails = {
      project: this.projectName,
      name: `${details.project || this.projectName}-${new Date()}`,
      js_driver: 'diffity-node',
      group: 'group',
      author: 'author',
      ...details,
    }

    debug( 'creating run with name ', runDetails.name);

    return axios
      .post(this.apiBaseUrl + `/api/v1/runs`, runDetails, {
        auth: {
          username: this.apiKey,
          password: 'X'
        }
      })
      .then((response) => {
        if(response.data.id) {
          debug('Run created :: ', response.data.id);
          return response.data;
        }
      })
  }

  async upload(screenshotPath, identifier) {
    if (!this.currentRunId) {
      const { id } = await this.createRun();
      this.currentRunId = id;
    }

    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("browser", this.browser);
    formData.append("device", this.device);
    formData.append("os", this.os);
    formData.append("device_name", this.deviceName);
    formData.append("image", fs.createReadStream(screenshotPath));

    debug( 'uploading screenshot ', screenshotPath);

    return axios
      .post(this.apiBaseUrl + `/api/v1/runs/${this.currentRunId}/run_images`, formData, {
        headers: formData.getHeaders(),
        auth: {
          username: this.apiKey,
          password: 'X'
        }
      })
      .then(response => {
        const repsonseData = response.data.data;
        if(repsonseData.run_id) {
          debug('Upload successful!  Server responded with:', repsonseData.run_id);
          return repsonseData;
        }
        debug('Upload failed!  Server responded with:', repsonseData);
        return repsonseData;
      });
  }
}

module.exports = Diffity;
