/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
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




/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQiwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBLCtCQUErQjtBQUMvQixpQ0FBaUM7QUFDakMsbUNBQW1DO0FBQ25DLHVDQUF1QztBQUN2Qyx3REFBd0Q7QUFDeEQsa0RBQWtEO0FBQ2xELDBCQUEwQjtBQUMxQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHlCQUF5QjtBQUN6Qix1QkFBdUI7QUFDdkIseUNBQXlDO0FBQ3pDLDJCQUEyQjtBQUMzQixnRUFBZ0U7QUFDaEU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsMkJBQTJCLGlDQUFpQztBQUM1RDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsUUFBUTtBQUMvQyxzQ0FBc0MsUUFBUTtBQUM5QyxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0EsWUFBWTs7QUFFWjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLCtCQUErQixpQ0FBaUM7QUFDaEU7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxhQUFhO0FBQ2I7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLFVBQVU7QUFDOUMsNkJBQTZCLFFBQVEsRUFBRSxJQUFJO0FBQzNDO0FBQ0E7O0FBRUEsa0NBQWtDLGdCQUFnQjtBQUNsRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsd0JBQXdCLHVCQUF1QjtBQUMvQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0M7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7O0FBRUEscUJBQXFCO0FBQ3JCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLHFHQUFxRztBQUNuSTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCLGlDQUFpQztBQUMzRDtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0EsU0FBUztBQUNULE9BQU87QUFDUDtBQUNBLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZXh0ZW5zaW9uLy4vc3JjL2NvbnRlbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhlIHJlcXVpcmUgc2NvcGVcbnZhciBfX3dlYnBhY2tfcmVxdWlyZV9fID0ge307XG5cbiIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8qXG4gICAgY29udGVudC5qcyAtIHRoZSBjb250ZW50IHNjcmlwdCB3aGljaCBpcyBydW4gaW4gdGhlIGNvbnRleHQgb2Ygd2ViIHBhZ2VzLCBhbmQgaGFzIGFjY2VzcyB0byB0aGUgRE9NIGFuZCBvdGhlciB3ZWIgQVBJcy5cbiAgICAvLyBodHRwczovL2Rldi50by9sZW9fc29uZy9leHBsb3JpbmctdGhlLWNhbnZhcy1zZXJpZXMtY29tYmluZWQtd2l0aC10cmFuc2Zvcm1lcnNqcy10by1hY2hpZXZlLWludGVsbGlnZW50LWltYWdlLXByb2Nlc3NpbmctMmFvbFxuICAgICovXG4oYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGNzcyA9IGBcbiAgICAgICAgLmhpZ2hsaWdodGVkIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkNmI0ZmM7XG4gICAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICBwYWRkaW5nOiAzcHggNXB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnRvb2x0aXAge1xuICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKDI0MSwgMjQ0LCAyMjYpO1xuICAgICAgICAgICAgY29sb3I6ICMwMDA7XG4gICAgICAgICAgICBwYWRkaW5nOiAxMHB4IDIwcHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgICAgZGlzcGxheTogbm9uZTsgLyogSGlkZGVuIGJ5IGRlZmF1bHQgKi9cbiAgICAgICAgICAgIHdpZHRoOiAzMDBweDsgLyogTGltaXQgd2lkdGggKi9cbiAgICAgICAgICAgIG1heC13aWR0aDogMzAwcHg7XG4gICAgICAgICAgICBtaW4taGVpZ2h0OiAxNTBweDtcbiAgICAgICAgICAgIG1heC1oZWlnaHQ6IDMwMHB4OyAvKiBMaW1pdCBoZWlnaHQgKi9cbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3JtYWw7IC8qIEVuYWJsZSB0ZXh0IHdyYXBwaW5nICovXG4gICAgICAgICAgICB3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7IC8qIEJyZWFrIGxvbmcgd29yZHMgaWYgbmVjZXNzYXJ5ICovXG4gICAgICAgICAgICBvdmVyZmxvdy13cmFwOiBicmVhay13b3JkOyAvKiBNb2Rlcm4gYWx0ZXJuYXRpdmUgdG8gd29yZC13cmFwICovXG4gICAgICAgICAgICBib3gtc2hhZG93OiAwcHggNHB4IDhweCByZ2JhKDAsIDAsIDAsIDAuMik7IC8qIEhvcml6b250YWwsIFZlcnRpY2FsLCBCbHVyIFJhZGl1cywgU2hhZG93IENvbG9yICovXG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2IoMTE4LCAxMTUsIDExNSk7IC8qIEV4YW1wbGUgYm9yZGVyIGNvbG9yICovXG4gICAgICAgICAgICB6LWluZGV4OiA5OTk7IC8qIEVuc3VyZSB0b29sdGlwIGlzIGFib3ZlIG90aGVyIGNvbnRlbnQgKi9cbiAgICAgICAgfVxuXG4gICAgICAgIC50b29sdGlwLWNvbnRhaW5lciB7XG4gICAgICAgICAgICB3aWR0aDogNDI1cHg7XG4gICAgICAgICAgICBtaW4taGVpZ2h0OiAyMDBweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDE1cHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDI1cHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgMzBweCA5MHB4IC0yMHB4IHJnYmEoMCwwLDAsMC4zKTtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgIHotaW5kZXg6IDEwMDtcbiAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICB9XG4gICAgICAgIC5mYWRlLWluIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWRlIDAuMnMgbGluZWFyIGZvcndhcmRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQGtleWZyYW1lcyBmYWRlIHtcbiAgICAgICAgICAgIDAlIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgMTAwJSB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC5oaWdobGlnaHRlZDpob3ZlciAudG9vbHRpcCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgIHRvcDogLTE5MHB4OyAvKiBQb3NpdGlvbiBhYm92ZSB0aGUgdGV4dCAqL1xuICAgICAgICAgICAgbGVmdDogNTAlOyAvKiBDZW50ZXIgaG9yaXpvbnRhbGx5ICovXG4gICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7IC8qIEFkanVzdCBmb3IgY2VudGVyaW5nICovXG4gICAgICAgICAgICBwYWRkaW5nOiAxMHB4OyAvKiBPcHRpb25hbDogQWRkIHBhZGRpbmcgZm9yIGJldHRlciBzcGFjaW5nICovXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBvcGFjaXR5IDAuM3MgZWFzZSwgdHJhbnNmb3JtIDAuM3MgZWFzZTsgLyogU21vb3RoIHRyYW5zaXRpb24gKi9cbiAgICAgICAgfVxuICAgIGA7XG5cbiAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICBzdHlsZS50ZXh0Q29udGVudCA9IGNzcztcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcblxuICAgIGZ1bmN0aW9uIGFkZEhpZ2hsaWdodCh7dHJhbnNsYXRpb24sIHNlbGVjdGVkVGV4dCwgcmFuZ2V9KSB7XG4gICAgICAgIC8vIFJlcGxhY2Ugc2VsZWN0ZWQgdGV4dCB3aXRoIGN1c3RvbSBjb250ZW50XG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcImhpZ2hsaWdodGVkXCI7XG4gICAgICAgIHNwYW4udGV4dENvbnRlbnQgPSB0cmFuc2xhdGlvbjtcblxuICAgICAgICBjb25zdCB0b29sdGlwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdG9vbHRpcC5jbGFzc05hbWUgPSBcInRvb2x0aXBcIjtcbiAgICAgICAgdG9vbHRpcC50ZXh0Q29udGVudCA9IHNlbGVjdGVkVGV4dDsgLy8gVG9vbHRpcCB0ZXh0XG4gICAgICAgIHNwYW4uYXBwZW5kQ2hpbGQodG9vbHRpcCk7XG4gICAgICAgIFxuICAgICAgICAvLyBzcGFuLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWVudGVyXCIsIChlKSA9PiB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZygnbW91c2luZyBvdmVyJylcbiAgICAgICAgLy8gICAgIHRvb2x0aXAuY2xhc3NMaXN0LmFkZChcImZhZGUtaW5cIik7XG4gICAgICAgIC8vICAgICB0b29sdGlwLnN0eWxlLmxlZnQgPSBgJHtlLnBhZ2VYfXB4YDtcbiAgICAgICAgLy8gICAgIHRvb2x0aXAuc3R5bGUudG9wID0gYCR7ZS5wYWdlWX1weGA7XG4gICAgICAgIC8vICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBzcGFuLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCAoKSA9PiB7XG4gICAgICAgIC8vICAgICB0b29sdGlwLmNsYXNzTGlzdC5yZW1vdmUoXCJmYWRlLWluXCIpO1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyBSZXBsYWNlIHRoZSBzZWxlY3RlZCB0ZXh0IHdpdGggdGhlIG5ldyBzcGFuXG4gICAgICAgIHJhbmdlLmRlbGV0ZUNvbnRlbnRzKCk7XG4gICAgICAgIHJhbmdlLmluc2VydE5vZGUoc3Bhbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2F2ZUhpZ2hsaWdodChkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzYXZpbmcgdG8gbG9jYWxzdG9yYWdlJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG5cbiAgICAgICAgbGV0IGhpZ2hsaWdodHMgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdoaWdobGlnaHRzJykgfHwgJ1tdJyk7XG4gICAgICAgIGhpZ2hsaWdodHMucHVzaChkYXRhKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hpZ2hsaWdodHMnLCBKU09OLnN0cmluZ2lmeShoaWdobGlnaHRzKSk7XG4gICAgfVxuXG4gICAgLy8gUnVuIHJlc3RvcmVIaWdobGlnaHQgb24gcGFnZSBsb2FkXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uT2JqID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKClcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRUZXh0ID0gc2VsZWN0aW9uT2JqLnRvU3RyaW5nKClcblxuICAgICAgICBpZiAoc2VsZWN0ZWRUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndHJhbnNsYXRlJyxcbiAgICAgICAgICAgICAgICB0ZXh0OiBzZWxlY3RlZFRleHQsXG4gICAgICAgICAgICAgICAgc3JjX2xhbmc6ICdlbmdfTGF0bicsXG4gICAgICAgICAgICAgICAgdGd0X2xhbmc6ICdpbG9fTGF0bicsXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCcsIHNlbGVjdGVkVGV4dClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIuY2hyb21lLmNvbS9kb2NzL2V4dGVuc2lvbnMvcmVmZXJlbmNlL2FwaS9ydW50aW1lI21ldGhvZC1zZW5kTWVzc2FnZVxuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRpb24gPSByZXNwb25zZSA/IHJlc3BvbnNlWzBdLnRyYW5zbGF0aW9uX3RleHQgOiBzZWxlY3RlZFRleHRcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IHNlbGVjdGlvbk9iai5nZXRSYW5nZUF0KDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0T2Zmc2V0ID0gcmFuZ2Uuc3RhcnRPZmZzZXRcbiAgICAgICAgICAgICAgICBjb25zdCBlbmRPZmZzZXQgPSByYW5nZS5lbmRPZmZzZXRcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydENvbnRhaW5lclhQYXRoID0gZ2V0WFBhdGhGb3JOb2RlKHJhbmdlLnN0YXJ0Q29udGFpbmVyKVxuICAgICAgICAgICAgICAgIGNvbnN0IGVuZENvbnRhaW5lclhQYXRoID0gZ2V0WFBhdGhGb3JOb2RlKHJhbmdlLmVuZENvbnRhaW5lcilcblxuICAgICAgICAgICAgICAgIGFkZEhpZ2hsaWdodCh7IHRyYW5zbGF0aW9uLCBzZWxlY3RlZFRleHQsIHJhbmdlfSlcbiAgICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBwYXJlbnQgZWxlbWVudCB3aXRoIGEgdW5pcXVlIGlkZW50aWZpZXJcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudEVsZW1lbnQgPSByYW5nZS5jb21tb25BbmNlc3RvckNvbnRhaW5lci5jbG9zZXN0KCdbaWRdLCBbZGF0YS1pZF0nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnRJZCA9IHBhcmVudEVsZW1lbnQgPyAocGFyZW50RWxlbWVudC5pZCB8fCBwYXJlbnRFbGVtZW50LmRhdGFzZXQuaWQpIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudElkLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFRleHQsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzdGFydE9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgZW5kT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICBzdGFydENvbnRhaW5lclhQYXRoLFxuICAgICAgICAgICAgICAgICAgICBlbmRDb250YWluZXJYUGF0aCxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc2F2ZUhpZ2hsaWdodChkYXRhKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gZ2VuZXJhdGVzIGFuIFhQYXRoIGZvciBhIERPTSBub2RlIHNvIHRoYXQgd2VcbiAgICAvLyBrbm93IHdoZXJlIHRvIGFkZCB0aGUgaGlnaGxpZ2h0IFxuICAgIGZ1bmN0aW9uIGdldFhQYXRoRm9yTm9kZShub2RlKSB7XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBwYXJlbnQgZWxlbWVudCBmb3IgdGhlIHRleHQgbm9kZVxuICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgIGNvbnN0IHBhcnRzID0gW107XG4gICAgICAgIHdoaWxlIChub2RlICYmIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgICAgICAgbGV0IHNpYmxpbmcgPSBub2RlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgIHdoaWxlIChzaWJsaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpYmxpbmcubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFICYmIHNpYmxpbmcubm9kZU5hbWUgPT09IG5vZGUubm9kZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzaWJsaW5nID0gc2libGluZy5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0YWdOYW1lID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgY29uc3QgbnRoID0gY291bnQgPyBgWyR7Y291bnQgKyAxfV1gIDogJyc7XG4gICAgICAgICAgICBwYXJ0cy51bnNoaWZ0KGAke3RhZ05hbWV9JHtudGh9YCk7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcnRzLmxlbmd0aCA/IGAvJHtwYXJ0cy5qb2luKCcvJyl9YCA6IG51bGw7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1hQYXRoRXZhbHVhdG9yL2V2YWx1YXRlXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUZyb21YUGF0aCh4cGF0aCkge1xuICAgICAgICBjb25zdCBldmFsdWF0b3IgPSBuZXcgWFBhdGhFdmFsdWF0b3IoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZXZhbHVhdG9yLmV2YWx1YXRlKFxuICAgICAgICAgIHhwYXRoLFxuICAgICAgICAgIGRvY3VtZW50LFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgWFBhdGhSZXN1bHQuRklSU1RfT1JERVJFRF9OT0RFX1RZUEUsXG4gICAgICAgICAgbnVsbFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gcmVzdWx0LnNpbmdsZU5vZGVWYWx1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gVXRpbGl0eSBmdW5jdGlvbiB0byBmaW5kIHRoZSB0ZXh0IG5vZGUgYmFzZWQgb24gb2Zmc2V0IHdpdGhpbiBhbiBlbGVtZW50XG4gICAgZnVuY3Rpb24gZ2V0VGV4dE5vZGVGcm9tRWxlbWVudChlbGVtZW50LCBvZmZzZXQpIHtcbiAgICAgICAgY29uc3QgY2hpbGROb2RlcyA9IGVsZW1lbnQuY2hpbGROb2RlcztcbiAgICAgICAgbGV0IGN1cnJlbnRPZmZzZXQgPSAwO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2hpbGROb2RlID0gY2hpbGROb2Rlc1tpXTtcblxuICAgICAgICAgICAgaWYgKGNoaWxkTm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHRMZW5ndGggPSBjaGlsZE5vZGUubm9kZVZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChjdXJyZW50T2Zmc2V0IDw9IG9mZnNldCAmJiBjdXJyZW50T2Zmc2V0ICsgdGV4dExlbmd0aCA+IG9mZnNldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZE5vZGU7IC8vIFJldHVybiB0aGUgdGV4dCBub2RlIGNvbnRhaW5pbmcgdGhlIG9mZnNldFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudE9mZnNldCArPSB0ZXh0TGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7IC8vIE5vIHRleHQgbm9kZSBmb3VuZFxuICAgIH1cblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaGlnaGxpZ2h0cycpIHx8ICdbXScpO1xuICAgICAgICBjb25zb2xlLmxvZygnaGlnaGxpZ2h0czonLCBoaWdobGlnaHRzKTtcbiAgICAgIFxuICAgICAgICBoaWdobGlnaHRzLmZvckVhY2goKHsgcGFyZW50SWQsIHNlbGVjdGVkVGV4dCwgdHJhbnNsYXRpb24sIHN0YXJ0Q29udGFpbmVyWFBhdGgsIGVuZENvbnRhaW5lclhQYXRoLCBzdGFydE9mZnNldCwgZW5kT2Zmc2V0IH0pID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gUmV0cmlldmUgc3RhcnQgYW5kIGVuZCBjb250YWluZXJzIHVzaW5nIHRoZWlyIHJlc3BlY3RpdmUgWFBhdGhzXG4gICAgICAgICAgICBjb25zdCBzdGFydENvbnRhaW5lciA9IGdldE5vZGVGcm9tWFBhdGgoc3RhcnRDb250YWluZXJYUGF0aCk7XG4gICAgICAgICAgICBjb25zdCBlbmRDb250YWluZXIgPSBnZXROb2RlRnJvbVhQYXRoKGVuZENvbnRhaW5lclhQYXRoKTtcbiAgICAgIFxuICAgICAgICAgICAgaWYgKCFzdGFydENvbnRhaW5lciB8fCAhZW5kQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybignQ291bGQgbm90IGZpbmQgbm9kZXMgZm9yIHRoZSBwcm92aWRlZCBYUGF0aHMuJyk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgIFxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgcmFuZ2UgYmFzZWQgb24gdGhlIHByb3ZpZGVkIG9mZnNldHNcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICAgIFxuICAgICAgICAgICAgLy8gSGFuZGxlIHRoZSBzdGFydCBjb250YWluZXIgKGlmIGl0J3MgYSB0ZXh0IG5vZGUgb3IgZWxlbWVudClcbiAgICAgICAgICAgIGlmIChzdGFydENvbnRhaW5lci5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQoc3RhcnRDb250YWluZXIsIHN0YXJ0T2Zmc2V0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhcnRDb250YWluZXIubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRleHROb2RlID0gZ2V0VGV4dE5vZGVGcm9tRWxlbWVudChzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQpO1xuICAgICAgICAgICAgICBpZiAodGV4dE5vZGUpIHtcbiAgICAgICAgICAgICAgICByYW5nZS5zZXRTdGFydCh0ZXh0Tm9kZSwgc3RhcnRPZmZzZXQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTm8gdmFsaWQgdGV4dCBub2RlIGZvdW5kIHdpdGhpbiBzdGFydCBjb250YWluZXIuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICBcbiAgICAgICAgICAgIC8vIEhhbmRsZSB0aGUgZW5kIGNvbnRhaW5lciAoaWYgaXQncyBhIHRleHQgbm9kZSBvciBlbGVtZW50KVxuICAgICAgICAgICAgaWYgKGVuZENvbnRhaW5lci5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kKGVuZENvbnRhaW5lciwgZW5kT2Zmc2V0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZW5kQ29udGFpbmVyLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICBjb25zdCB0ZXh0Tm9kZSA9IGdldFRleHROb2RlRnJvbUVsZW1lbnQoZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpO1xuICAgICAgICAgICAgICBpZiAodGV4dE5vZGUpIHtcbiAgICAgICAgICAgICAgICByYW5nZS5zZXRFbmQodGV4dE5vZGUsIGVuZE9mZnNldCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdObyB2YWxpZCB0ZXh0IG5vZGUgZm91bmQgd2l0aGluIGVuZCBjb250YWluZXIuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICBcbiAgICAgICAgICAgIC8vIE5vdywgd2UgY3JlYXRlIHRoZSBoaWdobGlnaHQgc3BhbiBlbGVtZW50IHdpdGggdGhlIHRyYW5zbGF0aW9uXG4gICAgICAgICAgICBhZGRIaWdobGlnaHQoe3RyYW5zbGF0aW9uLCBzZWxlY3RlZFRleHQsIHJhbmdlfSlcbiAgICAgIFxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXN0b3JpbmcgaGlnaGxpZ2h0OicsIGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBcbn0pKCk7XG5cblxuXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=