var MongoClient = require('mongodb').MongoClient;
var elasticsearch = require('elasticsearch');

// Use Q if native promises are not available
if (typeof Promise === 'undefined') { Promise = require('q').Promise; }

function Transfer (opts){
  if (!opts || !opts.esOpts || !opts.esOpts.host || !opts.mongoUri) {
    throw new Error('Invalid opts.  esOpts and mongoUri are required');
  }
  if (!opts.esTargetIndex) {
    throw new Error('esTargetIndex is required');
  }
  if (!opts.mongoSourceCollection) {
    throw new Error('mongoSourceCollection is required');
  }
  if (!opts.esTargetType) {
    throw new Error('esTargetType is required');
  }
  this.ES = new elasticsearch.Client(opts.esOpts);
  this.esOpts = opts.esOpts;
  this.mongoUri = opts.mongoUri;
  this.mongoSourceCollection = opts.mongoSourceCollection;
  this.debug = opts.debug;
  this.esTargetIndex = opts.esTargetIndex;
  this.esTargetType = opts.esTargetType;
}

// For testing purposes only
Transfer.prototype.__setESClient = function (newClient) {
  this.ES = newClient;
};

Transfer.prototype.connectToMongo = function() {
  return new Promise(function (resolve, reject) {
    MongoClient.connect(this.mongoUri, function(err, db) {
      if (err) { return reject(err); }
      this.db = db;
      resolve(db);
    }.bind(this));
  }.bind(this));
};

Transfer.prototype.createESDocument = function (doc) {
  return new Promise(function(resolve, reject) {
    // Let ES generate IDs
    if (doc._id) { delete doc._id; }
    if (doc.id) { delete doc.id; }
    this.ES.create({
      index: this.esTargetIndex,
      type: this.esTargetType,
      body: doc
    }, function (err, res) {
      if (err) { console.log('error', err); return reject(err); }
      resolve(res);
    });
  }.bind(this));
};

Transfer.prototype.getCollection = function () {
  if (!this.db) { throw new Error('No DB connection'); }
  return this.db.collection(this.mongoSourceCollection);
};

Transfer.prototype.findBatchedDocuments = function (){ 
  return new Promise(function (resolve, reject) {
    try {
      var collection = this.getCollection(this.db);
    } catch (e) {
      reject(e);
    }
    var cursor = collection.find({});
    this.cursor = cursor;
    var timer;
    var counter = 0;
    var writePromises = [];
    var getNext = function (doc) {
      if (doc) {
        ++counter;
        try {
          var p = this.createESDocument(doc);
          writePromises.push(p);
        } catch (e) {
          reject(e);
        }
      }
      return cursor.hasNext().then(function(bool) {
        if (bool) {
          cursor.next().then(getNext);
        } else {
          Promise.all(writePromises).then(function() {
            if (this.timeout) {
              clearTimeout(timer);
            }
            resolve({ status: 'ok', documentsAdded: counter });
          });
        }
      });
    }.bind(this);
    
    if (this.timeout) {
      timer = setTimeout(
        function () {
          reject({ status: 'timeout', message: ( 'Timed out after ' + this.timeout + 'ms' ) });
        }.bind(this), 
        this.timeout
      );
    }

    getNext().catch(reject);

  }.bind(this));
};

Transfer.prototype.start = function () {
  return new Promise(function(resolve, reject){
    this.connectToMongo()
    .then(this.findBatchedDocuments.bind(this))
    .then(function(res) {
      if (this.db) { this.db.close(); }
      resolve(res);
    })
    .catch(reject);
  }.bind(this));
};

module.exports = Transfer;
