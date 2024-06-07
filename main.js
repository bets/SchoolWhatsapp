//start();
var Version = '2024-06-07--1043';
var Make;
window.onload = function start() {
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

    await checkVersion();
    if (localStorage.groups == null)
        await getWAGroups();
    createSchool();
    createGroups();
    setSelectEvents();
    showQueued();
    showFileAttached();
    closeModels();
    openingNote();
}
async function checkVersion() {
    let storedVersion = localStorage.version;
    if (storedVersion == null)
        await getWAGroups();
    if (storedVersion != Version) {
        showStatus("עודכנה גירסה חדשה: " + Version);
        localStorage.openNoteDisplayed = null;
        localStorage.version = Version;
    }
}

function openingNote() {
    let openNoteDisplayed = localStorage.openNoteDisplayed;
    if (openNoteDisplayed != null && openNoteDisplayed == '2')
        return;
    let note = `<b>עדכון גירסה - 7-6-24</b><br />
    קבוצות - מחזור ד, הודעות צוות.<br />
    להוספת הקבוצות נא להכנס לגלגל השיניים מימין למעלה, ואז ללחוץ על הכפתור משמאל ל "רענון קבוצות".<br />
   `;
    noteModel(note, 'שימו לב!');
    localStorage.openNoteDisplayed = openNoteDisplayed == null ? '1' : '2';
}

/** 
 * Sign off by removing basics
 * */
function signOff() {
    showStatus("יציאת משתמש");
    localStorage.removeItem('basics');
    location.reload();
}
/** 
 * When school is saved but groups chaged, clear storage and fetch groups
 * */
function refetchGroups() {
    localStorage.removeItem('school');
    localStorage.removeItem('groups');
    location.reload();
}
/** 
 * Get class groups from bulldog whatsapp through Make
 * */
async function getWAGroups() {
    //displayStatus('משיכת קבוצות מצריכה פתיחת חשבון בולדוג', true);
    //return;

    showStatus("משיכת קבוצות מהנייד החלה");
    const response = await fetch(Make.getSchool + "/?type=groups");

    if (response.status != 200) {
        showStatus(response, true);
        showStatus("שגיאה בקבלת הקבוצות מבולדוג", true);
        return false;
    }
    let allGroups = await response.json();
    //console.table(groups);

    let nonClassGroups = [
        'הסעה לבית אלישבע',
        'זקס מידע למתעניינים',
        'יונתן זקס - הודעות',
        'יונתן זקס הורי מחזור ד'
    ];

    var groups = allGroups.reduce((accu, curr, i) => {
        const queryString = new URLSearchParams(window.location.search);
        if (queryString.has('test')) {
            if (!curr.name.includes('טסט')) return accu;
        } else {
            if (curr.name.includes('טסט')) return accu;
        }


        //added support for ׳ [\u05F3] גרש:
        let m = curr.name.match(/(?:[\u05D0-\u05EA]")?[\u05D0-\u05EA]{1,2}'?[\u05F3]?\s?(\d)/);
        if (m != null) {
            let letter = m[0].replace(/[^\u05D0-\u05EA]/g, '');//remove all but letters

            accu.push({
                id: "g" + i,
                type: "class",
                name: letter + m[1],
                letter: letter,
                num: m[1],
                wid: curr.wid
            });
        } else if (nonClassGroups.some(name => curr.name.includes(name))) {
            accu.push({
                id: "g" + i,
                type: "group",
                name: curr.name,
                wid: curr.wid
            });
        }
        return accu;
    }, []);

    localStorage.groups = JSON.stringify(groups);
    //console.table(cls);

    let school = groups.filter((g) => g.type == "class")
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((accu, curr, i) => {
            var grp = {
                num: curr.num,
                id: curr.id
            };
            if (i == 0 || curr.letter != accu[accu.length - 1].grade) {
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
    showStatus("הקבוצות התקבלו בהצלחה");
}

/** 
 * Create class selector UI
 * */
function createSchool() {
    let school = JSON.parse(localStorage.school);
    [...school].forEach((shichva) => {
        let gradeTemplate = document.querySelector("#templates .groupSelector details").cloneNode(true);
        let labelTemplate = document.querySelector("#templates .groupSelector label").cloneNode(true);
        gradeTemplate.querySelector("summary input").id = shichva.grade;
        gradeTemplate.querySelector("summary").innerHTML += "שכבת " + shichva.grade + "'";
        shichva.groups.forEach((cls) => {
            let labelClone = labelTemplate.cloneNode(true);
            labelClone.innerHTML += `${shichva.grade}' <sub>${cls.num}</sub>`;
            labelClone.querySelector("input").id = cls.id;
            labelClone.querySelector("input").classList.add('group');
            gradeTemplate.append(labelClone);
        });
        document.querySelector("#allGrades").append(gradeTemplate);
    });
}

/** 
 * Create group selector UI
 * */
function createGroups() {
    let groups = JSON.parse(localStorage.groups);
    [...groups].filter((g) => g.type == "group").forEach((group) => {
        let groupEl = document.querySelector("#templates .otherGroupSelector").cloneNode(true);
        groupEl.querySelector("label").appendChild(document.createTextNode(group.name));
        groupEl.querySelector("input").id = group.id;
        groupEl.querySelector("input").classList.add('group');
        q('#groups').append(groupEl);
    });
}

/** 
 * Attach events to class selector UI
 * */
function setSelectEvents() {
    let boxes = document.querySelectorAll("#groupSelector #allGrades input");
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
                });
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
function checkParents(grade, boxes) {
    let boxes2check = grade == "all"
        ? [...boxes].filter((box) => box.id != grade)// all boxes but #all
        : [...q(`#${grade}`).closest("details").querySelectorAll(".group")];//only grade classes
    // console.log(boxes2check);
    let checkedCount = boxes2check.filter((box) => box.checked).length;
    // console.log(`${s} - ${checkedCount}/${boxes2check.length}`);

    document.querySelector("#" + grade).indeterminate = false;
    switch (checkedCount) {
        case boxes2check.length:
            document.querySelector("#" + grade).checked = true;
            break;
        case 0:
            document.querySelector("#" + grade).checked = false;
            break;
        default:
            document.querySelector("#" + grade).indeterminate = true;
    }

    if (grade != "all") checkParents("all", boxes);
    return;
}

/**
 * Start send porcess
 * @param {bool} hasTime True if is scheduled message
 * @returns {bool} True if send is success
 */
async function startSend(hasTime) {
    if (q('.sendImg').classList.contains('sending')) {
        alert("לחיצה אחת מספיקה.\n נא להסתכל על שורת העדכונים מתחת לכפתור השליחה.")
        return;
    }
    q('.sendImg').classList.add('sending');

    if (q("#msg").value.length < 4) {
        showStatus("נא להוסיף תוכן להודעה", true);
        return sendEnd(false);
    }
    if (hasTime) {
        let inputDate = new Date(q("#deliverAt").value);
        let timestamp = Date.parse(inputDate);
        if (isNaN(timestamp) == true) {
            showStatus("נא להוסיף זמן לתזמון", true);
            return sendEnd(false);
        }
        let currentDate = new Date();
        if (inputDate.getTime() < currentDate.getTime() + 5 * 60000) {
            showStatus("תזמון חייב להיות לפחות 5 דקות מעכשיו", true);
            return sendEnd(false);
        }
    }

    let checkedIds = [...qa("#groupSelector input:checked.group")].map(x => x.id);
    if (checkedIds.length == 0) {
        showStatus("נא לבחור קבוצה", true);
        return sendEnd(false);
    }
    let hasFile = false;
    if (q('#uploadFile').files.length > 0) {
        hasFile = true;
        if (!await startFileUpload())
            return sendEnd(false);
    }
    return sendEnd(await send(hasTime, hasFile, checkedIds));
}
/**
 * Reanble send buttton
 * @param {any} bool
 * @param {any} rtn
 * @returns
 */
function sendEnd(rtn) {
    q('.sendImg').classList.remove('sending');
    return rtn;
}
/** 
 * Get all checked ids and send to each group
 * */
async function send(hasTime, hasFile, checkedIds) {
    showStatus("קליטת הודעות מתבצעת");
    let groupMsgLocalId = new Date().getTime();
    let groups = JSON.parse(localStorage.groups);
    let sentNum = 0;
    let groupIdsSent = [];
    //let MakeOperation;
    for await (const groupId of checkedIds) {
        let group = groups.find(x => x.id == groupId);
        const response = await sendOne(group.wid, hasTime, hasFile);
        //console.log(`sent for ${group.name}`);
        await sleep(2000);
        let jsonRe = await response.json();
        //console.log("Make opirations left: ", jsonRe.media.filename);
        //MakeOperation = jsonRe.media.filename
        if (response.status != 200) {
            showStatus(jsonRe.message, true);
            break;
        }
        else {
            sentNum++;
            groupIdsSent.push(group.name);
            if (hasTime) addQueuedToList(groupMsgLocalId, group.name, q("#deliverAt").value, jsonRe.id, hasFile);//jsonRe.message, 
        }
    }

    if (sentNum != checkedIds.length) {
        showStatus(`נקלטו ${sentNum}/${checkedIds.length} הודעות, נא לנסות שוב`, true);
        return false;
    }
    showStatus(`נקלט עבור ${groupIdsSent}`);
    showStatus(`${sentNum}/${checkedIds.length} הודעות נקלטו לשליחה`);

    //displayStatus(`${sentNum}/${checkedIds.length} הודעות נקלטו לשליחה | הודעות במלאי: ${}`);
    if (!hasTime && sentNum > 0)//when sending also now, only reset at end of both
        resetMsg();
    return true;
}
/** 
 * Send one group message
 * */
function sendOne(wid, hasTime, hasFile) {
    let body = {
        "message": JSON.stringify(q("#msg").value),
        //"message": q("#msg").value,
        "group": wid
    };
    //console.log(body.message);
    if (hasTime) {
        let time = new Date(q("#deliverAt").value);
        body.deliverAt = time.toISOString();
    }
    if (hasFile)
        body.fileLink = LinkToFile;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    };

    //console.log("Sending message through Bulldog");
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
    showStatus("ביטול הודעות החל");

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
            showStatus(jsonRe.message, true);
            break;
        }
        else {
            //console.log(jsonRe);
            removedIds.push(msgId);
        }
    }

    if (msgIds.length != removedIds.length) {
        showStatus(`בוטלו ${removedIds.length}/${msgIds.length} הודעות, נא לנסות שוב`, true);
        msgIds = msgIds.filter(id => !removedIds.includes(id));
    }
    else {
        showStatus(`בוטלו ${removedIds.length}/${msgIds.length} הודעות`);
        queuedMsgs = queuedMsgs.filter(queued => queued.id != groupMsgLocalId);
    }

    localStorage.queuedMsgs = JSON.stringify(queuedMsgs);
    showQueued();
}
/** 
 * After send empty msg and close deliverAt
 * */
function resetMsg() {
    console.log('reset stat');
    q('#msg').value = "";
    if (!q("#sendSelect").classList.contains('hide'))
        showDeliverAt();
    showQueued();

    let boxes = document.querySelectorAll("#groupSelector input");
    boxes.forEach((el) => {
        el.indeterminate = false;
        el.checked = false;
    });

    q("#uploadFile").value = null;
    showFileAttached();
}
/** 
 * Add one message to local queue list.
 * If this is part of a cluster so add msg id to it
 * */
function addQueuedToList(groupMsgLocalId, groupName, deliverAt, msgId, hasFile) {
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
        queued.msg = q("#msg").value;
        queued.msgIds = [msgId];
        queued.groupNames = [groupName];
        queuedMsgs.push(queued);
        queued.filePath = hasFile ? FilePath : "";
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
function showQueued() {
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
            if (checkIfImage(queue.filePath)) {
                queueItem.querySelector("quImg").innerHTML = '&nbsp;&nbsp;&nbsp;תמונה בטעינה...';
                queueItem.addEventListener("toggle", async () => {
                    if (queueItem.querySelector('img') == null)
                        await addDropboxThumbnail(queue.filePath, queueItem.querySelector("quImg"));
                });
            } else if (queue.filePath != "")
                queueItem.querySelector("quImg").insertAdjacentHTML('afterbegin', `<span class="attachImg"></span><span>${decodeURIComponent(queue.filePath.split("--")[1])}</span>`);

            q("#queueList").append(queueItem);
        } else {
            //remove item that date passed
            localStorage.queuedMsgs = JSON.stringify(queuedMsgs.filter(item => item.id !== queue.id));
        }
    });
}
/**
 * Check if file name (or path) has an image extention
 * @param {string} fileName File path or name
 * @returns {bool}
 */
function checkIfImage(fileName) {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif', 'ppm', 'bmp'];
    const fileExtension = fileName.split('.').pop();
    return validExtensions.includes(fileExtension.toLowerCase());
}

/** Keyboard shortcut for bold or italic */
q('#msg').addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.code === 'KeyB') {
        event.preventDefault();
        strEdit('*');
    } else if (event.ctrlKey && event.keyCode === 73) {
        event.preventDefault();
        strEdit('_');
    }
});

/** 
 * Add bold or italic char to selected text
 * */
function strEdit(char, isEmoji) {
    let textarea = q("#msg");
    let textAr = [...textarea.value];

    textAr.splice(selectionStart, 0, char);
    if (!isEmoji)
        textAr.splice(selectionEnd, 0, char);

    // console.log(textAr.join(''));
    textarea.value = textAr.join("");
    textarea.focus();
    //set curser position
    let position = selectionEnd + (textarea.value.substring(0, selectionEnd).match(regexExp) || []).length;
    if (textarea.value[position] == '*' && textarea.value[position - 1] != '*') position++;//after word
    if (isEmoji) position = position + 2;//after emoji

    textarea.selectionEnd = position;
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

    //When white space at end go one back
    if (q('#msg').value[selectionEnd - 2] == ' ')
        selectionEnd -= 1;

    //fix position when emoji exist (it addes a fake char to position)
    // Count number of emoji by matching with regular expression
    selectionStart -= (q('#msg').value.substring(0, selectionStart).match(regexExp) || []).length;
    selectionEnd -= (q('#msg').value.substring(0, selectionEnd).match(regexExp) || []).length;

    //console.log(selectionStart);
    //console.log(selectionEnd);
    //console.log(`'${q('#msg').value[selectionEnd]}'`);
    //if (q('#msg').value[selectionEnd-2]==' '){
    //    console.log(`'${q('#msg').value[selectionEnd-2]}'`);
    //}
    //console.log("---");
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
async function deliverAtSend(val) {
    let sentOk = await new Promise((resolve) => {
        resolve(startSend(true));
    });
    if (sentOk) {
        if (val == "sendBoth")
            sentOk = await new Promise((resolve) => {
                resolve(startSend());
            });
        if (sentOk)
            resetMsg();
    }
    q("#sendSelect").value = "";//removes text on Scheduled send button that shows after click
}

/**
 * Show user a status message in status bar
 * @param {string} msg Message to display
 * @param {bool} error True if error
 */
function showStatus(msg, error) {
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
/**
 * Get date string of now (13/04 13:04) or of specified date and just get time (13:04:05)
 * @param {Date} d Optional date will result with 13/04 13:04
 * @returns {string}
 */
function getTimestamp(d) {
    const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
    if (typeof d === 'undefined') {
        d = new Date();
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;//13:04:05
    }
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; // 13/04 13:04
}

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

function q(selector) {
    return document.querySelector(selector);
}
function qa(selector) {
    return document.querySelectorAll(selector);
}