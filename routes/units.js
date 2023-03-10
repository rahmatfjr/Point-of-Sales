var express = require('express');
const { isAdmin } = require('../helpers/utils')
var router = express.Router();

module.exports = function (db) {

    router.get('/', isAdmin, async function (req, res) {
        try {
            const { rows } = await db.query('SELECT * FROM units')
            res.render('units/list', {
                currentPage: 'units',
                user: req.session.user,
                rows
            })
        }
        catch (e) {
            console.log(e)
        }
    })



    
    //read data
    router.get('/datatableunit', async (req, res) => {
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

            const total = await db.query(`select count(*) as total from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
            const data = await db.query(`select * from units${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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



    //add units
    router.get('/add', isAdmin, async function (req, res) {
        res.render('units/add', {
            user: req.session.user,
            currentPage: 'add'
        })
    });

    router.post('/add', isAdmin, async function (req, res) {
        const { unit, name, note } = req.body
        // console.log(unit, name, note)

        try {
            const { rows } = await db.query('INSERT INTO units(unit, name, note) VALUES ($1, $2, $3)', [unit, name, note])
            // console.log(rows)
            res.redirect('/units')
        }
        catch (e) {
            res.send(e)
        }
    });

    router.get('/edit/:unit', isAdmin, async function (req, res) {
        const unit = req.params.unit
        // console.log(unit, 'gagal ambil unit')
        try {
          const { rows } = await db.query('SELECT * FROM units WHERE unit = $1', [unit])
          // console.log(rows)
          res.render('units/edit', {
            currentPage: 'edit unit',
            user: req.session.user,
            rows
          });
        }
        catch (e) {
          console.log(e)
        }
    
      });
    
      router.post("/edit/:unit", isAdmin, async function (req, res) {
        const unit = req.params.unit
        const { name, note } = req.body
        try {
          const { rows } = await db.query('UPDATE units SET name= $1, note= $2  WHERE unit= $3',[ name, note, unit])
        //   console.log(rows, 'udh di ubah');
          res.redirect('/units')
        }
        catch (e) {
          console.log(e)
        }
      })


      router.get('/delete/:unit', isAdmin, async function (req, res) {
        const unit = req.params.unit
    
        try {
          const { rows } = await db.query('DELETE FROM units WHERE unit = $1', [unit])
          // console.log(rows)
          res.redirect('/units')
        }
        catch (e) {
          console.log(e)
          res.send(e)
        }
      })

    return router;
}