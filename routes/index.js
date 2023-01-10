var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

/* GET home page. */
module.exports = function (db) {
  router.get('/login', function (req, res, next) {
    res.render('login');
  });

  router.post('/login', function (req, res, next) {
    const { email, password, role } = req.body
  });

  router.get('/register', function (req, res) {
    res.render('register');
  });

  router.post('/register', function (req, res) {
    const { email, name, password, role } = req.body
    console.log(req.body, 'data')

    db.query('SELECT * FROM users WHERE email = $1', [email], (err, data) => {
      if (err)
        return res.send(err)

      if (data.rows.length > 0) return res.send("email sudah terdaftar")

      bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) return res.send(err)
        console.log(email, name, hash, role)
        db.query('INSERT INTO users(email,name,password,role) VALUES ($1, $2, $3, $4)', [email, name, hash, role], (err, data) => {
         
          if (err)
            return res.send(err)
          res.redirect('login')
        })
      })
    })
  });


  // router.post('/register', (req, res) => {
  //   const { email, name, password, role } = req.body


  // try {
  //   const { email, name, password, repassword, role } = req.body
  //   if (password != repassword) {
  //     throw "passwords are not the same"
  //   }
  //   const { rows } = await db.query('select * from users where email = $1 ', [email])

  //   if (rows.length > 0) {
  //     throw "Email has been registered, please register another account"
  //   }

  //   const createUser = await db.query('insert into users(email, name, password, role) values($1, $2, $3, $4)'[email, name, password, role])
  //   res.redirect('/login')

  //   console.log(createUser, 'isi data')

  // } catch (err) {
  //   req.send(err)
  // }

  // });

  return router;
}
