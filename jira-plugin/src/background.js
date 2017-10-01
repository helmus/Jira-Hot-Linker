/*global chrome */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.type === 'open_settings') {
    chrome.runtime.openOptionsPage();
  }
});