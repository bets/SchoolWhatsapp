/** Notes
* - errorModel comes from main.js showStatus()
* - emojiModel comes from Emoji.js emojiModel()
*/

//If press enter send password too
q("#loginModel input[type=password]").addEventListener("keyup", (e) => { if (e.keyCode == 13) getBasics(); });

/** 
 * In loginModel password check - Get webhooks from Make after password check
 * */
async function getBasics() {
    let body = {
        "password": q('input[type=password]').value,
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    };

    showStatus("בדיקת סיסמה");
    const response = await fetch('https://hook.eu1.make.com/byeoipdssunukstesd153infg5s3v2f5', options);
    let jsonRe = await response.json();
    if (response.status == 401) {
        showStatus(response, true);
        q("#loginModel input").style.borderColor = "red";
    } else if (response.status != 200) {
        showStatus("שגיאה בכניסה לחשבון", true);
        showStatus(response, true);
    }
    else {
        showStatus("סיסמה תקינה");
        //console.log(jsonRe);
        localStorage.basics = JSON.stringify(jsonRe);
        q("#loginModel").close();
        continueStart();
        return true;
    }
    return false;
}

/**
 * Open model for notifications  
 */
function noteModel(note, title) {
    q("#noteModel .sectionTitle").innerHTML = title ? title : "הודעה";
    q("#noteModel .note").innerHTML = note;
    q("#noteModel").showModal();
}

/** 
* Open predefined title model
* */
function titleModel() {
    q("#titleModel").showModal();
}

qa("#msgTitles div").forEach((el) => {
    el.addEventListener("click", insertTitle);
});
/** 
 * Add bold predefined title to text message
 * */
function insertTitle(e) {
    let title = `*${e.target.innerText}*\r\n\r\n`;
    q("#msg").value = title + q("#msg").value;
    q("#titleModel").close();
    q('#msg').focus();
}

function closeModels() {
    qa('dialog').forEach((modelEl) => {
        modelEl.addEventListener('click', (event) => modelEl.id != "loginModel" && event.target == modelEl && modelEl.close());
    })
}

/** 
 * Open settings model
 * */
function settingsModel() {
    q("#settingsModel").showModal();
}
/** 
 * Open faq model
 * */
function faqModel() {
    q("#faqModel").showModal();
}