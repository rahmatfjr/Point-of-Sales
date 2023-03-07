var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();

module.exports = function (db) {

    router.get('/', async function (req, res) {
        try {
            const { rows } = await db.query('SELECT * FROM customers')
            res.render('customers/list', {
                currentPage: 'customers',
                user: req.session.user,
                rows
            })
        }
        catch (e) {
            console.log(e)
        }
    })



    
    //read data
    router.get('/datatablecustomer', async (req, res) => {
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

            const total = await db.query(`select count(*) as total from customers${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
            const data = await db.query(`select * from customers${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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



    //add customers
    router.get('/add', isLoggedIn, async function (req, res) {
        res.render('customers/add', {
            user: req.session.user,
            currentPage: 'add'
        })
    });

    router.post('/add', isLoggedIn, async function (req, res) {
        const { name, address, phone } = req.body
        // console.log(unit, name, note)

        try {
            const { rows } = await db.query('INSERT INTO customers( name, address, phone) VALUES ($1, $2, $3)',  [ name, address, phone])
            // console.log(rows)
            res.redirect('/customers')
            // console.log(rows);
        }
        catch (e) {
            res.send(e)
        }
    });

    router.get('/edit/:customerid', async function (req, res) {
        const customerid = req.params.customerid
        // console.log(unit, 'gagal ambil unit')
        try {
          const { rows } = await db.query('SELECT * FROM customers WHERE customerid = $1', [customerid])
          // console.log(rows)
          res.render('customers/edit', {
            currentPage: 'edit customers',
            user: req.session.user,
            rows
          });
        }
        catch (e) {
          console.log(e)
        }
    
      });
    
      router.post("/edit/:customerid", async function (req, res) {
        const customerid = req.params.customerid
        const { name, address, phone } = req.body
        try {
          const { rows } = await db.query('UPDATE customers SET name= $1, address= $2, phone= $3  WHERE customerid= $4',[ name, address, phone, customerid])
        //   console.log(rows, 'udh di ubah');
          res.redirect('/customers')
        }
        catch (e) {
          console.log(e)
        }
      })


      router.get('/delete/:customerid', async function (req, res) {
        const customerid = req.params.customerid
    
        try {
          const { rows } = await db.query('DELETE FROM customers WHERE customerid = $1', [customerid])
          // console.log(rows)
          res.redirect('/customers')
        }
        catch (e) {
          console.log(e)
          res.send(e)
        }
      })

    return router;
}