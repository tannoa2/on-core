// Copyright 2016, EMC, Inc.

'use strict';

module.exports = environmentServiceFactory;

environmentServiceFactory.$provide = 'Services.Environment';
environmentServiceFactory.$inject = [
    'Promise',
    'Services.Waterline',
    '_',
    'Assert'
];

function environmentServiceFactory(
    Promise,
    waterline,
    _,
    assert
) {
    var _db;
    var MongoClient = require('mongodb').MongoClient
    var url = 'mongodb://localhost:27017/pxe';


    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        console.log('connected to mongo');
        _db=db
    })




    function EnvironmentService() {
    }

    /**
     * Set the 'key' to the 'value' in the document identified by 'identifier'
     * @param  {String}     key
     * @param  {Object}     value
     * @param  {String}   identifier
     */
    EnvironmentService.prototype.set = function set(key, value, identifier) {
        identifier = identifier || 'global';
        return waterline.environment.findOrCreate(
            {identifier: identifier}, 
            {identifier: identifier, data: {}}
        ).then(function(env) {
            _.set(env.data, key, value);
            return waterline.environment.update({identifier: identifier}, {data: env.data});
        });
    };

    /**
     * Retrieve the 'key' using the hierarchy specified in identifiers.
     * The defaults value is returned if the key does not exist
     * @param  {String}     key
     * @param  {Object}     defaults
     * @param  {Array}   identifiers
     */
    EnvironmentService.prototype.get = function get(key, defaults, identifiers) {
        console.time("this.getAll")
        return this.getAll(identifiers).tap(console.timeEnd.bind(console,"this.getAll"))
            .then(function(envs) {
                console.time("_.get")
            return _.get(envs, key, defaults)
        }).tap(console.timeEnd.bind(console,"_.get"))
    };

    /**
     * Retrieve the documents specified by identifiers and merge in order of priority
     * @param  {Array}   identifiers
     */
    var waterline_environment_findOneAVG =0
    var waterline_environment_findOneARR = []
    EnvironmentService.prototype.getAll = function (identifiers) {
        identifiers = identifiers || ['global'];
        assert.arrayOfString(identifiers, 'identifiers should be an array');
        console.time("waterline.environment.findOne")
        var start = new Date().getTime()
        return Promise.all(Promise.map( identifiers, function(identifier) {
            //return waterline.environment.findOne({identifier: identifier})
            return _db.collection('environment').findOne({identifier: identifier}, function (err, r) {return 1})
        }).tap(console.timeEnd.bind(console,"waterline.environment.findOne"))
        .tap(function(){

            var end = new Date().getTime()
            var e = end-start
            var sum = 0
            waterline_environment_findOneARR.push(e)
            //console.log("waterline_environment_findOneARR "+ waterline_environment_findOneARR)
            if(waterline_environment_findOneARR.length ==  4000) { //x4 <<<<<<<<<<<<<<<<<<<<<
                waterline_environment_findOneARR.forEach(function (item) {
                    sum = sum + item
                })
                waterline_environment_findOneAVG = sum / waterline_environment_findOneARR.length
                console.log("time_array of waterline_environment_findOneARR: " + waterline_environment_findOneARR)
                console.log("time_avg of waterline_environment_findOneAVG: " + waterline_environment_findOneAVG)
            }
        })
        .filter(function(env) {
            if(env !== undefined){
                console.log (env)
            }
            return env;
        })).then(function(envs) {
            var data = _.sortBy(envs, function(env) {
                return (envs.length - identifiers.indexOf(env.identifier));
            });
            var data2 = _.merge.apply(_, _.flatten([{}, data]));
            return data2.data;
        });
    };

    EnvironmentService.prototype.start = function start() {
        return Promise.resolve();
    };

    EnvironmentService.prototype.stop = function stop() {
        return Promise.resolve();
    };

    return new EnvironmentService();
}
