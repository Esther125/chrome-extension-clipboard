// get command from contextMenus (background.js)
// save copied content and sourceUrl to clipboard
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.todo === "copyToClipboard") {
        const clipText = message.text;
        const sourceUrl = message.url;
        const combinedText = `${clipText}\n${sourceUrl}`;
        
        copyToClipboard(combinedText)      
            .then(() => {
                console.log("Text copied to clipboard:", clipText);
            })
            .catch((error) => {
                console.error("Error copying to clipboard:", error);
            });
    }
});


// double click certain element (activeElement) to paste
// read content from clipboard and paste it to activeElement
document.addEventListener("dblclick", function () {
    readFromClipboard()
        .then((copiedText) => {
            var result = splitCombinedText(copiedText);
            pasteToPage(result.clipText,result.sourceUrl);
        })
        .catch((error) => {
            console.error("Error reading from clipboard:", error);
        });
});


// copy content to clipboard
function copyToClipboard(textToCopy) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(textToCopy);
    } else {
        
        // create temporary textarea
        let textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        textArea.style.position = "absolute";
        textArea.style.opacity = 0;
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        return new Promise((res, rej) => {
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}
  
// read content from clipboard
function readFromClipboard() {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.readText();
    } else {
        // create temporatory textarea to read text
        let textArea = document.createElement("textarea");
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();

        return new Promise((resolve, reject) => {
            try {
                document.execCommand('paste') ? resolve(textArea.value) : reject(new Error("Paste command failed."));
            } catch (error) {
                reject(error);
            } finally {
                textArea.remove();
            }
        });
    }
}

// split the content in clipboard into text and url
function splitCombinedText(combinedText) {
    const separatorIndex = combinedText.indexOf("\n");
    if (separatorIndex !== -1) {

      const clipText = combinedText.slice(0, separatorIndex);
      const sourceUrl = combinedText.slice(separatorIndex + 1);

      return { clipText, sourceUrl };

    } else {
      return { clipText: combinedText, sourceUrl: "" };
    }
}


// paste content and qrcode function
function pasteToPage(text, url) {
    const activeElement = document.activeElement;

    // Create a container 
    const containerDiv = document.createElement('div');
    containerDiv.style = `  background: #000;
                            border: 2px solid #4DFFFF;
                            border-radius: 10px;
                            padding: 20px;
                            color: #FFF;
                            font-family: Arial, sans-serif; `;

    // Create a button
    const sourceLink = document.createElement('a');
    sourceLink.href = url;
    sourceLink.target = "_blank";
    sourceLink.style = `    display:inline-block;
                            margin-top:10px; 
                            padding:10px 20px;
                            background: linear-gradient(to right, #4DFFFF 40%, #FFFFFF 60%); 
                            color:black; 
                            text-decoration:none; 
                            border: 2px solid #4DFFFF; 
                            border-radius: 4px; 
                            font-weight:bold; 
                            text-transform:uppercase; 
                            transition: background 0.5s, color 0.5s; 
                            font-family: Arial, sans-serif;" `;

    sourceLink.textContent = 'See Reference';

    containerDiv.appendChild(sourceLink); 

    // Generate the copied content
    const contentElement = document.createElement('p');
    contentElement.style = "color: #FFF; font-family: Arial, sans-serif;";
    contentElement.innerText = "🔒 E2EE Chrome Extension 🔒"+"\n"+text;

    containerDiv.insertBefore(contentElement, sourceLink); 

    // Append the container 
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        activeElement.value = '';
        activeElement.parentNode.appendChild(containerDiv); 
    } else {
        activeElement.contentEditable = "true";
        activeElement.innerText = '';
        activeElement.appendChild(containerDiv); 
    }

    // Generate source QR code
    const qrcodeDiv = document.createElement('div');
    qrcodeDiv.id = 'qrcode';
    qrcodeDiv.style.transform = 'scale(0.3)';
    qrcodeDiv.style.position = 'absolute';
    qrcodeDiv.style.top = '90%';
    qrcodeDiv.style.left = '50%';
    qrcodeDiv.style.transform = 'translate(-50%, -50%)';

    activeElement.appendChild(qrcodeDiv);

    // send image DataUrl to imgbb API
    // get the qrcode link from API response
    setTimeout(function () {
        jQuery(qrcodeDiv).qrcode(url);
        console.log("生成qrcode的url:"+url);
    
        // Convert QR code to image
        const qrCanvas = qrcodeDiv.querySelector('canvas');
        const qrImage = new Image();
        qrImage.width = 150;
        qrImage.height = 150;
    
        qrcodeDiv.innerHTML = ''; 
        
        const dataURL = qrCanvas.toDataURL("image/png");
        var base64Image = dataURL.replace("data:image/png;base64,", "");
    
        getImgUrl(base64Image)
          .then(function (imageUrl){  
            qrImage.src = "";
            qrImage.src = imageUrl;
            qrcodeDiv.appendChild(qrImage);
          })
          .catch(function (error) {
            console.error('Error:', error);
          });
    
    }, 100);
    
}

// Get the image's url from imgbb API
function getImgUrl(dataURL) {
    return axios({
        method: 'post',
        // key = (Your imgbb API key)
        url: 'https://api.imgbb.com/1/upload?expiration=600&key=8cab57463ac70fa7362dfbd540bb04f2',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: `image=${encodeURIComponent(dataURL)}`
    })
        .then(function (response) {
            if(response.status == 200){  
                // console.log(response);
                var imageUrl = response.data.data.display_url; 
                return imageUrl; 
            }
        })
        .catch(function (error) {
            console.error(error);
        });
}
