var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { isLoggedIn } = require('../helpers/utils')

/* GET home page. */
module.exports = function (db) {


  //router login
  router.get('/login', function (req, res, next) {
    res.render('operator/login', { info: req.flash('info') });
  });

  router.post('/login', async function (req, res, next) {

    const { email, password } = req.body
    try {
      db.query('SELECT * FROM users WHERE email = $1', [email], (err, data) => {
        // console.log(data, 'string data')

        if (err) return res.send(err)

        if (data.rows.length == 0) {
          req.flash('info', "email yang di masukkan salah")
          return res.redirect('/login')
        }


        bcrypt.compare(password, data.rows[0].password, function (err, result) {

          if (err) return res.send(err)

          if (!result) {
            req.flash('info', "password salah")
            return res.redirect('/login')
          }

          req.session.user = data.rows[0]
          delete data.rows[0].password
          // console.log(req.session.user);

          res.redirect('/dashboard')
        });
      })
    }
    catch (err) {
      console.log(err)
      res.send(err)
    }
  });


  //router register
  router.get('/register', function (req, res) {
    res.render('operator/register');
  });

  router.post('/register', function (req, res) {
    const { email, name, password, role } = req.body
    // console.log(req.body, 'data')

    db.query('SELECT * FROM users WHERE email = $1', [email], (err, data) => {
      if (err)
        return res.send(err)

      if (data.rows.length > 0) return res.send("email sudah terdaftar")

      bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) return res.send(err)
        // console.log(email, name, hash, role)
        db.query('INSERT INTO users(email,name,password,role) VALUES ($1, $2, $3, $4)', [email, name, hash, role], (err, data) => {

          if (err)
            return res.send(err)
          res.redirect('/login')
        })
      })
    })
  });

  //router logout
  router.get('/logout', isLoggedIn, function (req, res, next) {
    req.session.destroy(function (err) {
      res.redirect('/login')
    })
  });

  return router;
}
