let school = [
    { letter: "א", classes: 3 },
    { letter: "ב", classes: 2 },
    { letter: "ג", classes: 3 },
    { letter: "ד", classes: 2 },
    { letter: "ה", classes: 4 }
];

school.forEach((grade) => {
    let gradeTemplate = document.querySelector("#template details").cloneNode(true);
    let labelTemplate = document.querySelector("#template label").cloneNode(true);
    gradeTemplate.querySelector("summary input").id = grade.letter;
    gradeTemplate.querySelector("summary").innerHTML += "כיתות " + grade.letter + "'";
    for (let i = 1; i < grade.classes + 1; i++) {
        let labelClone = labelTemplate.cloneNode(true);
        labelClone.innerHTML += grade.letter.toUpperCase() + i;
        labelClone.querySelector("input").id = grade.letter + i;
        gradeTemplate.append(labelClone);
    }
    document.querySelector("#allGrades").append(gradeTemplate);
});
document.querySelector("#template").remove();

var boxes = document.querySelectorAll("input");
boxes.forEach((el) => {
    el.addEventListener("click", (e) => {
        // console.log("click " + e.target.className);
        let grade =
            e.target.id != "all"
                ? e.target.closest("details").querySelector(".grade").id
                : "all";
        // If marking all classes in grade
        if (e.target.classList.contains("grade")) {
            let classesNum = e.target.closest("details").querySelectorAll("input").length;
            for (let i = 1; i < classesNum; i++)
                document.querySelector("#" + grade + i).checked =
                    e.target.checked;
            //If marking all school
        } else if (e.target.id == "all") {
            boxes.forEach((el) => {
                el.indeterminate = false;
                el.checked = e.target.checked;
            });
        }
        checkParents(grade);
    });
});

/* Update grade if a class was marked or  All School if it was marked*/
function checkParents(s) {
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

    if (s != "all") checkParents("all");
    return;
}


function getGroups() {
    const options =
    {
        method: 'GET',
        headers:
        {
            'Content-Type': 'application/json',
            Token: 'ca686733b8fdbd9e848377d9b4bf0c722276e8b73102c54b5d64adb276e44f3e1e601e7034e1a311'
        }
    };

    fetch('https://api.bulldog-wp.co.il/v1/devices/63e7c1011e82ba57205a670a/groups', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}

// IMPORTANT NOTICE:
// Performing HTTPS requests to the API from a JavaScript in a web browser is
// forbidden by default due to cross-origin security policies (CORS).
// More information here: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
//