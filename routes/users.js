var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();

module.exports = function (db) {
  /* GET users listing. */
  router.get('/add', isLoggedIn, async function (req, res) {
    res.render('adduser/add', {
      user: req.session.user,
      currentPage: 'add'
    })
  });

  router.post('/add', isLoggedIn, async function (req, res) {
    try{

    }
    catch(e){
      console.log(e)
      res.send(e)
    }
    res.redirect('users/users')
  });
  return router;
}