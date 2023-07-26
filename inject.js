
// get message from background.js
// save copied content and sourceUrl to clipboard
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.todo === "copyToClipboard") {
        const clipText = message.text;
        const sourceUrl = message.url;
        const combinedText = `${clipText}\n${sourceUrl}`;
        
        copyToClipboard(combinedText)      
            .then(() => {
                console.log("Text copied to clipboard:", clipText);
                console.log(message.url);

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

            // console.log("Result object:", result);
            console.log("clipText:", result.clipText);
            console.log("sourceUrl:", result.sourceUrl);

            pasteToPage(result.clipText,result.sourceUrl);
            console.log("輸入的Url"+result.sourceUrl);
        })
        .catch((error) => {
            console.error("Error reading from clipboard:", error);
        });
});


// copy content to clipboard
function copyToClipboard(textToCopy) {
// navigator clipboard 需要https等安全上下文
    if (navigator.clipboard && window.isSecureContext) {
        // write content into navigator clipboard 
        return navigator.clipboard.writeText(textToCopy);
    } else {
        
        // create temporary textarea
        let textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // make textarea invisible
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
    // navigator clipboard 需要https等安全上下文
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



function pasteToPage(text, url) {
    console.log("最早傳入的url"+url);
    const activeElement = document.activeElement;


    // Create a container for the content and the link
    const containerDiv = document.createElement('div');
    containerDiv.style = "background: #000; border: 2px solid #4DFFFF; border-radius: 10px; padding: 20px; color: #FFF; font-family: Arial, sans-serif;";

    // Generate link styled as a button
    const sourceLink = document.createElement('a');
    sourceLink.href = url;
    sourceLink.target = "_blank";
    sourceLink.style = "display:inline-block; margin-top:10px; padding:10px 20px;  background: linear-gradient(to right, #4DFFFF 40%, #FFFFFF 60%); color:black; text-decoration:none; border: 2px solid #4DFFFF; border-radius: 4px; font-weight:bold; text-transform:uppercase; transition: background 0.5s, color 0.5s; font-family: Arial, sans-serif;";
    sourceLink.textContent = 'See Reference';
    containerDiv.appendChild(sourceLink); // Append the link to the container

    // Generate the copied content
    const contentElement = document.createElement('p');
    contentElement.style = "color: #FFF; font-family: Arial, sans-serif;";
    contentElement.innerText = text;
    containerDiv.insertBefore(contentElement, sourceLink); // Append the content to the container

    // Append the container div
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        activeElement.value = '';
        activeElement.parentNode.appendChild(containerDiv); 
    } else {
        activeElement.contentEditable = "true";
        activeElement.innerText = '';
        activeElement.appendChild(containerDiv); 
    }



    // Generate QR code
    const qrcodeDiv = document.createElement('div');
    qrcodeDiv.id = 'qrcode';
    qrcodeDiv.style.transform = 'scale(0.3)';
    qrcodeDiv.style.position = 'absolute';
    qrcodeDiv.style.top = '90%';
    qrcodeDiv.style.left = '50%';
    qrcodeDiv.style.transform = 'translate(-50%, -50%)'; // Center the qrcodeDiv

    // Append the containerDiv to the activeElement's parent
    activeElement.appendChild(qrcodeDiv);


    setTimeout(function () {
        jQuery(qrcodeDiv).qrcode(url);
        console.log("生成qrcode的url:"+url);
    
        // Convert QR code to image
        const qrCanvas = qrcodeDiv.querySelector('canvas');
        const qrImage = new Image();

        qrImage.width = 150;
        qrImage.height = 150;
    
        // Append QR image to the qrcodeDiv
        qrcodeDiv.innerHTML = ''; // Remove the canvas element
        
    
        // Convert image to Data URL
        const dataURL = qrCanvas.toDataURL("image/png");
        var base64Image = dataURL.replace("data:image/png;base64,", "");
    
        getImgUrl(base64Image)
          .then(function (imageUrl){  // 將 'response' 改為 'imageUrl'
            console.log("成功拿到url:", imageUrl); // 这里可以看到 imageURL 的值
            qrImage.src = "";
            qrImage.src = imageUrl;
            qrcodeDiv.appendChild(qrImage);
            console.log("qrImage src"+qrImage.src);

            // sourceLink.href = "";
            // sourceLink.href = url;
          })
    
          .catch(function (error) {
            console.error('Error:', error);
          });
    
    }, 100);
    
}


function getImgUrl(dataURL) {
    // 將 axios 呼叫的結果直接返回
    return axios({
        method: 'post',
        url: 'https://api.imgbb.com/1/upload?expiration=600&key=8cab57463ac70fa7362dfbd540bb04f2',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: `image=${encodeURIComponent(dataURL)}`
    })
        .then(function (response) {
            console.log(response);
            if(response.status == 200){  // 注意，這裡應該是200，而不是"200"，因為 status 是數字，而不是字符串
                console.log(response);
                console.log(response.data.data.display_url);
                var imageUrl = response.data.data.display_url; // 將 imageUrl 定義為一個局部變數
                return imageUrl; // 直接從 Promise 的解析值中返回 imageUrl
            }
        })
        .catch(function (error) {
            console.error(error);
        });
}
