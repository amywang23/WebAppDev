const MY_COOKIE_NAME = 'myname';
const CLICK_COOKIE_NAME = "clickcount";

function begin(){
    console.log("set_cookie.js begin");
    var cval = get_cookie(MY_COOKIE_NAME);
    console.log("name =" + cval);
    update_display_name(cval);
    
    cval = get_cookie(CLICK_COOKIE_NAME);
    console.log("click =" + cval);
    update_display_click(cval)
    
    console.log("done set_cookie.js begin");
    
}

function increment_and_update() {
    var cval = parseInt( get_cookie(CLICK_COOKIE_NAME) );
    if(Number.isInteger(cval)) {
        cval++;
        set_cookie(CLICK_COOKIE_NAME, cval);
        update_display_click(cval);
    }
}

function update_display_name(cval) {
    var p_display = document.getElementById('name_display');
    console.log("update_display_name: p_display"+p_display);
    p_display.innerHTML = "Hello: " + cval + "!";
}

function update_display_click(cval) {
    var p_display = document.getElementById('click_display');
    console.log("update_display_name: p_display"+p_display);
    p_display.innerHTML = "You clicked " + cval + " times!";
}

function set_cookie(cookie_name, cval) {
    document.cookie = `${cookie_name}=${cval};path=/`
}

function get_cookie(cookie_name) {
    var decodedCookie = decodeURIComponent(document.cookie);
    return decodedCookie
        .split('; ')
        .find(row => row.startsWith(`${cookie_name}=`))
        .split('=')[1];
}

console.log(document.cookie)

begin()
