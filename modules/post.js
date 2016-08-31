var mongodb = require('./db');
markdown = require('markdown').markdown;
function Post(auth,title, tags, post) {
    this.auth=auth;
    this.title = title;
    this.tags = tags;
    this.post = post;

}
module.exports = Post;
Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours()
        + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    var post = {
        auth: this.auth,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        pv:0
    };
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.insert(post, {
                safe: true
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err)
                }
                callback(null);
            })
        })
    })

};

Post.getTen = function (auth,page,callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (auth) {
                query.auth = auth;
            }
          
            collection.count(query, function (err, total) {
                collection.distinct("tags",function(err,tags){
                
                 collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    callback(null, docs,tags, total);
                });

                })
            

               
               
            });
            
              

        });
    });
};

Post.getOne = function (auth, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "auth": auth,
                "time.day": day,
                "title": title
            }, function (err, doc) {

                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                if (doc) {
                    collection.update({
                        "auth": auth,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: { "pv": 1 }
                    }, function (err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }

                    });
                    callback(null, doc);
                };



            });
        });

    });
};


Post.edit = function (auth, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "auth": auth,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            })
        })
    })
};

Post.getTag = function (tags, page, callback) {

    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {

            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (tags) {
                query.tags = tags;
            }
            collection.count(query, function (err, total) {
                collection.distinct("tags", function (err, tags) {

                 collection.find(query, {
                    skip: (page - 1) * 10,
                    limit:10
                }).sort({
                    time:-1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null, docs,tags, total);

                })
                })
               
            })
        })
    })
}

Post.update = function (auth, day,title, post, callback) {

    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "auth": auth,
                "time.day": day,
                "title": title
            }, {
                $set: { "post": post }
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
};

Post.remove = function (auth, day,title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "auth": auth,
                "time.day": day,
                "title": title
            },
            { w: 1 }
            , function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);

            });

        });
    });
};

