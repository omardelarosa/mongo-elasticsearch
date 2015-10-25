# Mongo-Elasticsearch

Transfer document collections from MongoDB into Elasticsearch indexes safely and easily.

## Build Status
Branch  | Build Status | Version | Code Quality
------- | ------------ | ------- | -----------
 master | [![build status](https://travis-ci.org/omardelarosa/mongo-elasticsearch.png?branch=master)](https://travis-ci.org/omardelarosa/mongo-elasticsearch?branch=master)  |  [![npm version](https://img.shields.io/npm/v/mongo-elasticsearch.svg)](https://img.shields.io/npm/v/mongo-elasticsearch.svg) | [![code_climate](https://codeclimate.com/github/omardelarosa/mongo-elasticsearch/badges/gpa.svg)](https://codeclimate.com/github/omardelarosa/mongo-elasticsearch)
 development | [![build status](https://travis-ci.org/omardelarosa/mongo-elasticsearch.png?branch=development)](https://travis-ci.org/omardelarosa/mongo-elasticsearch?branch=development) | 1.0.1

## Install

```bash
npm install mongo-elasticsearch
```

## Usage

```javascript
var mongo-elasticsearch = require('mongo-elasticsearch');
var t = new mongo-elasticsearch.Transfer({
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
