start();
var Make;
function start() {
    if (localStorage.basics == null) {
        q("#loginModel").showModal();
        return;
    }
    const queryString = new URLSearchParams(window.location.search);
    if (queryString.has('test'))
        q('#testIndicator').classList.remove('hide');

    continueStart();
}

async function continueStart() {
    Make = JSON.parse(localStorage.basics);

    if (localStorage.school == null)
        await getSchool();
    let school = JSON.parse(localStorage.school);

    createSchool(school);
    setSelectEvents();
    displayQueued();
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
        displayStatus("שגיאה בכניסה לחשבון", true);
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
    //displayStatus('משיכת קבוצות מצריכה פתיחת חשבון בולדוג', true);
    //return;

    displayStatus("נשלחה בקשה לקבלת קבוצות הוואטסאפ של בית הספר מבולדוג");
    const response = await fetch(Make.getSchool + "/?type=groups");

    if (response.status != 200) {
        displayStatus(response, true);
        displayStatus("שגיאה בקבלת הקבוצות מבולדוג", true);
        return false;
    }
    let groups = await response.json();
    //console.table(groups);

    var cls = groups.reduce((accu, curr) => {
        const queryString = new URLSearchParams(window.location.search);
        if (queryString.has('test')) {
            if (!curr.name.includes('טסט')) return accu;
        } else {
            if (curr.name.includes('טסט')) return accu;
        }

        let m = curr.name.match(/(?:[\u05D0-\u05EA]")?[\u05D0-\u05EA]{1,2}'?\s?(\d)/);
        if (m == null) return accu;
        let letter = m[0].replace(/[^\u05D0-\u05EA]/g, '');//remove all but letters

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
        let gradeTemplate = document.querySelector("#templates .groupSelector details").cloneNode(true);
        let labelTemplate = document.querySelector("#templates .groupSelector label").cloneNode(true);
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
    //document.querySelector("#template").remove();
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
async function send(hasTime) {
    if (q("#msg").value.length < 4) {
        displayStatus("נא להוסיף תוכן להודעה", true);
        return false;
    }
    if (hasTime) {
        let inputDate = new Date(q("#deliverAt").value);
        let timestamp = Date.parse(inputDate);
        if (isNaN(timestamp) == true) {
            displayStatus("נא להוסיף זמן לתזמון", true);
            return false;
        }
        let currentDate = new Date();
        if (inputDate.getTime() < currentDate.getTime() + 5 * 60000) {
            displayStatus("התזמון חייב להיות לפחות 5 דקות מעכשיו ולא בעבר", true);
            return false;
        }
    }

    let checkedIds = [...qa("details input:checked:not(.grade)")].map(x => x.id);
    if (checkedIds.length == 0) {
        displayStatus("נא לבחור כיתה", true);
        return false;
    }
    displayStatus("קליטת הודעות מתבצעת");
    let groupMsgLocalId = new Date().getTime();
    let schoolFlat = JSON.parse(localStorage.schoolFlat);
    let sentNum = 0;

    for await (const groupIdName of checkedIds) {
        let wid = schoolFlat.find(x => x.class == groupIdName).wid;
        const response = await sendOne(wid, hasTime);
        let jsonRe = await response.json();
        if (response.status != 200) {
            displayStatus(jsonRe.message, true);
            break;
        }
        else {
            //console.log(jsonRe);
            sentNum++;
            if (hasTime) addQueuedToList(groupMsgLocalId, groupIdName, q("#deliverAt").value, jsonRe.message, jsonRe.id);
        }
    }

    if (sentNum != checkedIds.length) {
        displayStatus(`נקלטו ${sentNum}/${checkedIds.length} הודעות, נא לנסות שוב`, true);
        return false;
    }
    displayStatus(`${sentNum}/${checkedIds.length} הודעות נקלטו לשליחה`);
    resetMsg();
    return true;
}
/** 
 * Send one group message
 * */
function sendOne(wid, hasTime) {
    let body = {
        "message": JSON.stringify(q("#msg").value),
        "group": wid
    };
    if (hasTime) {
        let time = new Date(q("#deliverAt").value);
        body.deliverAt = time.toISOString();
    }

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    };

    console.log("Sending message through Bulldog");
    //displayStatus('שליחה מצריכה פתיחת חשבון בולדוג', true);
    //return;
    return fetch(Make.sendOne + "/?type=send", options);
}
/** 
 * Delete queued message and remove from dom list
 * */
async function deleteQueued(e) {
    let groupMsgLocalId = e.target.closest('details').id;
    let queuedMsgs = JSON.parse(localStorage.queuedMsgs);
    let msgIds = queuedMsgs.find(x => x.id == groupMsgLocalId)?.msgIds;
    let removedIds = [];
    displayStatus("ביטול הודעות החל");

    for await (const msgId of msgIds) {
        let body = {
            "msgId": msgId
        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        };
        const response = await fetch(Make.sendOne + "/?type=delete", options);
        let jsonRe = await response.json();
        if (response.status != 200) {
            displayStatus(jsonRe.message, true);
            break;
        }
        else {
            //console.log(jsonRe);
            removedIds.push(msgId);
        }
    }

    if (msgIds.length != removedIds.length) {
        displayStatus(`בוטלו ${removedIds.length}/${msgIds.length} הודעות, נא לנסות שוב`, true);
        msgIds = msgIds.filter(id => !removedIds.includes(id));
    }
    else {
        displayStatus(`בוטלו ${removedIds.length}/${msgIds.length} הודעות`);
        queuedMsgs = queuedMsgs.filter(queued => queued.id != groupMsgLocalId);
    }

    localStorage.queuedMsgs = JSON.stringify(queuedMsgs);
    displayQueued();
}
/** 
 * After send empty msg and close deliverAt
 * */
function resetMsg() {
    q('#msg').value = "";
    if (!q("#sendSelect").classList.contains('hide'))
        showDeliverAt();
    displayQueued();
}
/** 
 * Add one message to local queue list.
 * If this is part of a cluster so add msg id to it
 * */
function addQueuedToList(groupMsgLocalId, groupName, deliverAt, msg, msgId) {
    let queuedMsgs;
    if (localStorage.queuedMsgs == null)
        localStorage.queuedMsgs = JSON.stringify([]);
    queuedMsgs = JSON.parse(localStorage.queuedMsgs);
    //find groupMsgLocalId in queuedMsgs
    let queued = queuedMsgs.find(x => x.id == groupMsgLocalId);
    // if not found create an object in array with all params and empty msgIds array
    if (queued == null) {
        queued = {};
        queued.id = groupMsgLocalId;
        queued.deliverAt = deliverAt;
        queued.msg = msg;
        queued.msgIds = [msgId];
        queued.groupNames = [groupName];
        queuedMsgs.push(queued);
    }
    else {
        queued.msgIds.push(msgId);
        queued.groupNames.push(groupName);
    }
    localStorage.queuedMsgs = JSON.stringify(queuedMsgs);
}

/** 
 * Check if queued messages are storad localy and display them if deliver time has not passed
 * */
function displayQueued() {
    q("#queueList").replaceChildren();
    let queuedMsgs;
    if (localStorage.queuedMsgs != null)
        queuedMsgs = JSON.parse(localStorage.queuedMsgs);
    if (localStorage.queuedMsgs == null || queuedMsgs.length == 0) {
        q("#queueList").insertAdjacentHTML('afterbegin', "<div style='text-align:center;color:gray;'>לא קיימות הודעות מתוזמנות</div>");
        return;
    }

    queuedMsgs.sort((a, b) => a.deliverAt.localeCompare(b.deliverAt)).forEach((queue) => {
        if (new Date(queue.deliverAt).getTime() > new Date().getTime()) {
            let queueItem = document.querySelector("#templates .queuePan details").cloneNode(true);
            queueItem.id = queue.id;

            let reg = /^\*(.+)\*/;
            queueItem.querySelector("quTitle").innerHTML = reg.exec(queue.msg)?.[1] ?? "ללא כותרת";
            queueItem.querySelector("quTime").innerHTML = getTimestamp(new Date(queue.deliverAt));
            queueItem.querySelector("quGroups").innerHTML = "מען: " + queue.groupNames.join(', ');
            queueItem.querySelector("quMsg").innerHTML = queue.msg.replace(/(?:\r\n|\r|\n)/g, "<br>");
            queueItem.querySelector("qucancel").addEventListener("click", deleteQueued);
            q("#queueList").append(queueItem);
        } else {
            //remove item that date passed
            localStorage.queuedMsgs = JSON.stringify(queuedMsgs.filter(item => item.id !== queue.id));
        }
    });
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
    qa(".toggle").forEach((el) => {
        el.classList.toggle('hide');
    });
    q("#showDeliverAt").classList.toggle('insetBtn');
    q(".button.sendImg").classList.toggle('disable');
}
/** 
 * Scheduled send
 * */
function deliverAtSend(val) {
    let sentOk = send(true);
    if (sentOk) {
        if (val == "sendBoth")
            send();
        q("#sendSelect").value = "";//clear select for next time
    }
}

/** 
 * Show\hide datetime picker and send options
 * */
function displayStatus(msg, error) {
    if (error) {
        q("#errorModel .error").innerHTML = msg;
        q("#errorModel").showModal();
    }

    let div = document.createElement('div');
    div.classList.add('statItem');

    let textSpan = document.createElement('span');
    textSpan.append(msg);
    if (error)
        textSpan.classList.add('error');

    let timeSpan = document.createElement('span');
    timeSpan.dir = 'rtl';
    timeSpan.append(getTimestamp());

    div.append(timeSpan);
    div.append(textSpan);
    q("#statusPan #statusList").prepend(div);
}
function getTimestamp(d) {
    const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
    if (typeof d === 'undefined') {
        d = new Date();
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;//13:04:05
    }
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; // 13/04 13:04
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