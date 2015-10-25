# Mongolastic

Transfer MongoDB collections into Elasticsearch safely using JS native Promises and batches.

## Install

```bash
npm install mongolastic
```

## Usage

```javascript
var mongolastic = require('mongolastic');
var t = new mongolastic.Transfer({
  esOpts: {
    host: 'localhost:9200',
    log: 'trace'
  },
  esTargetType: 'tweet',
  esTargetIndex: 'twitter',
  mongoUri: 'mongodb://abc123:def456@myhost.com:27747/dbname',
  mongoSourceCollection: 'tweets'
});

t.start().then(function(results) {
  console.log('Exiting');
  console.log(results);
  process.exit();
});
```
