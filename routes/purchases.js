var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();
const { currencyFormatter } = require('../public/javascripts/utils');
const moment = require('moment')

module.exports = function (db) {

    router.get('/', async function (req, res) {
        try {
            const { rows } = await db.query('SELECT * FROM purchases')
            
            res.render('purchases/list', {
                currentPage: 'purchases',
                user: req.session.user,
                rows,
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
            const data = await db.query(`select purchases.*, suppliers.* from purchases left join suppliers on purchases.supplier = suppliers.supplierid${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
            const getsupplier = await db.query('SELECT * FROM suppliers ORDER BY supplierid')
            const { rows: goods } = await db.query('SELECT * FROM goods ORDER BY barcode')
            res.render('purchases/add', {
                user: req.session.user,
                currentPage: 'add',
                purchases: getpurchases.rows[0],
                suppliers: getsupplier.rows,
                goods,
                moment
            })
            // console.log(getpurchases.rows[0], 'harus ada')
        }
        catch (e) {
            console.log(e)
        }

    });

    router.get('/details/:invoice', isLoggedIn, async function (req, res) {
        const invoice = req.params.invoice
        try {
            const { rows } = await db.query(`SELECT purchaseitems.* , goods.name FROM purchaseitems LEFT JOIN goods ON purchaseitems.itemcode = goods.barcode WHERE purchaseitems.invoice = $1 ORDER BY purchaseitems.id`, [invoice])
            res.json(rows)
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
            const { rows } = await db.query(`DELETE FROM purchaseitems WHERE id = $1 returning *`, [id])
            res.redirect(`/purchases/show/${rows[0].invoice}`)
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.post('/show/:invoice', isLoggedIn, async function (req, res) {
        const invoice = req.params.invoice
        const { totalsummary, supplier } = req.body
        const userid = req.session.user.userid
        try {

            if (!supplier) {
                await db.query('UPDATE purchases SET totalsum = $1, operator = $2 WHERE invoice = $3', [totalsummary, userid, invoice])
            } else {
                await db.query('UPDATE purchases SET totalsum = $1, supplier = $2, operator = $3 WHERE invoice = $4', [totalsummary, supplier, userid, invoice])
            }

            res.redirect(`/purchases`)
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });

    router.post('/additem', isLoggedIn, async function (req, res) {
        const { invoice, barcode, quantity } = req.body

        try {
            await db.query(`INSERT INTO purchaseitems (invoice, itemcode, quantity) VALUES($1, $2, $3) returning *`, [invoice,barcode, quantity])
            const { rows } = await db.query('SELECT * FROM purchases WHERE invoice = $1', [invoice])
            res.json(rows[0])
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    });
    

    router.get('/delete/:invoice', async function (req, res) {
        const invoice = req.params.invoice

        try {
            const { rows } = await db.query('DELETE FROM purchases WHERE invoice = $1', [invoice])
            // console.log(rows)
            res.redirect('/purchases')
        }
        catch (e) {
            console.log(e)
            res.send(e)
        }
    })

    return router;
}