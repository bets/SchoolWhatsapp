start();
var Make;
function start() {
    if (localStorage.basics == null) {
        q("#loginModel").showModal();
        return;
    }
    continueStart();
}

async function continueStart() {
    Make = JSON.parse(localStorage.basics);

    if (localStorage.school == null)
        await getSchool();
    let school = JSON.parse(localStorage.school);

    createSchool(school);
    setSelectEvents();
}

//If press enter send password too
q("#loginModel input[type=password]").addEventListener("keyup", (e) => { if (e.keyCode == 13) getBasics(); });

/** 
 * Get webhooks from Make after password check
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

    displayStatus("בדיקת סיסמה");
    const response = await fetch('https://hook.eu1.make.com/byeoipdssunukstesd153infg5s3v2f5', options);
    let jsonRe = await response.json();
    if (response.status == 401) {
        displayStatus(response, true);
        q("#loginModel input").style.borderColor = "red";
    } else if (response.status != 200) {
        displayStatus("שגיאה בכניסה לחשבון",true);
        displayStatus(response, true);
    }
    else {
        displayStatus("סיסמה תקינה");
        //console.log(jsonRe);
        localStorage.basics = JSON.stringify(jsonRe);
        q("#loginModel").close();
        continueStart();
        return true;
    }
    return false;
}

/** 
 * Sign off by removing basics
 * */
function signOff() {
    displayStatus("יציאת משתמש");
    localStorage.removeItem('basics');
    location.reload();
}
/** 
 * When school is saved but groups chaged, clear storage and fetch groups
 * */
function refetchSchool() {
    localStorage.removeItem('school');
    localStorage.removeItem('schoolFlat');
    location.reload();
}
/** 
 * Get class groups from bulldog whatsapp through Make
 * */
async function getSchool() {
    displayStatus('משיכת קבוצות מצריכה פתיחת חשבון בולדוג', true);
    return;

    displayStatus("נשלחה בקשה לקבלת קבוצות הוואטסאפ של בית הספר מבולדוג");
    const response = await fetch(Make.getSchool);

    if (response.status != 200) {
        displayStatus(response, true);
        displayStatus("שגיאה בקבלת הקבוצות מבולדוג", true);
        return false;
    }
    let groups = await response.json();
    //console.table(groups);

    var cls = groups.reduce((accu, curr) => {
        if (!curr.name.includes('טסט')) return accu;
        let m = curr.name.match(/[\u05D0-\u05EA]{1,2}'?"?[\u05D0-\u05EA]?(\d)/);
        let letter = m[0].replace(/[^\u05D0-\u05EA]/g, '');//remove all but letters
        //var m = curr.name.match(/([\u05D0-\u05EA])(\d)/);
        accu.push({
            class: letter + m[1],
            letter: letter,
            num: m[1],
            wid: curr.wid
        });
        return accu;
    }, []).sort((a, b) => a.class.localeCompare(b.class));

    localStorage.schoolFlat = JSON.stringify(cls);
    //console.table(cls);

    let school = cls.reduce((accu, curr, i) => {
        var grp = {
            num: curr.num
        };
        if (i == 0 || curr.letter != cls[i - 1].letter) {
            accu.push({
                grade: curr.letter,
                groups: [grp]
            });
        } else {
            accu[accu.length - 1].groups.push(grp);
        }
        return accu;
    }, []);

    localStorage.school = JSON.stringify(school);
    //console.table(school);
}

/** 
 * Create class selector UI
 * */
function createSchool(school) {
    [...school].forEach((shichva) => {
        let gradeTemplate = document.querySelector("#template details").cloneNode(true);
        let labelTemplate = document.querySelector("#template label").cloneNode(true);
        gradeTemplate.querySelector("summary input").id = shichva.grade;
        gradeTemplate.querySelector("summary").innerHTML += "כיתות " + shichva.grade + "'";
        shichva.groups.forEach((cls) => {
            let labelClone = labelTemplate.cloneNode(true);
            labelClone.innerHTML += `${shichva.grade}' <sub>${cls.num}</sub>`;
            labelClone.querySelector("input").id = shichva.grade + cls.num;
            gradeTemplate.append(labelClone);
        });
        document.querySelector("#allGrades").append(gradeTemplate);
    });
    document.querySelector("#template").remove();
}
/** 
 * Attach events to class selector UI
 * */
function setSelectEvents() {
    let boxes = document.querySelectorAll("#groupSelector input");
    boxes.forEach((el) => {
        el.addEventListener("click", (e) => {
            // console.log("click " + e.target.className);
            let grade =
                e.target.id != "all"
                    ? e.target.closest("details").querySelector(".grade").id
                    : "all";
            // If marking all classes in grade
            if (e.target.classList.contains("grade")) {
                let gradeClasses = e.target.closest("details").querySelectorAll("input");
                gradeClasses.forEach((el) => {
                    el.checked = e.target.checked;
                })
                //If marking all school
            } else if (e.target.id == "all") {
                boxes.forEach((el) => {
                    el.indeterminate = false;
                    el.checked = e.target.checked;
                });
            }
            checkParents(grade, boxes);
        });
    });
}

/** 
 * Update grade if a class was marked or All School if it was marked
 * */
function checkParents(s, boxes) {
    let boxes2check =
        s != "all"
            ? [...boxes].filter(
                (box) =>
                    box.id.includes(s) && box.id != s && box.id != "all"
            )
            : [...boxes].filter((box) => box.id != s);
    // console.log(boxes2check);
    let checkedCount = boxes2check.filter((box) => box.checked).length;
    // console.log(`${s} - ${checkedCount}/${boxes2check.length}`);

    document.querySelector("#" + s).indeterminate = false;
    switch (checkedCount) {
        case boxes2check.length:
            document.querySelector("#" + s).checked = true;
            break;
        case 0:
            document.querySelector("#" + s).checked = false;
            break;
        default:
            document.querySelector("#" + s).indeterminate = true;
    }

    if (s != "all") checkParents("all", boxes);
    return;
}

/** 
 * Get all checked ids and send to each group
 * */
function send(hasTime) {
    if (q("#msg").value.length < 4) {
        displayStatus("נא להוסיף תוכן להודעה", true);
        return;
    }
    if (hasTime) {
        let inputDate = new Date(q("#deliverAt").value);
        let timestamp = Date.parse(inputDate);              
        if (isNaN(timestamp) == true) {
            displayStatus("נא להוסיף זמן לתזמון", true);
            return;
        }
        let currentDate = new Date();
        if (inputDate.getTime() < currentDate.getTime() + 5 * 60000) {
            displayStatus("התזמון חייב להיות לפחות 5 דקות מעכשיו ולא בעבר", true);
            return;
        }
    }

    let checkedIds = [...qa("details input:checked:not(.grade)")].map(x => x.id);
    if (checkedIds.length == 0) {
        displayStatus("נא לבחור כיתה", true);
        return;
    }
    displayStatus("קליטת הודעות מתבצעת");
    let schoolFlat = JSON.parse(localStorage.schoolFlat);
    let sentNum = 0;
    checkedIds.every((id) => {
        let wid = schoolFlat.find(x => x.class == id).wid;
        let sentOk = sendOne(wid, hasTime);
        if (sentOk)
            sentNum++;
        return sentOk;
    });

    if (sentNum > 0) {
        displayStatus(`${sentNum} הודעות נקלטו וישלחו בדקות הקרובות`);
        resetMsg();
    }
    if (sentNum == 0)
        displayStatus("שגיאה - לא נקלטו ההודעות", true);
    else if (sentNum != checkedIds.length) {
        displayStatus(`שגיאה - לא נקלטו כל ההודעת`, true);
    }
}
/** 
 * After send empty msg and close deliverAt
 * */
function resetMsg() {
    q('#msg').value = "";
    if (!q("#sendSelect").classList.contains('hide'))
        showDeliverAt();
}
/** 
 * Send one group message
 * */
async function sendOne(wid, hasTime) {
    let body = {
        "message": JSON.stringify(q("#msg").value),
        "group": wid
    };
    if (hasTime) {
        body.deliverAt = q("deliverAt").value + ":00.000z";
    }

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    };

    console.log("Sending message through Bulldog");
    displayStatus('שליחה מצריכה פתיחת חשבון בולדוג', true);
    return;
    const response = await fetch(Make.sendOne, options);
    let jsonRe = await response.json();
    if (response.status != 200) {
        displayStatus(response, true);
        return false;
    }
    else {
        //console.log(jsonRe);
        return true;
    }
}

/** 
 * Add bold or italic char to selected text
 * */
function strEdit(char, isEmoji) {
    let textarea = document.querySelector("#msg");
    let textAr = [...textarea.value];

    textAr.splice(selectionStart, 0, char);
    if (!isEmoji)
        textAr.splice(selectionEnd, 0, char);

    // console.log(textAr.join(''));
    textarea.value = textAr.join("");
    q('#msg').focus();
    if (selectionStart + 1 == selectionEnd) {
        let position = selectionEnd + (q('#msg').value.substring(0, selectionEnd).match(regexExp) || []).length;
        if (isEmoji) position++;
        q('#msg').selectionEnd = position;
    }
}

["click", "select", "keyup"].forEach((eventType) => {
    q("#msg").addEventListener(eventType, savePosition);
});
var selectionStart;
var selectionEnd;
const regexExp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
/** 
 * Save position of selected text for bold or italic
 * */
function savePosition(e) {
    selectionStart = document.activeElement.selectionStart;
    selectionEnd = document.activeElement.selectionEnd + 1;

    //fix position when emoji exits (it addes a fake char to position)
    // Regular expression to match emoji
    selectionStart -= (q('#msg').value.substring(0, selectionStart).match(regexExp) || []).length;
    selectionEnd -= (q('#msg').value.substring(0, selectionEnd).match(regexExp) || []).length;

    //console.log(selectionStart);
    //console.log(selectionEnd);
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

/** 
 * Show\hide datetime picker and send options
 * */
function showDeliverAt() {
    //["#eliverAt", "sendAt", "sendNowAt"]
    qa(".tuggle").forEach((el) => {
        el.classList.toggle('hide');
        if (q("#sendSelect").classList.contains('hide'))
            q(".button.sendImg").classList.remove('disable')
        else
            q(".button.sendImg").classList.add('disable')
        //el.style.display = window.getComputedStyle(el).display === 'none' ? 'inline' : 'none';
    })
}
function deliverAtSend(val) {
    q("#sendSelect").value = "";//clear select for next time

    send(true);
    if (val == "sendBoth")
        send();
}
//function sendBoth() {
//    send();
//    send(true);
//}

/** 
 * Show\hide datetime picker and send options
 * */
function displayStatus(msg, error) {
    if (error) {
        q("#errorModel .error").innerHTML = msg;
        q("#errorModel").showModal();
    }

    //all the rest is hidden and waiting for a futuer option to see the log
    let div = document.createElement('div');

    let textSpan = document.createElement('span');
    textSpan.append(msg);
    if (error)
        textSpan.classList.add('error');

    let timeSpan = document.createElement('span');
    timeSpan.append(getTimestamp());

    div.append(timeSpan);
    div.append(textSpan);
    q("#statusPan p").prepend(div);
}
function getTimestamp() {
    const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
    const d = new Date();

    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${pad(d.getMinutes()) }`;
    //return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 
 * Open settings model
 * */
function settingsModel() {
    q("#settingsModel").showModal();
} 

function q(selector) {
    return document.querySelector(selector);
}
function qa(selector) {
    return document.querySelectorAll(selector);
}