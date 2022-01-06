const express = require ('express');
const router = express.Router ({ strict : true })

var data =[
        ['smallest positive number', 'gold medal', 'single', 'the best'],
        ['smallest prime number', 'silver medal', 'a couple', 'only even prime number'],
        ['triple', 'bronze medal', 'triangle', 'first odd prime number'],
        ['quad', 'no medal for you', 'squares and quadrilaterals', "sounds like death in chinese"]
    ]
    
function isInteger(str) {
    return !isNaN(str) && Number.isInteger(parseFloat(str));
}

router.get('/:somepage', function(req,res) {
    const {num_facts, format} = req.query;
    var numfacts = 4;
    var theformat = "";
    if(typeof num_facts !== "undefined") {
        numfacts=num_facts;
    }
    if(typeof format !== "undefined") {
        theformat=format;
    }
    var pgnum = req.params.somepage;
    if(isInteger(pgnum) && pgnum > 0 && pgnum <= 4 
        && isInteger(numfacts) && numfacts > 0 && numfacts <= 4
            && (theformat === "json" || theformat === "")) {
        var params = {
            'value' : req.params.somepage,
            'facts' : data[pgnum-1].slice(0, numfacts),
        }
        if(format === "json") {
            res.json(params);
        } else {
            res.render('content',params);
        }
    } else {
        res.render('error');
    }
});

module.exports = router;
