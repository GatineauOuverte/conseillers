var Activity = require('../models/activity');

/*
 * GET home page.
 */
exports.index = function(req, res){
  Activity.find({}).sort('posted_on', -1).limit(30).run(function(err, activities){
    if (err) throw err
    res.render('index', { activities: activities })
  });
};
