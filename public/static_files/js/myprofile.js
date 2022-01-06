const MY_COOKIE_NAME = 'myname';
const CLICK_COOKIE_NAME = "clickcount";

function update_display_click() {
    var cval = (get_cookie(CLICK_COOKIE_NAME))? get_cookie(CLICK_COOKIE_NAME) : 0;
    console.log("click =" + cval);
    var p_display = document.getElementById('click_display');
    console.log("update_display_name: p_display"+p_display);
    p_display.innerHTML = cval ;
}

function set_cookie(cookie_name, cval) {
    document.cookie = `${cookie_name}=${cval};path=/`
}

function get_cookie(cookie_name) {
    var decodedCookie = decodeURIComponent(document.cookie);
    if (decodedCookie && decodedCookie.includes(cookie_name)) {
        return decodedCookie
            .split('; ')
            .find(row => row.startsWith(`${cookie_name}=`))
            .split('=')[1];
    } else {
        return null;
    }
}

console.log(document.cookie)

update_display_click()
