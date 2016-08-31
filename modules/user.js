var mongodb = require('./db');
var crypto = require('crypto');
function User(user) {
    this.firstname = user.firstname;
    this.lastname = user.lastname;
    this.username = user.username;
    this.password = user.password;
    this.email = user.email;
};
module.exports = User;
User.prototype.save = function (callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var user = {
        firstname: this.firstname,
        lastname: this.lastname,
        username: this.username,
        password: this.password,
        email: this.email,
        head:head
    }

    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);

            }
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, user[0]);
            });

        });

    });
};
//通过用户名查找用户
User.get = function (username, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                username: username
            }, function (err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, user);
            });
        });
    });
};