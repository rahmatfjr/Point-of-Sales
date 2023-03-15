var express = require('express');
var router = express.Router();
var currencyFormatter = require('currency-formatter');
const { isAdmin } = require('../helpers/utils')

/* GET home page. */
module.exports = function (db) {
  router.get('/', isAdmin, async function (req, res) {
    try {
      const { startdate, enddate } = req.query
      let totalpurchases = ''
      let totalsales = ''
      let totalinvoice = ''
      if (!startdate && !enddate) {
        const { rows: searchPurchase } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases')
        totalpurchases = searchPurchase
        const { rows: searchSales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales')
        totalsales = searchSales
        const { rows: searchinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales')
        totalinvoice = searchinvoice
      } else if (startdate != '' && enddate != '') {
        const { rows: searchPurchase } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases WHERE time BETWEEN $1 AND $2', [startdate, enddate])
        totalpurchases = searchPurchase
        const { rows: searchSales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales WHERE time BETWEEN $1 AND $2', [startdate, enddate])
        totalsales = searchSales
        const { rows: searchinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales WHERE time BETWEEN $1 AND $2', [startdate, enddate])
        totalinvoice = searchinvoice
      } else if (startdate != '') {
        const { rows: searchPurchase } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases WHERE time >= $1', [startdate])
        totalpurchases = searchPurchase
        const { rows: searchSales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales WHERE time >= $1', [startdate])
        totalsales = searchSales
        const { rows: searchinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales WHERE time >= $1', [startdate])
        totalinvoice = searchinvoice
      } else if (enddate != '') {
        const { rows: searchPurchase } = await db.query('SELECT sum(totalsum) AS totalpurchases FROM purchases WHERE time <= $1', [enddate])
        totalpurchases = searchPurchase
        const { rows: searchSales } = await db.query('SELECT sum(totalsum) AS totalsales FROM sales WHERE time <= $1', [enddate])
        totalsales = searchSales
        const { rows: searchinvoice } = await db.query('SELECT count(invoice) AS totalinvoice FROM sales WHERE time <= $1', [enddate])
        totalinvoice = searchinvoice
      }



      let totalearnings = totalsales[0].totalsales - totalpurchases[0].totalpurchases

      let purchasesget = ''
      let salesget = ''
      if ( !startdate &&  !enddate ) {
        const { rows: searchpusrchaseget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases GROUP BY bulan, tanggal ORDER BY tanggal`)
        purchasesget = searchpusrchaseget
        const { rows: searchsalesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales GROUP BY bulan, tanggal ORDER BY tanggal`)
        salesget = searchsalesget
      } else if( startdate != '' &&  enddate != ''){
        const { rows: searchpusrchaseget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases  WHERE time BETWEEN $1 AND $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate, enddate])
        purchasesget = searchpusrchaseget
        const { rows: searchsalesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales  WHERE time BETWEEN $1 AND $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate, enddate])
        salesget = searchsalesget 
      } else if( startdate != ''){
        const { rows: searchpusrchaseget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases  WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        purchasesget = searchpusrchaseget
        const { rows: searchsalesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales  WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        salesget = searchsalesget 
      } else if( enddate != ''){
        const { rows: searchpusrchaseget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases  WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        purchasesget = searchpusrchaseget
        const { rows: searchsalesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales  WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        salesget = searchsalesget 
      } 

      let total = purchasesget.concat(salesget)
      let data = {}
      let subtotal = []
      // let month = ["January","February","March","April","May","June","July","August","September","October","November","December"];



      total.forEach(item => {
        if (data[item.bulan]) {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : data[item.bulan].expense, revenue: item.jumlahsales ? item.jumlahsales : data[item.bulan].revenue }
        }
        else {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : 0, revenue: item.jumlahsales ? item.jumlahsales : 0 }
        }
      })


      for (const item in data) {
        subtotal.push({
          monthly: data[item].monthly,
          expense: data[item].expense,
          revenue: data[item].revenue
        })
      }

      console.log('ini query ', req.query.stardate);

      res.render('dashboard/list', {
        purchases: totalpurchases[0],
        sales: totalsales[0],
        invoice: totalinvoice[0],
        totalearnings,
        user: req.session.user,
        currentPage: "POS - Dashboard",
        currencyFormatter,
        subtotal,
        query: req.query
      })
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  })

  router.get('/line', isAdmin, async function (req, res, next) {
    try {
      const { startdate, enddate } = req.query
      let searchPurchase = ''
      let searchSales = ''

      if (startdate != '' && enddate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time BETWEEN $1 AND $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate, enddate])
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time BETWEEN $1 AND $2 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate, enddate])
        searchSales = salesget
      } else if (startdate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time >= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [startdate])
        searchSales = salesget
      } else if (enddate != '') {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales WHERE time <= $1 GROUP BY bulan, tanggal ORDER BY tanggal`, [enddate])
        searchSales = salesget
      } else {
        const { rows: purchasesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahpurchases From purchases GROUP BY bulan, tanggal ORDER BY tanggal`)
        searchPurchase = purchasesget
        const { rows: salesget } = await db.query(`SELECT to_char(time, 'Mon YY') AS bulan, to_char(time, 'YY-MM') AS tanggal, sum(totalsum) AS jumlahsales From sales GROUP BY bulan, tanggal ORDER BY tanggal`)
        searchSales = salesget
      }

      let total = searchPurchase.concat(searchSales)
      let data = {}
      let subtotal = []

      let hasil = []
      let bulan = []


      total.forEach(item => {
        if (data[item.bulan]) {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : data[item.bulan].expense, revenue: item.jumlahsales ? item.jumlahsales : data[item.bulan].revenue }
        } else {
          data[item.bulan] = { monthly: item.bulan, expense: item.jumlahpurchases ? item.jumlahpurchases : 0, revenue: item.jumlahsales ? item.jumlahsales : 0 }
          bulan.push(item.bulan)
        }
      })

      for (const item in data) {
        subtotal.push({
          monthly: data[item].monthly,
          expense: data[item].expense,
          revenue: data[item].revenue
        })
      }

      for (const item in data) {
        hasil.push(data[item].revenue - data[item].expense)
      }

      res.json({ bulan, hasil })
    } catch (error) {
      console.log(error);
      res.send(error)
    }
  })

  router.get('/dougnat', isAdmin, async function (req, res, next) {
    try {
      const { startdate, enddate } = req.query

      if (startdate != '' && enddate != '') {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 2 AND time BETWEEN $1 AND $2', [startdate, enddate])
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 2 AND time BETWEEN $1 AND $2', [startdate, enddate])
        res.json({ direct: direct[0].count, customer: customer[0].count })
      } else if (startdate != '') {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 2 AND time >= $1', [startdate])
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 2 AND time >= $1', [startdate])
        res.json({ direct: direct[0].count, customer: customer[0].count })
      } else if (enddate != '') {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 2 AND time <= $1', [enddate])
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 2 AND time <= $1', [enddate])
        res.json({ direct: direct[0].count, customer: customer[0].count })
      } else {
        const { rows: direct } = await db.query('SELECT COUNT(*) FROM sales WHERE customer = 2')
        const { rows: customer } = await db.query('SELECT COUNT(*) FROM sales WHERE customer != 2')
        res.json({ direct: direct[0].count, customer: customer[0].count })
      }

    } catch (error) {
      console.log(error);
      res.send(error)
    }
  })

  return router;
}
