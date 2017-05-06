var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var User = require('../models/user');
var Chatter = require('../models/chatters');
var Message = require('../models/message');

//Route to get online users
router.get('/chatters', function (req, res, next) {
    Chatter.find({}, function (err, chatters) {
        if (err) {
            return res.status(500).json({
                title: 'An error occurred',
                error: err
            });
        }
        res.status(200).json({
            message: 'Success',
            obj: chatters
        });
    });
});

//Route to get messages
router.get('/', function (req, res, next) {
    Message.find()
        .populate('user', 'firstName')
        .exec(function (err, messages) {
            if (err) {
                return res.status(500).json({
                    title: 'An error occurred',
                    error: err
                });
            }
            res.status(200).json({
                message: 'Success',
                obj: messages
            });
        });
});

//Route to get messages for a user
router.get('/user', function (req, res, next) {
    Message.find({ $and: [ { user: { $in: [req.query.userid, req.query.id] } } , { recipient: { $in: [req.query.userid, req.query.id] } } ] })
        .populate('user', 'firstName')
        .exec(function (err, messages) {
            if (err) {
                return res.status(500).json({
                    title: 'An error occurred',
                    error: err
                });
            }
            res.status(200).json({
                message: 'Success',
                obj: messages
            });
        });
});

//Route to remove a chatter on log out
router.delete('/chatters/:userid', function (req, res, next) {
    console.log(req.params.userid);
    var userid = req.params.userid;
    Chatter.find({}, function (err, chatters) {
        if (err) {
            return res.status(500).json({
                title: 'An error occurred',
                error: err
            });
        }
        if (!chatters) {
            return res.status(500).json({
                title: 'No Message Found!',
                error: {message: 'Message not found'}
            });
        }
        if(typeof chatters[0] == 'undefined' || typeof chatters[0].chatters == 'undefined'){
            return res.status(201).json({
                message: 'Deleted chatter',
                obj: {}
            });
        }
        else{
            console.log(JSON.stringify(chatters[0].chatters));
            delete chatters[0].chatters[userid];
            console.log(JSON.stringify(chatters[0].chatters));
        }

        if(typeof chatters[0].chatters !=='undefined' && Object.keys(chatters[0].chatters).length == 0){
            var chatusers = chatters[0].chatters;
            Chatter.remove({}, function (err, chatters) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occurred',
                        error: err
                    });
                }
                res.status(201).json({
                    message: 'Deleted chatter',
                    obj: {}
                });
            });
        }
        else if(typeof chatters[0].chatters !=='undefined'){
            var chatusers = chatters[0].chatters;
            Chatter.remove({}, function (err, chatters) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occurred',
                        error: err
                    });
                }
                var chatter = new Chatter({
                    chatters: chatusers
                });
                chatter.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            title: 'An error occurred',
                            error: err
                        });
                    }
                    res.status(201).json({
                        message: 'Deleted chatter',
                        obj: result
                    });
                });
            });
        }
        else{
            res.status(401).json({
                message: 'No chatters found',
                obj: {}
            });
        }
    });

});

//Route to authenticate write requests
router.use('/', function (req, res, next) {
    jwt.verify(req.query.token, 'secret', function (err, decoded) {
        if (err) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: err
            });
        }
        next();
    })
});

//Route to post a message
router.post('/', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);
    User.findById(decoded.user._id, function (err, user) {
        if (err) {
            return res.status(500).json({
                title: 'An error occurred',
                error: err
            });
        }
        var message = new Message({
            content: req.body.content,
            user: user,
            recipient: req.body.recipientId
        });
        message.save(function (err, result) {
            if (err) {
                return res.status(500).json({
                    title: 'An error occurred',
                    error: err
                });
            }
            user.messages.push(result);
            user.save();
            res.status(201).json({
                message: 'Saved message',
                obj: result
            });
        });
    });
});


//Route to add an online user
router.post('/chatters', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);

    Chatter.remove({}, function (err, chatters) {
        if (err) {
            return res.status(500).json({
                title: 'An error occurred',
                error: err
            });
        }

        var chatter = new Chatter({
            chatters: req.body
        });
        console.log('____');
        chatter.save(function (err, result) {
            if (err) {
                return res.status(500).json({
                    title: 'An error occurred',
                    error: err
                });
            }
            res.status(201).json({
                message: 'Saved chatters',
                obj: result
            });
        });
    });
});

router.patch('/:id', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);
    Message.findById(req.params.id, function (err, message) {
        if (err) {
            return res.status(500).json({
                title: 'An error occurred',
                error: err
            });
        }
        if (!message) {
            return res.status(500).json({
                title: 'No Message Found!',
                error: {message: 'Message not found'}
            });
        }
        if (message.user != decoded.user._id) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: {message: 'Users do not match'}
            });
        }
        message.content = req.body.content;
        message.save(function (err, result) {
            if (err) {
                return res.status(500).json({
                    title: 'An error occurred',
                    error: err
                });
            }
            res.status(200).json({
                message: 'Updated message',
                obj: result
            });
        });
    });
});

router.delete('/:id', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);
    Message.findById(req.params.id, function (err, message) {
        if (err) {
            return res.status(500).json({
                title: 'An error occurred',
                error: err
            });
        }
        if (!message) {
            return res.status(500).json({
                title: 'No Message Found!',
                error: {message: 'Message not found'}
            });
        }
        if (message.user != decoded.user._id) {
            return res.status(401).json({
                title: 'Not Authenticated',
                error: {message: 'Users do not match'}
            });
        }
        message.remove(function (err, result) {
            if (err) {
                return res.status(500).json({
                    title: 'An error occurred',
                    error: err
                });
            }
            res.status(200).json({
                message: 'Deleted message',
                obj: result
            });
        });
    });
});

module.exports = router;