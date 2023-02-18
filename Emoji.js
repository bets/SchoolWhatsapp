var EmojiGroups = [
    {
        title: "Smileys",
        emojiStr: "😃 😄 😁 😆 😅 😂 🤣 🥲 🥹 😊 😇 🙂 🙃 😉 😍 🥰 😘 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😔 😕 🙁 😣 😩 🥺 😢 😭 😮‍ 😤 😠 😡 🤯 😳 🥵 🥶 😥 😓 🫣 🤗 🫡 🤔 🫢 🤭 🤫 😶 😐 😬 🫠 🙄 😦 😮 😲 🥱 😴 😪 😵 🫥 🤐 🤢 🤮 🤧 😷 🤒 🤕 🤠 😈 👹 🤡 👶 👦 👩 🧑 👨 🧔‍ 👵 🧓 👴 ❤️‍ 💑 🫂"
    },
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
        emojiStr: "🌂 ☂️ 🧵 🪡 👓 🕶 🥼 👕 👖 🧣 🧤 🧦 👗 👘 🥻 🩴 🩱 🩲 🩳 👚 🎒 👞 👟 🥾 🥿 👡 🩰 👢 👑 👒 🎩 💄 💍 🎨 🚀"
    }
];


function emojiModel() {
    q("#emojiModel").showModal();
    if (qa("#emojiModel div").length > 1)
        return;
    EmojiGroups.forEach((eGroup) => {
        let divTitle = document.createElement('div');
        let divText = document.createTextNode(eGroup.title);
        divTitle.appendChild(divText);
        q("#emojiModel grid").append(divTitle);
        [...eGroup.emojiStr].filter((str) => str != " ").forEach((emoji, i) => {
            let spanEmoji = document.createElement('span');
            let spanText = document.createTextNode(emoji);
            spanEmoji.appendChild(spanText);
            q("#emojiModel grid").append(spanEmoji);
        });
    });

    qa("#emojiModel span").forEach((el) => {
        el.addEventListener("click", (e) => {
            //console.log(emoji);
            q("#msg").value += e.target.innerText;
            q("#emojiModel").close();

        })
    });
}


