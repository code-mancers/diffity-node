diffity
======================

    Commandline utility for Diffity

### Install

```
npm install -g diffity-node
```

### Sample Usage

```js
// example.js
const Diffity = require('diffity-node');

(async () =>{
  const diffity = new Diffity({
    apiKey: "api-key", apiBaseUrl: 'http://localhost:4000', projectName: 'Diffity Node'
  });
  await diffity.loadUrl('https://www.codemancers.com/why_us/index.html');
  await diffity.screenshot('homepage');

  await diffity.loadUrl('https://www.codemancers.com/portfolio/index.html');
  await diffity.screenshot('portfolio');

  await diffity.loadUrl('https://www.codemancers.com/contact/index.html');
  await diffity.screenshot('contact');

  await diffity.loadUrl('https://crypt.codemancers.com/');
  await diffity.screenshot('blog');

  diffity.end();
})()
```

and run the command

```
DEBUG=diffity:* node example.js
```

License
-------
Please see [License](https://gitlab.com/codemancers/diffity-node/blob/master/License)

