var EmojiGroups = [
    {
        title: "Smileys",
        emojiStr: "😃 😄 😁 😆 😅 😂 🤣 🥲 🥹 😊 😇 🙂 🙃 😉 😍 🥰 😘 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😔 😕 🙁 😣 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶 😥 😓 🫣 🤗 🫡 🤔 🫢 🤭 🤫 😶 😐 😬 🫠 🙄 😦 😮 😲 🥱 😴 😪 😵 🫥 🤐 🤢 🤮 🤧 😷 🤒 🤕 🤠 😈 👹 🤡 👶 👦 👩 🧑 👨 👵 🧓 👴 💑 🫂 💖 💙 💜 ❤️"
    },
    //
    {
        title: "Gestures and Body Parts",
        emojiStr: "👋 🖐 ✋ 👌 🤌 🤞 🫰 🤟 🤘 🤙 🫵 🫳 🫴 👈 👉 👆 👇 👍 👎 👊 🤛 👏 🫶 🤲 🤝 🙏 ✍ 💅 💪 🦶 👣 👂 🦷 👀 👅 👄 🫦 💋 🩸"
    },
    //{
    //    title: "People and Fantasy",
    //    emojiStr: ""
    //},
    {
        title: "Clothing and Accessories",
        emojiStr: "🌂 🧵 🪡 👓 🕶 🥼 👕 👖 🧣 🧤 🧦 👗 👘 🥻 🩴 🩱 🩲 🩳 👚 🎒 👞 👟 🥾 🥿 👡 🩰 👢 👑 👒 🎩 💄 💍 🎨 🚀 🎉"
    }
];

/** 
 * Open emoji model
 * */
function emojiModel() {
    q("#emojiModel").showModal();
    //if already created emoji list so stop here
    if (qa("#emojiModel div").length > 1)
        return;
    EmojiGroups.forEach((eGroup) => {
        let divTitle = document.createElement('div');
        let divText = document.createTextNode(eGroup.title);
        divTitle.appendChild(divText);
        q("#emojiModel").append(divTitle);
        let grid = document.createElement('grid');
        [...eGroup.emojiStr].filter((str) => str != " ").forEach((emoji, i) => {
            let spanEmoji = document.createElement('span');
            let spanText = document.createTextNode(emoji);
            spanEmoji.appendChild(spanText);
            grid.append(spanEmoji);
        });
        q("#emojiModel").append(grid);
    });

    qa("#emojiModel span").forEach((el) => {
        el.addEventListener("click", (e) => {
            strEdit(e.target.innerText, true);
            q("#emojiModel").close();
            q('#msg').focus();
        })
    });
}


