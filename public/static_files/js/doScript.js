// ------  game  ------ //
const UNSTARTED = 0;
const RUNNING = 1;
const FINISHED = 2;

const CORRECT = 0;
const INCORRECT = 1;
const GUESSED = 2;

var ar_states_list = Array.from( document.querySelectorAll('#outlines > path') );

ar_states_list.forEach( function(elem){
    elem.addEventListener("click", on_game_event);
});

function on_game_event(e) {
    if (game_object.lifecycle === RUNNING) {

        var guess_res = process_guess(this);

        if (guess_res===CORRECT) {

            if(game_object.current_question_num === game_object.total_question_num -1) {

                // give some time delay. otherwise, the last correct chose will not show long enough
                setTimeout(win, 300);
            } else if (game_object.attempts_remaining-1 < 0) {
                lose();
            }else{
                // not answer all question yet. get the next question
                displayModal('Correct! Please continue.');

                // give some time delay.
                // otherwise, the correct chose will not show long enough for singe choise question
                setTimeout(resetMap, 1000);

                getNextQA();
            }

        } else if (guess_res===INCORRECT) {
            if (game_object.attempts_remaining <= 0) {
                lose();
            }
        }
    }
}

function process_guess(elem) {
    //console.log('process guess');
    //console.log(elem.id)

    var already_guessed = elem.getAttribute('guessed');
    
    if (already_guessed=='true') {
        return GUESSED;
    } else {
        elem.setAttribute('guessed',true);				// indicate this choice has been guessed

        game_object.attempts_remaining--;
        update_moves();

        var choice = elem.id;

        // compare choice with correct answer, which is an array
        if (game_object.correct_answer.includes(choice)) {
            // choice is included in the correct answer
            elem.style['fill'] = 'green';
            game_object.correct_answer = removeValueFromArray(game_object.correct_answer, choice);

            if (game_object.correct_answer.length) return INCORRECT;    // answere not completed yet. still return INCORRECT. 
            else return CORRECT;
        } else {
            //incorrect
            elem.style['fill'] = 'red';
            return INCORRECT;
        }
    }
}

function removeValueFromArray(arr, val) {
    return arr.filter(item => item != val);
}

// reset map for another question
function resetMap() {
    ar_states_list.forEach( function(elem){
        elem.style['fill'] = '#AAA';
    });
    ar_states_list.forEach( function(elem){
        elem.removeAttribute('guessed');
    });

}

function win() {
    document.getElementById('response').innerHTML="WIN";
    displayModal('Congratulations! You win.');
    end_game();
    reset_game();
}

function lose() {
    document.getElementById('response').innerHTML="LOSE";
    displayModal('Sorry, you lose.');
    end_game();
    stop_game();
    //stopTimer();
    //stopGameTimer();
}

function update_moves() {
    var m = document.getElementById('moves');
    m.innerHTML = game_object.attempts_remaining;
}




/* THIS IS THE OBJECT THAT CONTROLS THE GAME STATE */

var game_object = {
    'lifecycle' : UNSTARTED,
    'correct_answer' : null,
    'time_limit': 60,               // 60 sec
    'attempts_limit' : 20,          // 20 attempts
    'attempts_remaining' : null,
    'total_question_num' : 0,
    'current_question_num': -1
};


/* GAME LIFECYCLE TRANSITION METHODS */

function init_game() {
    if (game_object.lifecycle === UNSTARTED) {
        
        // adjust lifecycle
        game_object.lifecycle = RUNNING;

        // change start button display
        var b = document.getElementById('btn_start');
        //b.style.backgroundColor = "#4E7EFF";

        //b.classList.remove('active');
        //b.classList.add('inactive');
        displayInactive(b);

        // change stop button green
        var s = document.getElementById('btn_stop');
        displayActive(s);
                
        // set remaining moves
        game_object.attempts_remaining = game_object.attempts_limit ;

        getNextQA();
    
        // for stopwatch
        startTimer();

    }

}

function displayActive(elem) {
    elem.classList.remove('inactive');
    elem.classList.add('active');
}

function displayInactive(elem) {
    elem.classList.remove('active');
    elem.classList.add('inactive');
}

function getNextQA() {
    var ajax_params = {
        'url'     : "getQAapi?qnum="+(game_object.current_question_num+1),
        'type'    : "get",
        'success' : ongetQAResponse    // the name of the callback function to call
    }
    // run AJAX function 
    $.ajax( ajax_params )

}

function ongetQAResponse (responseObject) {
    // Jquery will automatically convert text to an object if it 
    //  recognizes that the result is JSON
    
    //console.log(responseObject)

    game_object.total_question_num = responseObject.totalqnum;
    game_object.current_question_num = responseObject.qnum;
    game_object.correct_answer = responseObject.answer.split(',').map(item => item.trim());    
    var tempHtml = '<p> Question: <span style="color: blue;"> ' + responseObject.question + '</span></p>';
    
    document.getElementById('questions').innerHTML = tempHtml;
    
}

function end_game() {

    // make the start button appear inactive
    var b = document.getElementById('btn_start');
    displayInactive(b);

    // make the reset button appear active
    var r = document.getElementById('btn_reset');
    displayActive(r);

    // make the stop button appear inactive
    var s = document.getElementById('btn_stop');
    displayInactive(s);

    // reset the game state
    game_object.lifecycle = FINISHED;
    
    stopTimer();
    // reset map color and 'guessed' attribute
    //resetMap();

}


function reset_game() {

    if (game_object.lifecycle === FINISHED) {

        // clear the response
        document.getElementById('response').innerHTML="";

        // reset the moves
        document.getElementById('moves').innerHTML = '(press start to begin)';

        // make the start button green
        var b = document.getElementById('btn_start');
        displayActive(b);
        
        // make the reset button grey
        var r = document.getElementById('btn_reset');
        displayInactive(r);

        // make the stop button grey
        var s = document.getElementById('btn_stop');
        displayInactive(s);
        
        // reset the game state
        game_object.lifecycle = UNSTARTED;
        game_object.current_question_num = -1;

        document.getElementById('questions').innerHTML = '';
        document.getElementById('questions').innerHTML = '<p>Please click START button to begin the game. </p>';
        resetMap();


        // reset stopwatch
        resetTimer();
    }
}

function stop_game() {

    if (game_object.lifecycle === RUNNING) {

        // clear the response
        document.getElementById('response').innerHTML="";

        // reset the game state
        game_object.lifecycle = FINISHED;
        
        end_game();
    }
}


// --------- stopwatch --------- //
const stopwatchTimer = document.getElementById('times');
var min = 0;
var sec = 0;

function stopTimer() {
    clearInterval(myStopWatch);
    myStopWatch = null;
}

function timeCycle() {
    sec = parseInt(sec);
    min = parseInt(min);

    sec = sec + 1;
    if(sec === 60) {
        stopTimer();
        lose();
    }

    if(sec === 60){
        min += 1;
        sec = 0;
    } 

    if (sec < 10){
        sec = '0' + sec;
    }
    if (min < 10){
        min = '0' + min;
    }
    stopwatchTimer.innerHTML = min + ':' + sec;
}

function startTimer() {
    myStopWatch = setInterval(timeCycle, 1000);
}

function resetTimer() {
    stopwatchTimer.innerHTML = '00:00';
    min = 0;
    sec = 0;    
}
