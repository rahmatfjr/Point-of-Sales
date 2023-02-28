var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();

module.exports = function (db) {

    router.get('/', async function (req, res) {
        try {
            const { rows } = await db.query('SELECT * FROM costumers')
            res.render('costumers/list', {
                currentPage: 'costumers',
                user: req.session.user,
                rows
            })
        }
        catch (e) {
            console.log(e)
        }
    })



    
    //read data
    router.get('/datatablecostumer', async (req, res) => {
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

            const total = await db.query(`select count(*) as total from costumers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
            const data = await db.query(`select * from costumers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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



    //add costumers
    router.get('/add', isLoggedIn, async function (req, res) {
        res.render('costumers/add', {
            user: req.session.user,
            currentPage: 'add'
        })
    });

    router.post('/add', isLoggedIn, async function (req, res) {
        const { name, address, phone } = req.body
        // console.log(unit, name, note)

        try {
            const { rows } = await db.query('INSERT INTO costumers( name, address, phone) VALUES ($1, $2, $3)',  [ name, address, phone])
            // console.log(rows)
            res.redirect('/costumers')
            // console.log(rows);
        }
        catch (e) {
            res.send(e)
        }
    });

    router.get('/edit/:costumerid', async function (req, res) {
        const costumerid = req.params.costumerid
        // console.log(unit, 'gagal ambil unit')
        try {
          const { rows } = await db.query('SELECT * FROM costumers WHERE costumerid = $1', [costumerid])
          // console.log(rows)
          res.render('costumers/edit', {
            currentPage: 'edit costumers',
            user: req.session.user,
            rows
          });
        }
        catch (e) {
          console.log(e)
        }
    
      });
    
      router.post("/edit/:costumerid", async function (req, res) {
        const costumerid = req.params.costumerid
        const { name, address, phone } = req.body
        try {
          const { rows } = await db.query('UPDATE costumers SET name= $1, address= $2, phone= $3  WHERE costumerid= $4',[ name, address, phone, costumerid])
        //   console.log(rows, 'udh di ubah');
          res.redirect('/costumers')
        }
        catch (e) {
          console.log(e)
        }
      })


      router.get('/delete/:costumerid', async function (req, res) {
        const costumerid = req.params.costumerid
    
        try {
          const { rows } = await db.query('DELETE FROM costumers WHERE costumerid = $1', [costumerid])
          // console.log(rows)
          res.redirect('/costumers')
        }
        catch (e) {
          console.log(e)
          res.send(e)
        }
      })

    return router;
}