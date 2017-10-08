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

  chrome.browserAction.onClicked.addListener(async function (tab) {
    const config = await storageGet(defaultConfig);
    if (!config.instanceUrl) {
      chrome.runtime.openOptionsPage();
      return;
    }
    const origin = new URL(tab.url).origin + '/';
    const granted = await permissionsRequest({origins: [origin]});
    if (granted) {
      const config = await storageGet(defaultConfig);
      if (config.domains.indexOf(origin) !== -1) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'message',
          message: origin + ' is already added.'
        });
        return;
      }
      config.domains.push(origin);
      await storageSet(config);
      await resetDeclarativeMapping();
      chrome.tabs.executeScript(null, {file: contentScript});
      chrome.tabs.sendMessage(tab.id, {
        action: 'message',
        message: origin + ' has been added to the list.'
      });
    }
  });
})();