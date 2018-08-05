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

(async () =>{
  const d1 = new Diffity({ apiKey: "api-key", apiBaseUrl: 'http://localhost:4000', projectName: 'Diffity Node' });
  d1.loadUrl('https://blog.revathskumar.com')

  await d1.screenshot('homepage');
})()
```

and run the command

```
DEBUG=diffity:* node example.js
```

License
-------
Please see [License](https://gitlab.com/codemancers/diffity-node/blob/master/License)

