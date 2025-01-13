/*
    content.js - the content script which is run in the context of web pages, and has access to the DOM and other web APIs.
    // https://dev.to/leo_song/exploring-the-canvas-series-combined-with-transformersjs-to-achieve-intelligent-image-processing-2aol
    */
(async () => {
    const css = `
        .highlighted {
            background-color: #d6b4fc;
            position: relative;
            cursor: pointer;
            padding: 3px 5px;
            border-radius: 5px;
        }

        .tooltip {
            position: absolute;
            background-color: rgb(241, 244, 226);
            color: #000;
            padding: 10px 20px;
            font-size: 14px;
            white-space: nowrap;
            display: none; /* Hidden by default */
            width: 300px; /* Limit width */
            max-width: 300px;
            min-height: 150px;
            max-height: 300px; /* Limit height */
            white-space: normal; /* Enable text wrapping */
            word-wrap: break-word; /* Break long words if necessary */
            overflow-wrap: break-word; /* Modern alternative to word-wrap */
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2); /* Horizontal, Vertical, Blur Radius, Shadow Color */
            border: 1px solid rgb(118, 115, 115); /* Example border color */
            z-index: 999; /* Ensure tooltip is above other content */
        }

        .tooltip-container {
            width: 425px;
            min-height: 200px;
            padding: 15px;
            font-size: 25px;
            background: white;
            box-shadow: 0 30px 90px -20px rgba(0,0,0,0.3);
            position: absolute;
            z-index: 100;
            display: none;
            opacity: 0;
        }
        .fade-in {
            display: block;
            animation: fade 0.2s linear forwards;
            }
            @keyframes fade {
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }

        .highlighted:hover .tooltip {
            display: block;
            top: -190px; /* Position above the text */
            left: 50%; /* Center horizontally */
            transform: translateX(-50%); /* Adjust for centering */
            padding: 10px; /* Optional: Add padding for better spacing */
            transition: opacity 0.3s ease, transform 0.3s ease; /* Smooth transition */
        }
    `;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    function addHighlight({translation, selectedText, range}) {
        // Replace selected text with custom content
        const span = document.createElement("span");
        span.className = "highlighted";
        span.textContent = translation;

        const tooltip = document.createElement("div");
        tooltip.className = "tooltip";
        tooltip.textContent = selectedText; // Tooltip text
        span.appendChild(tooltip);
        
        // span.addEventListener("mouseenter", (e) => {
        //     console.log('mousing over')
        //     tooltip.classList.add("fade-in");
        //     tooltip.style.left = `${e.pageX}px`;
        //     tooltip.style.top = `${e.pageY}px`;
        //   });
        
        // span.addEventListener("mouseout", () => {
        //     tooltip.classList.remove("fade-in");
        // });

        // Replace the selected text with the new span
        range.deleteContents();
        range.insertNode(span);
    }

    function saveHighlight(data) {
        console.log('saving to localstorage', JSON.stringify(data))

        let highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
        highlights.push(data);
        localStorage.setItem('highlights', JSON.stringify(highlights));
    }

    // Run restoreHighlight on page load
    document.addEventListener('mouseup', () => {
        const selectionObj = document.getSelection()
        const selectedText = selectionObj.toString()

        if (selectedText.length > 0) {
            const message = {
                action: 'translate',
                text: selectedText,
                src_lang: 'eng_Latn',
                tgt_lang: 'ilo_Latn',
            }

            console.log('selected', selectedText)
            
            // https://developer.chrome.com/docs/extensions/reference/api/runtime#method-sendMessage
            chrome.runtime.sendMessage(message, (response) => {
                const translation = response ? response[0].translation_text : selectedText
                const range = selectionObj.getRangeAt(0);
                const startOffset = range.startOffset
                const endOffset = range.endOffset
                const startContainerXPath = getXPathForNode(range.startContainer)
                const endContainerXPath = getXPathForNode(range.endContainer)

                addHighlight({ translation, selectedText, range})
                 // Find the closest parent element with a unique identifier

                const parentElement = range.commonAncestorContainer.closest('[id], [data-id]');
                const parentId = parentElement ? (parentElement.id || parentElement.dataset.id) : null;

                const data = {
                    parentId,
                    selectedText,
                    translation,
                    startOffset,
                    endOffset,
                    startContainerXPath,
                    endContainerXPath,
                };

                saveHighlight(data)
            });
        }
    })

    // generates an XPath for a DOM node so that we
    // know where to add the highlight 
    function getXPathForNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Get the parent element for the text node
            node = node.parentNode;
          }
          
        const parts = [];
        while (node && node.nodeType === Node.ELEMENT_NODE) {
            let count = 0;
            let sibling = node.previousSibling;
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === node.nodeName) {
                count++;
                }
                sibling = sibling.previousSibling;
            }
            const tagName = node.nodeName.toLowerCase();
            const nth = count ? `[${count + 1}]` : '';
            parts.unshift(`${tagName}${nth}`);
            node = node.parentNode;
        }

        return parts.length ? `/${parts.join('/')}` : null;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/XPathEvaluator/evaluate
    function getNodeFromXPath(xpath) {
        const evaluator = new XPathEvaluator();
        const result = evaluator.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        return result.singleNodeValue;
      }

      // Utility function to find the text node based on offset within an element
    function getTextNodeFromElement(element, offset) {
        const childNodes = element.childNodes;
        let currentOffset = 0;

        for (let i = 0; i < childNodes.length; i++) {
            const childNode = childNodes[i];

            if (childNode.nodeType === Node.TEXT_NODE) {
            const textLength = childNode.nodeValue.length;
            if (currentOffset <= offset && currentOffset + textLength > offset) {
                return childNode; // Return the text node containing the offset
            }
            currentOffset += textLength;
            }
        }

        return null; // No text node found
    }

    window.addEventListener('load', () => {
        const highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
        console.log('highlights:', highlights);
      
        highlights.forEach(({ parentId, selectedText, translation, startContainerXPath, endContainerXPath, startOffset, endOffset }) => {
          try {
            // Retrieve start and end containers using their respective XPaths
            const startContainer = getNodeFromXPath(startContainerXPath);
            const endContainer = getNodeFromXPath(endContainerXPath);
      
            if (!startContainer || !endContainer) {
              console.warn('Could not find nodes for the provided XPaths.');
              return;
            }
      
            // Create a range based on the provided offsets
            const range = document.createRange();
      
            // Handle the start container (if it's a text node or element)
            if (startContainer.nodeType === Node.TEXT_NODE) {
              range.setStart(startContainer, startOffset);
            } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
              const textNode = getTextNodeFromElement(startContainer, startOffset);
              if (textNode) {
                range.setStart(textNode, startOffset);
              } else {
                console.warn('No valid text node found within start container.');
                return;
              }
            }
      
            // Handle the end container (if it's a text node or element)
            if (endContainer.nodeType === Node.TEXT_NODE) {
              range.setEnd(endContainer, endOffset);
            } else if (endContainer.nodeType === Node.ELEMENT_NODE) {
              const textNode = getTextNodeFromElement(endContainer, endOffset);
              if (textNode) {
                range.setEnd(textNode, endOffset);
              } else {
                console.warn('No valid text node found within end container.');
                return;
              }
            }
      
            // Now, we create the highlight span element with the translation
            addHighlight({translation, selectedText, range})
      
          } catch (error) {
            console.error('Error restoring highlight:', error);
          }
        });
      });
      
})();



