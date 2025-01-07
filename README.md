
# Browser extension to translate text

This chrome browser extension runs the huggingface Translation pipeline on given text from the oage,

## Getting Started
1. Install the necessary dependencies:
    ```bash
    npm install 
    ```

1. Build the project:
    ```bash
    npm run build 
    ```

1. Add the extension to your browser. To do this, go to `chrome://extensions/`, enable developer mode (top right), and click "Load unpacked". Select the `build` directory from the dialog which appears and click "Select Folder".

1. That's it! You should now be able to open the extension's popup and see text on the page translated into the chosen language.

## Editing the template

We recommend running `npm run dev` while editing the template as it will rebuild the project when changes are made. 

All source code can be found in the `./src/` directory:
- `background.js` ([service worker](https://developer.chrome.com/docs/extensions/mv3/service_workers/)) - handles text sent from the UI, then runs the translation pipeline on the text using model [Xenova/nllb-200-distilled-600M](https://huggingface.co/Xenova/nllb-200-distilled-600M), and returns the translated text. You will need to reload the extension (by visiting `chrome://extensions/` and clicking the refresh button) after editing this file for changes to be visible in the extension. Full list of languages available [here](https://github.com/facebookresearch/flores/blob/main/flores200/README.md#languages-in-flores-200).

- `content.js` ([content script](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)) - contains the code which is injected into every page the user visits. You can use the `sendMessage` api to make requests to the background script. Similarly, you will need to reload the extension after editing this file for changes to be visible in the extension.

- `popup.html`, `popup.css`, `popup.js` ([toolbar action](https://developer.chrome.com/docs/extensions/reference/action/)) - contains the code for the popup which is visible to the user when they click the extension's icon from the extensions bar. For development, we recommend opening the `popup.html` file in its own tab by visiting `chrome-extension://<ext_id>/popup.html` (remember to replace `<ext_id>` with the extension's ID). You will need to refresh the page while you develop to see the changes you make.
