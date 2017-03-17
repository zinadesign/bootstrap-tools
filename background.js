var browserActionIsActive = {};
try {
    chrome.tabs.executeScript(null,  {file: "js/toolbar.js"});
} catch (e) {
    console && console.error(e);
}

chrome.browserAction.onClicked.addListener(function (tab) {
   browserActionIsActive[tab.id] = !browserActionIsActive[tab.id];
  if(browserActionIsActive[tab.id]) {
      chrome.tabs.sendMessage(tab.id, {event: "show_toolbar"});
  }  else  {
      chrome.tabs.sendMessage(tab.id, {event: "hide_toolbar"});
  }
});
chrome.tabs.onUpdated.addListener(function (tabid, changeInfo, tab) {
    if(changeInfo.status == "complete" && typeof browserActionIsActive[tabid] != "undefined")
    {
        delete browserActionIsActive[tabid];
    }
});
chrome.tabs.onRemoved.addListener(function(tab) {
    if(typeof browserActionIsActive[tab.id] != "undefined")
    {
        delete browserActionIsActive[tabid];
    }
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
    if (request.action == "resize_window") {
      _getLastFocused(function(win){
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