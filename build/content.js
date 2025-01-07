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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLDhCQUE4QixNQUFNLE9BQU87QUFDbEY7QUFDQSxLQUFLO0FBQ0wsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2V4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9leHRlbnNpb24vLi9zcmMvY29udGVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGUgcmVxdWlyZSBzY29wZVxudmFyIF9fd2VicGFja19yZXF1aXJlX18gPSB7fTtcblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLypcbiAgICBjb250ZW50LmpzIC0gdGhlIGNvbnRlbnQgc2NyaXB0IHdoaWNoIGlzIHJ1biBpbiB0aGUgY29udGV4dCBvZiB3ZWIgcGFnZXMsIGFuZCBoYXMgYWNjZXNzIHRvIHRoZSBET00gYW5kIG90aGVyIHdlYiBBUElzLlxuKi9cbihhc3luYyAoKSA9PiB7XG4gICAgLy8gU2V0IHRoZSB0cmFuc2xhdGVkIHRpdGxlXG4gICAgY29uc3QgaDEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoMScpOyBcbiAgICBjb25zdCBoMVRleHQgPSBoMS50ZXh0Q29udGVudFxuICAgIGNvbnNvbGUubG9nKGgxKVxuICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgIGFjdGlvbjogJ3RyYW5zbGF0ZScsXG4gICAgICAgIHRleHQ6IGgxVGV4dCxcbiAgICAgICAgc3JjX2xhbmc6ICdlbmdfTGF0bicsXG4gICAgICAgIHRndF9sYW5nOiAnaWxvX0xhdG4nLFxuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vZG9jcy9leHRlbnNpb25zL3JlZmVyZW5jZS9hcGkvcnVudGltZSNtZXRob2Qtc2VuZE1lc3NhZ2VcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlLCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgLy8gSGFuZGxlIHJlc3VsdHMgcmV0dXJuZWQgYnkgdGhlIHNlcnZpY2Ugd29ya2VyIChgYmFja2dyb3VuZC5qc2ApIGFuZCB1cGRhdGUgdGhlIHBvcHVwJ3MgVUkuXG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gcmVzcG9uc2UgPyByZXNwb25zZVswXS50cmFuc2xhdGlvbl90ZXh0IDogJ3dvdyB0aGlzIGlzIG5lYXQnXG4gICAgICAgIGgxLnRleHRDb250ZW50ID0gcmVzcG9uc2UgPyBgJHtyZXNwb25zZVswXS50cmFuc2xhdGlvbl90ZXh0fSAtLSAoJHtoMVRleHR9KSBgOiAnd293IHRoaXMgaXMgbmVhdCc7XG4gICAgICAgIC8vIGRvY3VtZW50LnRpdGxlID0gJ3dvdyB0aGlzIGlzIG5lYXQnXG4gICAgfSk7XG59KSgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9