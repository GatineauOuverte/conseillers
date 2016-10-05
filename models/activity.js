var   mongoose = require('mongoose')
    , Schema = mongoose.Schema
;

var ActivitySchema = new Schema({
    conseiller  : String
  , content     : String
  , guid        : String
  , posted_on   : Date
  , source      : String
  , title       : String
  , url         : String
});

ActivitySchema.index({ source: 1, guid: -1 }, {unique: true});

module.exports = mongoose.model('Activity', ActivitySchema);
