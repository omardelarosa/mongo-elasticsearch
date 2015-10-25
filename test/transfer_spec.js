/*eslint-env node, mocha */
var Transfer  = require('../lib/transfer');
var db = { collection: [] };
var _ = require('lodash');
var nock = require('nock');
var expect = require('chai').expect;
var sinon = require('sinon');

var fakeESconnection = nock('http://localhost:9200')
  .get('/')
  .reply(200, 'connection');

var fakeESclient = {
  create: function (doc, cb) {
    if (cb) {
      return cb(null, doc);
    }
    return new Promise(function(resolve, reject){
      resolve(doc);
    });
  }
};

var makeRandomTweet = function () {
  return _.times(_.random(10,140), function () {
    return _.sample(['a','b','c','e','f']);
  }).join('');
};

var makeAllTweets = function () {
  _.times(_.random(10,100), function () {
    db.collection.push({
      content: makeRandomTweet()
    });
  });
};

describe('Transfer', function () {
 
  before(function () {
    makeAllTweets();
  });

  describe('Input validation', function () {
    it('should throw an error when transfer is called without options', function() {
      try { new Transfer(); } 
      catch (e) { expect(e).to.be.instanceOf(Error); }
    });
  });

  describe('.start', function () {
    var t
      , p
      , getCollectionStub
      , createDocumentSpy
      , connectToMongoStub
      , hasNextStub
      , nextStub
      , fakeCursor
      , remainingDocs;

    beforeEach(function() {
      remainingDocs = db.collection.length;
      createDocumentSpy = sinon.spy(Transfer.prototype, 'createESDocument');
      getCollectionStub = sinon.stub(Transfer.prototype, 'getCollection', function () {
        var counter = 0;
        fakeCursor = {
          hasNext: function () {
            return new Promise(function(resolve, reject) {
              if (remainingDocs !== 0) { return resolve(true); }
              resolve(false);
            });
          },
          next: function () {
            return new Promise(function (resolve, reject) {
              remainingDocs--;
              resolve({});
            });
          }
        };
        var collection = {
          find: function () { return fakeCursor; }
        };
        return collection;
      });

      connectToMongoStub = sinon.stub(Transfer.prototype, 'connectToMongo', function (){
        return new Promise(function(resolve, reject) {
          resolve(null);
        });
      });

      t = new Transfer({
        esOpts: {
          host: 'localhost:9200'
        },
        esTargetType: 'tweet',
        esTargetIndex: 'tweets',
        mongoUri: 'mongodb://blah',
        mongoSourceCollection: 'collection'
      });
      
      t.__setESClient(fakeESclient);

      p = t.start();

    });

    it('should call .createESDocument once for each element in MongoDB collection', function (done) {
      p.then(function() {
        try {
          expect(createDocumentSpy.callCount).to.eq(db.collection.length);
          done();
        } catch (e) {
          done(e);
        }
      })
      .catch(function(err) {
        done(err);
      });
    });
  });
});
