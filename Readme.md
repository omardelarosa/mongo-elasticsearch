# Mongolastic

Transfer MongoDB collections into Elasticsearch safely using JS native Promises and batches.

## Build Status
Branch  | Build Status | Version
------- | ------------ | ----
 master | [![build status](https://travis-ci.org/omardelarosa/mongolastic.png?branch=master)](https://travis-ci.org/omardelarosa/mongolastic?branch=master)  |  [![npm version](https://img.shields.io/npm/v/mongolastic.svg)](https://img.shields.io/npm/v/mongolastic.svg)
 development | [![build status](https://travis-ci.org/omardelarosa/mongolastic.png?branch=development)](https://travis-ci.org/omardelarosa/mongolastic?branch=development) | 1.0.1

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
