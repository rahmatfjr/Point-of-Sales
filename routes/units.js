var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();

module.exports = function (db) {

    router.get('/', async function (req, res){
        res.render('users/users', {
            currentPage: 'user',
            user: req.session.user,
            rows
        })
    })
    return router;
}