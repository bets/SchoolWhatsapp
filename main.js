start();
async function start() {
    if (localStorage.school == null)
        await getSchool();
    let school = JSON.parse(localStorage.school);
    createSchool(school);
    setSelectEvents();
}
/** 
 * When school is saved but groups chaged, clear storage and fetch groups
 * */
function refetchSchool() {
    localStorage.removeItem('school');
    location.reload();
}
/** 
 * Get class groups from bulldog whatsapp through Make
 * */
async function getSchool() {
    console.log("Fetching school groups from Bulldog");
    const response = await fetch('https://hook.eu1.make.com/atmfm8irkgay5awury124275zcrgcidb')
        .catch(err => console.error(err));
    let groups = await response.json();
    //.then(response => response.json())
    //    .then(response => console.table(response))
    //    .catch(err => console.error(err));

    //console.table(groups);

    var cls = groups
        .reduce((accu, curr) => {
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

    //console.table(cls);

    let school = cls.reduce((accu, curr, i) => {
        var grp = {
            num: curr.num,
            wid: curr.wid
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
            labelClone.innerHTML += shichva.grade + cls.num;
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
    let boxes = document.querySelectorAll("input");
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


function sendHello() {

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Token: 'ca686733b8fdbd9e848377d9b4bf0c722276e8b73102c54b5d64adb276e44f3e1e601e7034e1a311'
        },
        body: '{"group":"120363030110816193@g.us","message":"Sample group message"}'
    };

    fetch('https://api.bulldog-wp.co.il/v1/messages', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
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