/*global chrome */
import defaultConfig from 'options/config.js';
import {storageGet, storageSet, permissionsRequest, promisifyChrome} from 'src/chrome';
import {contentScript, resetDeclarativeMapping} from 'options/declarative';

const executeScript = promisifyChrome(chrome.tabs, 'executeScript');

(function () {
  chrome.runtime.onInstalled.addListener(async () => {
    const config = await storageGet(defaultConfig);
    if (!config.instanceUrl) {
      chrome.runtime.openOptionsPage();
      return;
    }
    resetDeclarativeMapping();
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
      await executeScript(null, {file: contentScript});
      chrome.tabs.sendMessage(tab.id, {
        action: 'message',
        message: origin + ' added successfully !'
      });
    }
  });
})();