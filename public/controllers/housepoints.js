const express = require('express');
const router = express.Router({ strict: true });

var templateHtml = `
{{#each userhouse_data}}
<tr class=house-{{this.houseid}}>
    <td style="width: 24%">
        {{this.username}}
    </td>
    <td style="width: 36%">
        <span class="font-weight-bold">has <span id="totalpoints+{{this.id}}">{{this.points}}</span> points</span>
    </td>
    <td style="width: 12%">
        <input type="text" name="points" id="points+{{this.id}}" value="0" size="6">
    </td>
    <td style="width: 28%">
        <button value="{{this.id}}" onclick="updatePoints(event)">Add/Deduct Points</button>
    </td>
</tr>
{{/each}}                

`;

var templateHtmlForGeneral = `
{{#each userhouse_data}}
<tr class=house-{{this.houseid}}>
    <td>
        {{this.username}}
    </td>
    <td>
        <input type="text" name="points" id="points+{{this.id}}" value="{{this.points}}">
    </td>
</tr>
{{/each}}                

`;

var pool;

//if pool isn't empty, then return pool, but if it is, fill it with dbPool
function getDbConnPool(req) {
    if (pool) {
        return pool;
    } else {
        return pool = req.app.get('dbPool');
    }
}

// --------------my middleware ---------------------
//gets the id and name of each house
function getAllHouses(req, res, next){
    var sql = 'SELECT house_id houseid, house_name housename  FROM vhouses order by house_name;'
    getDbConnPool(req);
    pool.query(sql, function(error, results, fields){
        if (error) throw error;

        //console.table(results);

        res.locals.allHousesJsonArr = results;
        next();
    }) 
}

//updates the amount of points a user has
function updateUserPoints(req, res, next) {
    var userid = req.query.userid;
    var points = req.query.points;
    //fromIonUser should come from ion site with login
    var profile = req.session.profile;
    var fromIonUser = profile.ion_username + "";

    console.log('userid: ' + userid + ' poinst: ' + points);

    let sql = `insert into points (from_username, amount, to_vuserid ) values ('${fromIonUser}', ${points}, ${userid}); `;
    getDbConnPool(req);

    pool.query(sql, function(error, results, fields){
        if (error) throw error;
        next()
    }) 
}

// get userHouseJsonArray and store it in 
// res.locals.allUserHouseJsonArr -- all users for all houses
// res.locals.housePointsJsonArr -- points for each house
// res.locals.totalCountUserHouse -- total count of users for all houses
function selectAllUserHouse(req, res, next){

    var showMyInput = (req.query.showmyinput) ? req.query.showmyinput : null;

    if(showMyInput){
        if(showMyInput != 'true'){
            showMyInput = null;
        }
        res.locals.showMyInput = showMyInput;
        req.session.showMyInput = showMyInput;    
    } else {
        showMyInput = req.session.showMyInput;
    }

    var sql;

    if (showMyInput) {
        var profile = req.session.profile;
        var ionUser = profile.ion_username + "";
        sql = `select v.user_id id, v.user_name username, ifnull(sum(t.amount), 0) points, 
        t.from_username ionuser, h.house_name housename, h.house_id houseid 
        from points t
        right join vusers v on t.to_vuserid = v.user_id
        join vhouses h on v.house_id = h.house_id
        where t.from_username = '${ionUser}'
        group by v.user_id
        order by housename, username ;  `;  
    
    } else {
        var sql = `select v.user_id id, v.user_name username, ifnull(sum(t.amount), 0) points, 
        t.from_username ionuser, h.house_name housename, h.house_id houseid 
        from points t
        right join vusers v on t.to_vuserid = v.user_id
        join vhouses h on v.house_id = h.house_id
        group by v.user_id
        order by housename, username ;  `;  

    }
 
    getDbConnPool(req);

    pool.query(sql, function(error, results, fields){
        if (error) throw error;

        var houseNames = res.locals.allHousesJsonArr;

        var housePoints = pointsByHouses(results, "houseid");

        //console.log('results.length:' + results.length );
        res.locals.allUserHouseJsonArr = results;
        res.locals.housePointsJsonArr = housePoints;
        res.locals.totalCountUserHouse = results.length;
        next();
    }) 
}

// -------------- express 'get' handlers -------------- //
router.get('/userhousesum',
getAllHouses,
selectAllUserHouse,
function(req,res){
    var currentHouseId = res.locals.currentHouseId;
    var offset = res.locals.offset;
    var totalCount = res.locals.totalCountUserHouse;
    var results = res.locals.userHouseJsonArr;
    var housePoints = res.locals.housePointsJsonArr;
    var showMyInput = req.session.showMyInput;

    //console.log(req.session.allhousesname);
    // store houses name jsonArray into session
    //var allHouseNames = (req.session.allhousesname) ? req.session.allhousesname : getAllHouses();
    var allHouseNames = res.locals.allHousesJsonArr;
    
    req.session.allhousesname = allHouseNames;

    var params = {
        'house_points': housePoints,
        'userhouse_data' : results,
        'totalcount': totalCount,
        'offset': offset,
        'template': templateHtml,
        'housenames': allHouseNames,
        'houseid': currentHouseId,
        'showmyinput': showMyInput 
    }
    //console.log(params);

    //check authentication
    if('authenticated' in req.session){
        params = {
            'house_points': housePoints,
            'userhouse_data' : results,
            'totalcount': totalCount,
            'offset': offset,
            'template': templateHtml,
            'housenames': allHouseNames,
            'houseid': currentHouseId,
            'showmyinput': showMyInput 
        };
        res.render('user_house',params)
    } else {
        params = {
            'house_points': housePoints,
            'userhouse_data' : results,
            'totalcount': totalCount,
            'offset': offset,
            'template': templateHtmlForGeneral,
            'housenames': allHouseNames,
            'houseid': currentHouseId,
            'showmyinput': showMyInput 
        };
    
        res.render('user_house_general',params)
    }

})


router.get('/userhousebyhouseid',
selectAllUserHouse,
getAllHouses,
function(req,res){
    var currentHouseId = (req.query.houseid) ? parseInt( req.query.houseid ) : 0;
    res.locals.currentHouseId = currentHouseId;
    //var offset = res.locals.offset;
    //var totalCount = res.locals.totalCountUserHouse;
    var results = res.locals.userHouseJsonArr;
    var housePoints = res.locals.housePointsJsonArr;

    results = getHouseUsersByHouseid(results, currentHouseId);
    //console.log(req.session.allhousesname);
    // store houses name jsonArray into session
    //var allHouseNames = (req.session.allhousesname) ? req.session.allhousesname : getAllHouses();
    var allHouseNames = res.locals.allHousesJsonArr;

    var showMyInput = req.session.showMyInput;
    
    req.session.allhousesname = allHouseNames;

    var params = {
        'house_points': housePoints,
        'userhouse_data' : results,
        'totalcount': totalCount,
        'offset': offset,
        'template': templateHtml,
        'housenames': allHouseNames,
        'houseid': currentHouseId,
        'showmyinput': showMyInput 
    }

    // res.render('user_house',params)
        res.json(params);


})

router.get('/adduserform', getAllHouses, function(req, res){
    var allHouseNames = req.session.allhousesname;
    var params = {
        'housenames': allHouseNames
    }
    // console.log(params);
    res.render('userhouseform', params);
})

router.get('/adduser', 
    function(req, res){
        var showMyInput = req.session.showMyInput;

        var profile = req.session.profile;
        var fromIonUser = profile.ion_username + "";

        var username = req.query.user_name;
        var houseid = (req.query.house_id)? parseInt( req.query.house_id ) : 0 ;
    
        console.log(username + ' - ' + houseid );

        let sql = `insert into vusers(user_name, house_id) values ('${username}', ${houseid}); `;

        console.log(sql);

        getDbConnPool(req);

        pool.query(sql, function(error, results, fields){
            if (error) throw error;
            res.redirect('userhousesum');
        }) 
})

// --- for ajax calls
router.get('/updatepoints', 
    updateUserPoints,
    selectAllUserHouse,
    function(req, res){
        var housePoints = res.locals.housePointsJsonArr;
    
        res.json(housePoints);
})

router.get('/loaduserbyhouse',
    selectAllUserHouse,
    function(req,res){
        var currentHouseId = (req.query.houseid)? parseInt(req.query.houseid) : 0;
        var results = (res.locals.allUserHouseJsonArr)? res.locals.allUserHouseJsonArr : null;

        var filteredResults = results.filter((elem) => {return elem.houseid === currentHouseId});

        var params = {
            'userhouse_data' : filteredResults,
            'houseid': currentHouseId
        }

        res.json(params)

})

// --------------- helper ------------------ /

//return all users that are in the same house
function getHouseUsersByHouseid(houseUsersArr, houseid) {
    if(houseid <= 0) return houseUsersArr;  // no houseid specified
    var newArr = houseUsersArr.filter((el) => {
        return el.houseid === houseid;
    })
    //console.log('filtered houseusers');
    //console.log(newArr);

    return newArr;
}

//total amount of points for each house
function pointsByHouses (arr, key) {
    //console.log(arr)
    //console.log(arr[1]['houseid'])
    var result = [];
    arr.reduce(function(res, value){

        if(!res[value[key]]) {
            res[value[key]] = {
                houseid: value['houseid'],
                housename: value['housename'],
                points: 0
            };
            result.push(res[value[key]]);
        }
        res[value[key]].points += value['points'];

        return res;
    }, {});

    //console.log(result);
    return result;
}


module.exports = router;
