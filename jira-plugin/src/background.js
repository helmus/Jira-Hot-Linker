/*global chrome */
(function () {
  chrome.runtime.onInstalled.addListener(function () {
    var scriptsRule = {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({pageUrl: {hostEquals: 'github.com', schemes: ['https']}})
      ],
      actions: [new chrome.declarativeContent.RequestContentScript({
        js: ['build/main.js'],
      })]
    };
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
      chrome.declarativeContent.onPageChanged.addRules([scriptsRule]);
    });
  });

})();