/*global chrome */
import defaultConfig from 'options/config.js';
import regexEscape from 'escape-string-regexp';
import {storageGet} from 'src/chrome';
import {uniqueId} from 'lodash';

(function () {
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.type === 'open_settings') {
      chrome.runtime.openOptionsPage();
    }
  });
  
  const token = uniqueId('__JX_WILDCARD__');
  const tokenRE = new RegExp(token, 'g');
  
  function pageStateWildCardMatcher(wildCardUrl) {
    const urlRegex = regexEscape(wildCardUrl.replace(/\*/g, token)).replace(tokenRE, '.*');
    return new chrome.declarativeContent.PageStateMatcher({
      pageUrl: {
        urlMatches: urlRegex,
        schemes: ['http', 'https'],
      }
    });
  }
  
  chrome.runtime.onInstalled.addListener(async function () {
    const config = await storageGet(defaultConfig);
    chrome.declarativeContent.onPageChanged.removeRules(
      undefined,
      function () {
        chrome.declarativeContent.onPageChanged.addRules([{
          conditions: config.domains.map(pageStateWildCardMatcher),
          actions: [new chrome.declarativeContent.RequestContentScript({
            js: ['build/main.js'],
          })]
        }]);
      }
    );
  });
  
})();