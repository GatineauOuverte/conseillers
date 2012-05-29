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

module.exports = mongoose.model('Activity', ActivitySchema);
