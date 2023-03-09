var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = function (db) {

  //router user in dashboard
  router.get('/', isLoggedIn, async function (req, res) {
    try {
      const { rows } = await db.query('SELECT * FROM users')
      // console.log(rows)
      res.render('users/users', {
        currentPage: 'user',
        user: req.session.user,
        rows
      })
    }
    catch (e) {
      console.log(e)

    }
  });

  /* GET users listing. */
  router.get('/add', isLoggedIn, async function (req, res) {
    res.render('adduser/add', {
      user: req.session.user,
      currentPage: 'add'
    })
  });

  router.post('/add', isLoggedIn, async function (req, res) {
    const { email, name, password, role } = req.body

    try {
      const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email])
      if (rows.length > 0) return res.send("email sudah terdaftar")

      const hash = await bcrypt.hash(password, saltRounds)

      await db.query('INSERT INTO users(email,name,password,role) VALUES ($1, $2, $3, $4)', [email, name, hash, role])
      res.redirect('/users')
    }
    catch (e) {
      res.send(e)
    }
  });

  router.get('/delete/:users_id', async function (req, res) {
    const id = req.params.users_id

    try {
      const { rows } = await db.query('DELETE FROM users WHERE users_id = $1', [id])
      // console.log(rows)
      res.redirect('/users')
    }
    catch (e) {
      console.log(e)
      res.send(e)
    }
  })

  router.get('/edit/:users_id', async function (req, res) {
    const id = req.params.users_id
    try {
      const { rows } = await db.query('SELECT * FROM users WHERE users_id = $1', [id])
      // console.log(rows)
      res.render('adduser/edit', {
        currentPage: 'edit',
        user: req.session.user,
        rows
      });
    }
    catch (e) {
      console.log(e)
    }

  });

  router.post("/edit/:users_id", async function (req, res) {
    const id = req.params.users_id
    const { email, name, role } = req.body
    try {
      const { rows } = await db.query('UPDATE users SET email= $1, name= $2, role= $3  WHERE users_id= $4', [email, name, role, id])
      console.log(rows, 'udh di ubah');
      res.redirect('/users')
    }
    catch (e) {
      console.log(e)
    }
  })


  //read data
  router.get('/datatableuser', async (req, res) => {
    try {
      // console.log('masuk sini')
      let params = []

      if (req.query.search.value) {
        params.push(`name ilike '%${req.query.search.value}%'`)
      }

      const limit = req.query.length
      const offset = req.query.start
      const sortBy = req.query.columns[req.query.order[0].column].data
      const sortMode = req.query.order[0].dir

      const total = await db.query(`select count(*) as total from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
      const data = await db.query(`select * from users${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
      // console.log(data, 'ada data')
      const response = {
        "draw": Number(req.query.draw),
        "recordsTotal": total.rows[0].total,
        "recordsFiltered": total.rows[0].total,
        "data": data.rows
      }
      res.json(response)
    }
    catch (e) {
      console.log(e, "error")
    }
  })


  router.get('/profile',isLoggedIn, function (req, res, next) {
    res.render('users/profile',{
      user: req.session.user,
      currentPage: 'POS - Users',
      successMessage: req.flash('successMessage'),
      info: req.flash('info')
    });
  });

  router.post('/profile',isLoggedIn, async function (req, res, next) {
    try {
      const id = req.session.user.users_id
      const { email, name } = req.body
      await db.query("UPDATE users SET email = $1, name = $2 WHERE users_id = $3", [email, name, id])

      const {rows: dataprofile} = await db.query("SELECT * FROM users WHERE email = $1", [email])

      const data = dataprofile[0]
      req.session.user = data
      req.flash('successMessage', 'your profile has been update')


      res.redirect('/users/profile')
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  });


  router.get('/change',isLoggedIn, function (req, res, next) {
    res.render('users/change', {
      user: req.session.user,
      currentPage: 'Change Password - Users',
      successMessage: req.flash('successMessage'),
      info: req.flash('info')
    });
  });

  router.post('/change',isLoggedIn,  async function (req, res, next) {
    try {
      const id = req.session.user.users_id
      const { oldpassword, newpassword, retypepassword } = req.body

      const {rows: datadb} = await db.query('SELECT * FROM users where users_id = $1', [id]);


      const passcheck = bcrypt.compareSync(oldpassword, datadb[0].password);
      if (!passcheck) {
        req.flash('info', 'Old Password is Wrong')
        return res.redirect('/users/change')
      }

      if (newpassword != retypepassword ) {
        req.flash('info', `Retype Password is doesn't match`)
        return res.redirect('/users/change')
      }
      
      const newpass = bcrypt.hashSync(newpassword, saltRounds);
      await db.query("UPDATE users SET password = $1 WHERE users_id = $2", [newpass, id])
      req.flash('successMessage', `your password has been updated`)


      res.redirect('/users/change')
    } 
    catch (error) {
      console.log('changepassword error ', error);
    }
  });


  return router;
}