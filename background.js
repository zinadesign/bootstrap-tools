var on = false;
hide();

chrome.browserAction.onClicked.addListener(function (tab) {
  if (on) {
    hide();
  } else {
    show();
  }
});

function show() {
  chrome.browserAction.setIcon({ path: "img/icon-active.png" });
  on = true;
  chrome.tabs.executeScript(null, { file: "js/jquery.js" }, function () {
    chrome.tabs.executeScript(null, { file: "js/show.js" });
  });
}

function hide() {
  chrome.browserAction.setIcon({ path: "img/icon.png" });
  on = false;
  chrome.tabs.executeScript(null, { file: "js/jquery.js" }, function () {
    chrome.tabs.executeScript(null, { file: "js/hide.js" });
  });
}

chrome.tabs.onActivated.addListener(function(evt){
  hide();
});