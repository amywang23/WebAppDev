const express = require('express');
const router = express.Router({ strict: true});

var pool;

function getDbConnPool(req) {
    if (pool) {
        return pool;
    } else {
        return pool = req.app.get('dbPool');
    }
}
// -------------- middlewire -------------------- //
function getQA(req, res, next) {
    var sql = 'select id, question, answer from questions;'
  
    getDbConnPool(req);

    pool.query(sql, function(error, results){
      if(error) throw error;
  
  //console.log(results);
      res.locals.allQAJsonArr = results;
  
      next();
    })
  }
  
  // -------------- express 'get' handlers -------------- //
  router.get('/getQAapi', getQA, function(req, res){
   // console.log('getQuestion')
    const qnum = (req.query.qnum)? parseInt(req.query.qnum) : 0;
    var allQA = res.locals.allQAJsonArr;
  
   // console.log(allQA[ (qnum < allQA.length)? qnum: 0 ]);
    var qa = allQA[ (qnum < allQA.length)? qnum: 0 ];
    qa.totalqnum = allQA.length;
    qa.qnum = qnum;
    res.json( qa );
  });
  
  router.get('/', function(req, res){
      console.log('no sub-page');
      res.render('mapgame');
  });

  module.exports = router;
  
