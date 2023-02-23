var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();
// const moment = require('moment')

module.exports = function (db) {

    router.get('/', async function (req, res) {
        try {
            const { rows } = await db.query('SELECT * FROM purchases')
            res.render('purchases/list', {
                currentPage: 'purchases',
                user: req.session.user,
                rows,
                // moment
            })
        }
        catch (e) {
            console.log(e)
        }
    })


    //read data
    router.get('/datatablepurchases', async (req, res) => {
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

            const total = await db.query(`select count(*) as total from purchases${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
            const data = await db.query(`select * from purchases${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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

    router.get('/add', async function (req, res) {
        try {
            const { rows } = await db.query('INSERT INTO purchases(totalsum) VALUES(0) returning *')
            res.redirect(`/purchases/show/${rows[0].invoice}`)
            console.log(rows);
        }
        catch (e) {
            console.log(e)
        }
    })

    router.get('/show/:invoice', isLoggedIn, async function (req, res) {
   
        try {
            const getpurchases = await db.query('SELECT purchases.*, suppliers.* FROM purchases LEFT JOIN suppliers ON purchases.operator = suppliers.supplierid WHERE invoice = $1', [req.params.invoice])
            const { rows: suppliers } = await db.query('SELECT * FROM suppliers ORDER BY supplierid')
            const { rows: goods } = await db.query('SELECT * FROM goods ORDER BY barcode')
            res.render('purchases/add', {
                user: req.session.user,
                currentPage: 'add',
                purchases: getpurchases.rows[0],
                suppliers: suppliers.rows,
                goods
            })
            console.log(getpurchases.rows[0], 'harus ada')
        }
        catch (e) {
            console.log(e)
        }

    });



    return router;
}