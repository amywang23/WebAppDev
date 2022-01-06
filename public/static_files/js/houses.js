//updates the display of points on the page
function updatePoints(event){
    var user = userToBeUpdated(event.target);
    console.log(user);
    
    document.getElementById("points+" + user.id).value = "0";
    
    var elem = document.getElementById('totalpoints+' + user.id);
    elem.innerHTML = parseInt(elem.innerHTML) + parseInt(user.points);

    var ajax_params = {
        'url'     : "updatepoints?userid=" + user.id + "&points=" + user.points,
        'type'    : "get",
        'success' : onUpdatePointsResponse    // the name of the callback function to call
    }
    // run AJAX function 
    $.ajax( ajax_params )
}

//redisplays all the buttons with updated total point values
function onUpdatePointsResponse (responseObject) {
    // Jquery will automatically convert text to an object if it 
    //  recognizes that the result is JSON
    
    console.log(responseObject)
    var tempHtml = '';
    for(var i = 0; i < responseObject.length; i++){
        tempHtml += `<div class="col-md-5">
            <button type="button" class="btn btn-primary btn-lg mt-3 house-${responseObject[i].houseid}"
            onclick="displayHouseUsers(${responseObject[i].houseid})">
            ${responseObject[i].housename} <span class="badge badge-light">${responseObject[i].points}</span>
            </button>                
        </div>` ;

        //tempHtml += '<p>' +  responseObject[i].housename + ' : ' + responseObject[i].points + '</p>'
    }
    
    document.getElementById('points_sum').innerHTML = tempHtml;
    
}

//displays the users in a house when the house button is clicked
function displayHouseUsers(houseId){
    var offset = document.getElementById('offset').value;
    var totalcount = document.getElementById('totalcount').value;
    var showmyinput = document.getElementById('showmyinput').value;
    console.log(offset + '-' + totalcount);

    var ajax_params = {
        'url'     : "loaduserbyhouse?houseid="+houseId+"&totalcount="+totalcount+"&showmyinput="+showmyinput,
        'type'    : "get",
        'success' : onDisplayHouseUsersResponse    // the name of the callback function to call
    }
    // run AJAX function 
    $.ajax( ajax_params )
}

//pass data into the handlebars template and set whole display as a block
function onDisplayHouseUsersResponse (responseObject) {
    // Jquery will automatically convert text to an object if it 
    //  recognizes that the result is JSON
    
    if(responseObject.userhouse_data) {
        var source = $('#userhousetable-template').html();
        var template = Handlebars.compile(source);
        var html = template(responseObject);

        //console.log(html);

        //document.getElementById('offset').value = responseObject.offset;
        document.getElementById('houseuserstable').innerHTML = html;
        document.getElementById('userhousedisplay').style.display = 'block';
    } 
    
}

//hides the users from being displayed
function hideHouseUsers(){
    document.getElementById('houseuserstable').innerHTML = '';
    document.getElementById('userhousedisplay').style.display = 'none';
}

//shows the specific inputs the user has made
function displayMyInputs() {
    document.getElementById('showmyinput').value = 'true';
    document.location='userhousesum?showmyinput=true';
}

//shows the inputs that everyone who has visited made
function displayAllInputs() {
    document.location='userhousesum?showmyinput=false';
}

//returns the id and points of the user that is going to be updated
function userToBeUpdated(btnElem) {
    console.log(btnElem.value);
    console.log(document.getElementById('points+'+btnElem.value).value);

    return {
        'id': parseInt(btnElem.value),
        'points': parseInt(document.getElementById('points+'+btnElem.value).value)
    }
}
