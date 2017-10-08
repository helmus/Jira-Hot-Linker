/*global chrome */
import defaultConfig from 'options/config.js';
import {storageGet, storageSet, permissionsRequest} from 'src/chrome';
import {contentScript, resetDeclarativeMapping} from 'options/declarative';

(function () {
  chrome.runtime.onInstalled.addListener(async () => {
    const config = await storageGet(defaultConfig);
    if (!config.instanceUrl) {
      chrome.runtime.openOptionsPage();
      return;
    }
    resetDeclarativeMapping();
  });
  
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.type === 'open_settings') {
      chrome.runtime.openOptionsPage();
    }
  });
  
  chrome.browserAction.onClicked.addListener(async function ({url}) {
    const config = await storageGet(defaultConfig);
    if (!config.instanceUrl) {
      chrome.runtime.openOptionsPage();
      return;
    }
    const origin = new URL(url).origin + '/';
    const granted = await permissionsRequest({origins: [origin]});
    if (granted) {
      const config = await storageGet(defaultConfig);
      config.domains.push(origin);
      await storageSet(config);
      await resetDeclarativeMapping();
      chrome.tabs.executeScript(null, {file: contentScript});
    }
  });
  
})();