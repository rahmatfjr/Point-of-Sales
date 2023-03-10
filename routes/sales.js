var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();
const { currencyFormatter } = require('../public/javascripts/utils');
const moment = require('moment')

module.exports = function (db) {

    router.get('/', isLoggedIn, async function (req, res) {
        try {
            const { rows } = await db.query('SELECT * FROM sales')

            res.render('sales/list', {
                currentPage: 'sales',
                user: req.session.user,
                rows,
            })
        }
        catch (e) {
            console.log(e)
        }
    })


    //read data
    router.get('/datatablesales', async (req, res) => {
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

            const total = await db.query(`select count(*) as total from sales${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
            const data = await db.query(`select sales.*, customers.* from sales left join customers on sales.customer = customers.customerid${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
        try {
            const { rows } = await db.query('INSERT INTO sales(totalsum) VALUES(0) returning *')
            res.redirect(`/sales/show/${rows[0].invoice}`)
            // console.log(rows);
        }
        catch (e) {
            console.log(e)
        }
    })

    router.get('/show/:invoice', isLoggedIn, async function (req, res) {

        try {
            const getsales = await db.query('SELECT sales.*, customers.* FROM sales LEFT JOIN customers ON sales.customer = customers.customerid WHERE invoice = $1', [req.params.invoice])
            const getcustomer = await db.query('SELECT * FROM customers ORDER BY customerid')
            const { rows: goods } = await db.query('SELECT * FROM goods ORDER BY barcode')
            res.render('sales/add', {
                user: req.session.user,
                currentPage: 'add',
                sales: getsales.rows[0],
                customers: getcustomer.rows,
                goods,
                moment
            })

        }
        catch (e) {
            console.log(e)
        }
    });


    router.post('/additem', isLoggedIn, async function (req, res) {
        const { invoice, barcode, quantity } = req.body

        try {
            await db.query(`INSERT INTO saleitems (invoice, itemcode, quantity) VALUES($1, $2, $3) returning *`, [invoice, barcode, quantity])
            const { rows } = await db.query('SELECT * FROM sales WHERE invoice = $1', [invoice])
            // console.log(rows, 'ini rows add items')
            res.json(rows[0])
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });


    router.get('/details/:invoice', isLoggedIn, async function (req, res) {
        const invoice = req.params.invoice
        try {
            const { rows } = await db.query(`SELECT saleitems.* , goods.name FROM saleitems LEFT JOIN goods ON saleitems.itemcode = goods.barcode WHERE saleitems.invoice = $1 ORDER BY saleitems.id`, [invoice])
            res.json(rows)
            // console.log(rows, 'ini detail invoice')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });


    router.get('/goods/:barcode', isLoggedIn, async function (req, res) {
        const barcode = req.params.barcode
        try {
            const { rows } = await db.query(`SELECT * FROM goods WHERE barcode = $1`, [barcode])
            res.json(rows[0])
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.get('/deleteitems/:id', isLoggedIn, async function (req, res) {
        const id = req.params.id
        try {
            const { rows } = await db.query(`DELETE FROM saleitems WHERE id = $1 returning *`, [id])
            res.redirect(`/sales/show/${rows[0].invoice}`)
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.post('/show/:invoice', isLoggedIn, async function (req, res) {
        const { invoice } = req.params
        const { totalsummary, customer, pay, change } = req.body
        const userid = req.session.user.userid
        try {
            // console.log(pay, change, 'post data show invoice')
            if (!customer) {
                await db.query('UPDATE sales SET totalsum = $1, operator = $2, pay = $3, change = $4 WHERE invoice = $5', [totalsummary, userid, pay, change, invoice])
                console.log('ini adalah req.body ', req.body);
            } else {
                await db.query('UPDATE sales SET totalsum = $1, customer = $2, operator = $3, pay = $4, change = $5 WHERE invoice = $6', [totalsummary, customer, userid, pay, change, invoice])
                console.log('ini adalah req.body else ', req.body);
            }

            res.redirect(`/sales`)
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });




    router.get('/delete/:invoice', isLoggedIn, async function (req, res) {
        const invoice = req.params.invoice

        try {
            const { rows } = await db.query('DELETE FROM sales WHERE invoice = $1', [invoice])
            // console.log(rows)
            res.redirect('/sales')
        }
        catch (e) {
            console.log(e)
            res.send(e)
        }
    })

    return router;
}