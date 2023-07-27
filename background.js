// create menu
chrome.contextMenus.create({
    id: "copyText",
    title: "🔒︎ copy text",
    contexts: ["selection"],
});


  
// Listener for right click menu and send message to content.js
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId == "copyText") {
        navigator.permissions.query({ name: "clipboard-write" }).then((permission) => {
            if (permission.state === "denied") {
                throw new Error("Not allowed to write to clipboard.");
            }

            const clipText = info.selectionText;
            console.log(clipText);
            
            // send message and url to content.js
            chrome.tabs.sendMessage(tab.id, {
                todo: "copyToClipboard",
                text: clipText,
                url: tab.url
            });
        }).catch((error) => {
            console.error(error);
        });
    }
});
