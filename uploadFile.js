var LinkToFile;
var FilePath;

/** Add indicaton that file is attached*/
q('#uploadFile').addEventListener("change", showFileAttached);

function showFileAttached() {
        q("#attachment").replaceChildren();
    if (q('#uploadFile').files.length > 0) {
        let attachment = document.querySelector("#templates .attachment").cloneNode(true);
        attachment.querySelector('.fileName').innerHTML = q('#uploadFile').files[0].name;
        q("#attachment").append(attachment);
        /** remove indicaton that file is attached*/
        q("#attachment .xBtn").addEventListener('click', () => {
            removeFileAttached();
            showStatus("הקובץ הוסר");
        });
        //check if file is larger than 1MB 
        if (q('#uploadFile').files[0].size > (1024 * 1024)) {
            showStatus("הקובץ גדול מדי לשליחה דרך המערכת", true, "הקובץ חייב להיות קטן מ- 1MB. <br/>ניתן לשלוח את הקובץ לעצמכם, בוואטסאפ רגיל. להוריד אותו, ואז לנסות שוב עם הקובץ שירד. זה מקטין את גודל הקובץ.");
            removeFileAttached();
            showStatus("הקובץ הוסר");
        } else showStatus("צורף קובץ");
    }
}

/** Remove indicaton that file is attached*/
function removeFileAttached() {
    q('#uploadFile').value = "";
    q("#attachment").replaceChildren();
}

/** Start file upload process
 * 1- get new access token with refresh token
 * 2- Upload file to dropbox
 * 3- get temp link
 */
async function startFileUpload() {    
    showStatus("העלאת הקובץ החלה");
    //return await getNewAccessToken();
    try {
        const tokenData = await getNewAccessToken();
        const fileData = await uploadDropbox(tokenData.access_token);
        const linkData = await getTempLink(fileData.path_display, tokenData.access_token);
        LinkToFile = linkData.link;
        FilePath = fileData.path_display;
        return true;
    } catch (e) {
        return false;
    }
}
/** Get access token with refresh token
* Needed every time
*/
async function getNewAccessToken() {
    console.log('getNewAccessToken');

    const url = 'https://api.dropbox.com/oauth2/token';
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: Make.DBrefreshToken,
        client_id: Make.DBclientId,
        client_secret: Make.DBclientSecret
    });

    const response = await fetch(url, {
        method: 'POST',
        body: body
    });
    if (!response.ok) {
        showStatus("שגיאת העלאת קובץ בקבלת טוקן", true);
        console.error('Error refreshing access token:', error);
        throw new Error('Error');
        //return false;
    }
    return await response.json();
    //const data = await response.json();
    //return await uploadDropbox(data.access_token);
}

async function uploadDropbox(token) {
    console.log('uploading');
    const fileInput = q('input[type="file"]').files[0];
    const fileName = `${new Date().getTime()}--${encodeURIComponent(fileInput.name)}`;

    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': 'Bearer ' + token,
            'Dropbox-API-Arg': `{"path":"/groupease/${fileName}"}`
        },
        body: fileInput
    });
    if (!response.ok) {
        showStatus("שגיאה בהעלאת הקובץ לדרופבוקס", true);
        console.error('Error uploading file:', error);
        throw new Error('Error');
        //return false;
    }
    return await response.json();
    //const data = await response.json();
    //return await getTempLink(data.path_display, token);
}
//let re = {
//    "name": "first.jpg",
//    "path_lower": "/whatsapp/first.jpg",
//    "path_display": "/whatsapp/first.jpg",
//    "id": "id:IIoVn",
//    "client_modified": "2023-03-15T10:30:42Z",
//    "server_modified": "2023-03-15T10:30:42Z",
//    "rev": "5f6edd60d68",
//    "size": 45169,
//    "is_downloadable": true,
//    "content_hash": "43f84a3"
//}

/** Get temp link to dropbox based on path
 *  Good for 4 hours
 * https://www.codemzy.com/blog/dropbox-long-lived-access-refresh-token
 */
async function getTempLink(path, token) {
    const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: `${path}` }) // '/groupease/first.jpg'
    });
    if (!response.ok) {
        showStatus("שגיאה בקבלת קישור לקובץ", true);
        console.error('Error getting temp link:', error);
        throw new Error('Error');
        //return false;
    }
    return await response.json();
    //const data = await response.json();
    //LinkToFile = data.link;
    //return true;
}

//let re2 = {
//    "metadata": {
//        "name": "first.jpg",
//        "path_lower": "/whatsapp/first.jpg",
//        "path_display": "/whatsapp/first.jpg",
//        "id": "id:IIoVn",
//        "client_modified": "2023-03-15T10:30:42Z",
//        "server_modified": "2023-03-15T10:30:42Z",
//        "rev": "5f6edd6",
//        "size": 45169,
//        "is_downloadable": true,
//        "content_hash": "43f84a3d43d52d"
//    },
//    "link": "https://ucbe0a6954e22b.dl.dropboxusercontent.com/cd/0/get/B4QdfAWoEPk1R5OE/file"
//}

/**
 * Get img thumbnail from dropbox and append it to target element
 * @param {string} path Path to image at dropbox
 * @param {string} target Target element for image
 */
async function addDropboxThumbnail(path, target) {
    const tokenData = await getNewAccessToken();

    fetch(`https://content.dropboxapi.com/2/files/get_thumbnail`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Dropbox-API-Arg': `{"path": "${path}","format":"jpeg","size":"w256h256"}`,
        },
    })
        .then(response => response.blob()) // Get the response as a blob
        .then(blob => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.alt = 'תמונה שנשלחה עם ההודעה';
            target.innerHTML = "";
            target.append(img);
        })
        .catch(error => console.error(error));

    //fetch('https://api.dropboxapi.com/2/files/get_thumbnail', {
    //    method: 'POST',
    //    headers: {
    //        'Authorization': `Bearer ${tokenData.access_token}`,
    //        'Content-Type': 'application/json'
    //    },
    //    body: JSON.stringify({
    //        path: path,
    //        size: 'w64h64'
    //    })
    //})
    //    .then(response => response.blob())
    //    .then(blob => {
    //        // Use the image thumbnail blob as needed
    //        const img = document.createElement('img');
    //        img.src = URL.createObjectURL(blob);
    //        document.body.appendChild(img); // Add the image to the page
    //    }).catch(error => console.error(error));
}

// FIRST TIME SET UP
//first get auth code with this url:
//https://www.dropbox.com/oauth2/authorize?client_id=<APP_KEY>&token_access_type=offline&response_type=code
//Now get refresh token here (only needed once)
function getRefreshToken() {
    console.log('getRefreshToken');
    let keyAndSecret = `${Make.DBclientId}:${Make.DBclientSecret}`;
    var myHeaders = new Headers({
        "Authorization": `Basic ${btoa(keyAndSecret)}`,
        //"Authorization": `Basic ${base64.encode("<APP_KEY>:<APP_SECRET>")}`,
        "Content-Type": "application/x-www-form-urlencoded"
    });

    var urlencoded = new URLSearchParams({
        //get code from link above function
        "code": "",
        "grant_type": "authorization_code"
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    };

    fetch("https://api.dropboxapi.com/oauth2/token", requestOptions)
        .then(response => console.log("refresh_token", response.json().refresh_token))
        .then(response => {
            console.log(response.json());
            //get from re in dev tools
            //take refresh_token and use to get access_token with getNewAccessToken()
            //when access_token is expired
            //let re42 = { "access_token": "123abc", "token_type": "bearer", "expires_in": 14400, "refresh_token": "abc123", "scope": "xxx", "uid": "809", "account_id": "pqL8EVWJxY0" };
        })
        .catch(error => console.log('error', error));
}

// delete
// check if can delete right away so dropbox does not get full
//probably no need, how will we full 2GB just with some images
//POST / 2 / files / delete_v2
//Host: https://api.dropboxapi.com
//User - Agent: api - explorer - client
//Authorization: Bearer sl.grq1ssy
//Content - Type: application / json

//{
//    "path": "/whatsapp/first.jpg"
//}

//let re3 =

//{
//    "metadata": {
//        ".tag": "file",
//        "name": "first.jpg",
//        "path_lower": "/whatsapp/first.jpg",
//        "path_display": "/whatsapp/first.jpg",
//        "id": "id:IIoVn2",
//        "client_modified": "2023-03-15T10:30:42Z",
//        "server_modified": "2023-03-15T10:30:42Z",
//        "rev": "5f6edd60d",
//        "size": 45169,
//        "is_downloadable": true,
//        "content_hash": "43f84a3d43d52d01e"
//    }
//}
