var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseUniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
    chatters: {type: Object, required: true}
});

schema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('Chatter', schema);