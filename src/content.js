/*
    content.js - the content script which is run in the context of web pages, and has access to the DOM and other web APIs.
*/
(async () => {
    // Set the translated title
    const h1 = document.querySelector('h1'); 
    const h1Text = h1.textContent
    console.log(h1)
    const message = {
        action: 'translate',
        text: h1Text,
        src_lang: 'eng_Latn',
        tgt_lang: 'ilo_Latn',
    }

    // https://developer.chrome.com/docs/extensions/reference/api/runtime#method-sendMessage
    chrome.runtime.sendMessage(message, (response) => {
        // Handle results returned by the service worker (`background.js`) and update the popup's UI.
        document.title = response ? response[0].translation_text : 'wow this is neat'
        h1.textContent = response ? `${response[0].translation_text} -- (${h1Text}) `: 'wow this is neat';
        // document.title = 'wow this is neat'
    });
})();
