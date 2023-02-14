var express = require('express');
const { isLoggedIn } = require('../helpers/utils');
var router = express.Router();
const path = require('path')

module.exports = function (db) {

    router.get('/', isLoggedIn, async function (req, res) {
        try {

            const { rows } = await db.query('SELECT * FROM goods')
            // console.log(rows)
            res.render('goods/list', {
                currentPage: 'goods',
                user: req.session.user,
                rows
            })
        }
        catch (e) {
            console.log(e)
        }
    })

    //read data
    router.get('/datatablegoods', async (req, res) => {
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

            const total = await db.query(`select count(*) as total from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''}`)
            const data = await db.query(`select * from goods${params.length > 0 ? ` where ${params.join(' or ')}` : ''} order by ${sortBy} ${sortMode} limit ${limit} offset ${offset} `)
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
    router.get('/add', isLoggedIn, async function (req, res) {
        try {
            const { rows } = await db.query('SELECT unit, name FROM units')
            res.render('goods/add', {
                user: req.session.user,
                currentPage: 'add',
                rows: rows
            })
        }
        catch (e) {
            console.log(e)
        }
    });

    router.post('/add', isLoggedIn, async function (req, res) {
        const { barcode, name, stock, purchaseprice, sellingprice, unit } = req.body

        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send('No files were uploaded.');
            }

            // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
            let picture = req.files.picture;
            let pictureName = `${Date.now()}-${picture.name}`
            let uploadPath = path.join(__dirname, '..', 'public', 'images', 'upload', pictureName);
            console.log(uploadPath, 'ada')
            // Use the mv() method to place the file somewhere on your server
            picture.mv(uploadPath, async function (err) {
                if (err)
                    return res.status(500).send(err);

                const { rows } = await db.query('INSERT INTO goods(barcode, name, stock, purchaseprice, sellingprice, unit, picture) VALUES ($1, $2, $3, $4, $5, $6, $7)', [barcode, name, stock, purchaseprice, sellingprice, unit, pictureName])
                res.redirect('/goods')
            });

        }

        catch (e) {
            res.send(e)
        }
    });


    router.get('/delete/:barcode', async function (req, res) {
        const barcode = req.params.barcode

        try {
            const { rows } = await db.query('DELETE FROM goods WHERE barcode = $1', [barcode])
            // console.log(rows)
            res.redirect('/goods')
        }
        catch (e) {
            console.log(e)
            res.send(e)
        }
    })

    router.get('/edit/:barcode', async function (req, res) {
        const barcode = req.params.barcode
        // console.log(unit, 'gagal ambil unit')
        try {
            const { rows: units } = await db.query('SELECT unit, name FROM units')
            const { rows } = await db.query('SELECT * FROM goods WHERE barcode = $1', [barcode])
            // console.log(rows)
            res.render('goods/edit', {
                currentPage: 'edit goods',
                user: req.session.user,
                rows,
                units,
                data: rows[0]
            });
        }
        catch (e) {
            console.log(e)
        }

    });


    router.post("/edit/:barcode", async function (req, res) {
        const barcode = req.params.barcode
        const { name, stock, purchaseprice, sellingprice, unit} = req.body
        console.log(req.body, 'ada aja kali')
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                const { rows } = await db.query('UPDATE goods SET name= $1, stock= $2, purchaseprice= $3, sellingprice= $4, unit= $5 WHERE barcode= $6', [ name, stock, purchaseprice, sellingprice, unit, barcode])
                res.redirect('/goods')
                return;
            } else {// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                const picture = req.files.picture
                const pictureName = `${Date.now()}-${picture.name}`
                const uploadPath = path.join(__dirname, '..', 'public', 'images', 'upload', pictureName);
                console.log(uploadPath, 'ada')
                // Use the mv() method to place the file somewhere on your server
                picture.mv(uploadPath, async function (err) {
                    if (err)
                        return res.status(500).send(err);

                    const { rows } = await db.query('UPDATE goods SET name= $1, stock= $2, purchaseprice= $3, sellingprice= $4, unit= $5, picture= $6 WHERE barcode= $7', [ name, stock, purchaseprice, sellingprice, unit, pictureName, barcode])
                    res.redirect('/goods')
                })
            }
        }
        catch (e) {
            console.log(e)
        }
    })

    return router;
}