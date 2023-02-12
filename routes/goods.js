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
        try{
            const { rows } = await db.query('SELECT unit, name FROM units')
            res.render('goods/add', {
                user: req.session.user,
                currentPage: 'add',
                rows: rows
            })
        }
        catch(e){
            console.log(e)
        }
    });

    router.post('/add', isLoggedIn, async function (req, res) {
        const { barcode, name, stock, purchaseprice, sellingprice, unit, picture } = req.body
        // console.log(unit, name, note, 'KACAU')

        try {
            const { rows } = await db.query('INSERT INTO goods(barcode, name, stock, purchaseprice, sellingprice, unit, picture) VALUES ($1, $2, $3, $4, $5, $6, $7)', [barcode, name, stock, purchaseprice, sellingprice, unit, picture])
            // const { rows } = await db.query('SELECT unit, name FROM units ORDER BY unit', [])
            // console.log(rows, 'LOKAL')
            res.redirect('/goods', {
                goods: rows
            })

        }


        
        catch (e) {
            res.send(e)
        }
    });
//upload file
    // router.post('/upload', function(req, res) {
    //     let fileName = req.body,fileNamefileName;
    //     let sampleFile;
    //     let uploadPath;
      
    //     if (!req.files || Object.keys(req.files).length === 0) {
    //       return res.status(400).send('No files were uploaded.');
    //     }
      
    //     // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    //     sampleFile = req.files.sampleFile;
    //     uploadPath = path.join( __dirname,'..','views','goods','upload', `${Date.now()}-${sampleFile.name}`);
      
    //     // Use the mv() method to place the file somewhere on your server
    //     sampleFile.mv(uploadPath, function(err) {
    //       if (err)
    //         return res.status(500).send(err);
      
    //       res.send('File uploaded!');
    //     });
    //   });



    return router;
}