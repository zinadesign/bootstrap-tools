var browserActionIsActive = false;
chrome.tabs.executeScript(null,  {file: "js/toolbar.js"});
chrome.browserAction.onClicked.addListener(function (tab) {
  browserActionIsActive = !browserActionIsActive;
  console.log('clicked', browserActionIsActive);
  (function(browserActionIsActive){
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if(browserActionIsActive) {
          chrome.tabs.sendMessage(tabs[0].id, {event: "show_toolbar"});
        }
        else  {
          chrome.tabs.sendMessage(tabs[0].id, {event: "hide_toolbar"});
        }
    });
  })(browserActionIsActive);
});
function _getLastFocused(callback) {
    chrome.tabs.query({
        lastFocusedWindow: true
    }, function(tabs) {
        chrome.windows.get(tabs[0].windowId, {
            populate: true
        }, callback);
    })
}
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log('test');
    if (request.action == "resize_window") {
      _getLastFocused(function(win){
        console.log(win);
        if(win.state == "maximized") {
          chrome.windows.update(win.id, {state: "normal"}, function(){
            chrome.windows.update(win.id, request.options, function(){
              sendResponse("ok");
            });
          });
        }
        else
        {
          chrome.windows.update(win.id, request.options, function(){
              sendResponse("ok");
          });
        }
      });
    }
});
// function show() {
//   chrome.browserAction.setIcon({ path: "img/icon-active.png" });
//   on = true;
//   chrome.tabs.executeScript(null, { file: "js/jquery.js" }, function () {
//     chrome.tabs.executeScript(null, { file: "js/show.js" });
//   });
// }
//
// function hide() {
//   chrome.browserAction.setIcon({ path: "img/icon.png" });
//   on = false;
//   chrome.tabs.executeScript(null, { file: "js/jquery.js" }, function () {
//     chrome.tabs.executeScript(null, { file: "js/hide.js" });
//   });
// }
//
// chrome.tabs.onActivated.addListener(function(evt){
//   hide();
// });