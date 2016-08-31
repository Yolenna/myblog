var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var passport = require('passport');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
User = require('../modules/user.js');
Post = require('../modules/post.js');
Comment = require('../modules/comments.js');

/* GET home page. */
router.get('/', function (req, res) {
   
        res.render('index', {
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
     

   
    });
});
router.get('/register', checkNotLogin);
router.get('/register', function (req, res) {
    res.render('register', {
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/register', checkNotLogin);
router.post('/register', function (req, res) {
    var firstname = req.body.firstname,
        lastname = req.body.lastname,
        username = req.body.username,
        email = req.body.email,
        password = req.body.password,
        password_re = req.body['confirm_password'];
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致');
        return res.redirect('/register');
    }
    if (firstname == "") {
        req.flash('error', 'firstname is required')
        return res.redirect('/register')
    }
    if (lastname == "") {
        req.flash('error', 'lastname is required')
        return res.redirect('/register')
    }
    if (username == "") {
        req.flash('error', 'username is required')
        return res.redirect('/register')
    }
    if (password == "") {
        req.flash('error', 'password is required')
        return res.redirect('/register')
    }
    if (email == "") {
        req.flash('error', 'email is required')
        return res.redirect('/register')
    }
   

    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        password: password,
        email: req.body.email

    });
    User.get(newUser.username, function (err, user) {
        if (user) {
            req.flash('error', '用户已存在');
            return res.redirect('/register');
        }

        newUser.save(function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/register');
            }
            req.session.user = user;
            req.flash('success', '注册成功');
            res.redirect('/')
        });
    });

});

router.get('/login',checkNotLogin)
router.get('/login', function (req, res) {
    res.render('login',
        {
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
})

router.get("/login/github", passport.authenticate("github", { session: false }));
router.get("/login/github/callback", passport.authenticate("github", {
    session: false,
    failureRedirect: '/login',
    successFlash: "登陆成功"

}), function (req, res) {
    req.session.user = {
        _id: req.user._id
    };
    res.redirect('/')
});

router.post('/login',checkNotLogin)
router.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.password).digest('hex');
    User.get(req.body.username, function (err, user) {
       if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/login');
        }
        if (user.password != password) {
            req.flash('error', '密码错误');
            return res.redirect('/login');
        }

        req.session.user = user;
        req.flash('success', '登陆成功！');
        console.log(req.session.user);
        //res.json(req.session.user);
        return res.redirect('/');


    })
});
router.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
});
router.get('/post', checkLogin);
router.get('/post', function (req, res) {
    res.render('post',
        {
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
});

router.post('/post', checkLogin)
router.post('/post', function (req, res) {
    var currentUser = req.session.user,
        post = new Post(currentUser.username, req.body.title,req.body.tags, req.body.post);
    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/article');
        }
        req.flash('success', '发布成功');
        res.redirect('/article');
       
    })


});

router.post('/upload', function (req, res) {
   
    var form = new formidable.IncomingForm();
    form.uploadDir = '../public/upload';
    form.keepExtensions = true;
   
    form.parse(req, function (err, fields, files) {

        if (err) {
            return console.log('formidable, form.parse err');
            console.log('formidable, form.parse ok');
        }
        for (var i in files) {
            if (files[i].size == 0) {
                fs.unlinkSync(files[i].path);
                console.log('successful removed an empty file');
            } else {
                var name=files[i].name;
                var target_path = '../public/upload/' + files[i].name;
                fs.renameSync(files[i].path, target_path);
                
                var result = 'http://localhost:3000/upload/' + name;
                console.log(result);
            }
        }
        res.writeHead(200, {
            'Content-type': 'text/html'
        });
        res.end(result);
        
        
    });
});


   

            
      


router.get('/article', function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTen(null,page, function (err, posts,tags,total) {
        if (err) {
            posts = [];
        }
       
        res.render('list', {
                user: req.session.user,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                posts: posts,
                tags:tags,
                sucess: req.flash('success').toString(),
                error: req.flash('error').toString()
       
        });

    });
});

router.get('/u/:auth/:day/:title', function (req, res) {
    Post.getOne(req.params.auth, req.params.day, req.params.title, function (err, post) {

        if (err) {
            req.flash('error', err);
            return res.redirect('/article');
        }
        res.render('one', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

});

router.get('/edit/:auth/:day/:title', checkLogin);
router.get('/edit/:auth/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.username, req.params.day,req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('edit', {
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
           
        });
    });

});

router.post('/edit/:auth/:day/:title', checkLogin);
router.post('/edit/:auth/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.username, req.params.day, req.params.title, req.body.post, function (err) {

        var url = '/u/' + req.params.auth + '/' + req.params.day + '/' +
             encodeURI( req.params.title)
        if (err) {
            req.flash('error', err);
            return res.redirect(url);
        }

        req.flash('success', '修改成功');
        res.redirect(url);
    });


});

router.get('/remove/:auth/:day/:title', checkLogin);
router.get('/remove/:auth/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.username, req.params.day, req.params.title, function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '删除成功');
        res.redirect('/');
    });
});

router.post('/u/:auth/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.auth, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err);
            return callback(err);
        }
        req.flash('success', '留言成功！');
        res.redirect('back');
    })

});

router.get('/article/:tag', function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTag(req.params.tag,page, function (err, posts,tags,total) {
        if (err) {
            posts = [];
        }

        res.render('list', {
            user: req.session.user,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10 + posts.length) == total,
            posts: posts,
            tags:tags,
            sucess: req.flash('success').toString(),
            error: req.flash('error').toString()

        });

    });
});

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录！');
        res.redirect('/login');
    }
    next();
};
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录');
        res.redirect('back');
    }
    next();
}

module.exports = router;
