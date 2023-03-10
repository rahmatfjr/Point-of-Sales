var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = function (db) {

  router.get('/', isLoggedIn, async function (req, res) {
    try {
        const { rows } = await db.query('SELECT * FROM suppliers')
        res.render('suppliers/list', {
            currentPage: 'suppliers',
            user: req.session.user,
            rows
        })
    }
    catch (e) {
        console.log(e)
    }

  //read data
  router.get('/datatablesupplier', async (req, res) => {
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

        const total = await db.query(`select count(*) as total from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
        const data = await db.query(`select * from suppliers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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

router.get('/add', isLoggedIn, async function (req, res) {
  res.render('suppliers/add', {
      user: req.session.user,
      currentPage: 'add'
  })
});

router.post('/add', isLoggedIn, async function (req, res) {
  const { name, address, phone } = req.body
  // console.log(unit, name, note)

  try {
      const { rows } = await db.query('INSERT INTO suppliers(name, address, phone) VALUES ($1, $2, $3)', [name, address, phone])
      // console.log(rows)
      res.redirect('/suppliers')
  }
  catch (e) {
      res.send(e)
  }
});

router.get('/edit/:supplierid', isLoggedIn, async function (req, res) {
    const supplierid = req.params.supplierid
    try {
      const { rows } = await db.query('SELECT * FROM suppliers WHERE supplierid = $1', [supplierid])
      // console.log(rows)
      res.render('suppliers/edit', {
        currentPage: 'edit suppliers',
        user: req.session.user,
        rows
      });
    }
    catch (e) {
      console.log(e)
    }
  });
})

router.post("/edit/:supplierid", isLoggedIn, async function (req, res) {
    const supplierid = req.params.supplierid
    const { name, address, phone } = req.body
    try {
      const { rows } = await db.query('UPDATE suppliers SET name= $1, address= $2, phone= $3  WHERE supplierid= $4',[ name, address, phone, supplierid])
    //   console.log(rows, 'udh di ubah');
      res.redirect('/suppliers')
    }
    catch (e) {
      console.log(e)
    }
  })


  router.get('/delete/:supplierid', isLoggedIn, async function (req, res) {
    const supplierid = req.params.supplierid

    try {
      const { rows } = await db.query('DELETE FROM suppliers WHERE supplierid = $1', [supplierid])
      // console.log(rows)
      res.redirect('/suppliers')
    }
    catch (e) {
      console.log(e)
      res.send(e)
    }
  })

  return router;
}