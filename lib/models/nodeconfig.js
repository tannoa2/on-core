// Copyright 2017, EMC, Inc.

'use strict';

module.exports = nodeConfigModelFactory;

nodeConfigModelFactory.$provide = 'Models.NodeConfig';
nodeConfigModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

function nodeConfigModelFactory (Model,configuration) {
    return Model.extend({
        connection: configuration.get('taskgraph-store', 'mongo'),
        identity: 'nodeconfig',
        attributes: {
            service: {
                type: 'string',
                required: true
            },
            config: {
                type: 'json',
                required: true
            },
            servertag: {
                type: 'string',
                required: true,
                unique: true
            }
        },
        $indexes: [
            {
                keys: { servertag: 1 },
                options: {unique: true}
            }
        ]
    });
}

