var MongoClient = require('mongodb').MongoClient;
var elasticsearch = require('elasticsearch');

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

Transfer.prototype.connectToMongo = function() {
  return new Promise(function (resolve, reject) {
    MongoClient.connect(this.mongoUri, function(err, db) {
      if (err) { reject(err); }
      this.db = db;
      resolve(db);
    });
  }.bind(this));
};

Transfer.prototype.findBatchedDocuments = function (db){
  return new Promise(function (resolve, reject) {
    try {
      var reviews = db.collection(this.mongoSourceCollection);
    } catch (e) {
      reject(e);
    }
    var cursor = reviews.find({});
    var timer;
    var counter = 0;
    var writePromises = [];
    var getNext = function (doc) {
      if (doc) {
        ++counter;
        console.log('Adding document ', counter);
        try {
        var p = new Promise(function(resolve, reject){
          // Let ES generate IDs
          if (doc._id) { delete doc._id; }
          if (doc.id) { delete doc.id; }
          this.ES.create({
            index: this.esTargetIndex,
            type: this.esTargetType,
            body: doc
          }, function (err, res) {
            if (err) { console.log('error', err); return reject(err); }
            console.log('Successfully added document ', counter);
            resolve(res);
          });
        }.bind(this));
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

    getNext().catch(function(err) {
      console.log('Error or done', err);
    });
  }.bind(this));
};

Transfer.prototype.start = function () {
  return new Promise(function(resolve, reject){
    this.connectToMongo()
    .then(this.findBatchedDocuments.bind(this))
    .then(function(res) {
      this.db.close();
      resolve(res);
    })
    .catch(reject);
  }.bind(this));
};

module.exports = Transfer;
