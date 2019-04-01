/*global chrome */
import defaultConfig from 'options/config.js';
import {storageGet, storageSet, permissionsRequest, promisifyChrome} from 'src/chrome';
import {contentScript, resetDeclarativeMapping} from 'options/declarative';

const executeScript = promisifyChrome(chrome.tabs, 'executeScript');
const sendMessage = promisifyChrome(chrome.tabs, 'sendMessage');

(function () {
  chrome.runtime.onInstalled.addListener(async () => {
    const config = await storageGet(defaultConfig);
    if (!config.instanceUrl || !config.v15upgrade) {
      chrome.runtime.openOptionsPage();
      return;
    }
    resetDeclarativeMapping();
  });

  chrome.browserAction.onClicked.addListener(async function (tab) {
    const config = await storageGet(defaultConfig);
    if (!config.instanceUrl || !config.v15upgrade) {
      chrome.runtime.openOptionsPage();
      return;
    }
    const origin = new URL(tab.url).origin + '/';
    const granted = await permissionsRequest({origins: [origin]});
    if (granted) {
      const config = await storageGet(defaultConfig);
      if (config.domains.indexOf(origin) !== -1) {
        try {
          await sendMessage(tab.id, {
            action: 'message',
            message: origin + ' is already added.'
          });
        } catch (ex) {
          // extension was just installed and not injected on this tab yet
          await executeScript(tab.id, {file: contentScript});
          await sendMessage(tab.id, {
            action: 'message',
            message: 'Jira HotLinker enabled successfully !'
          });
        }
        return;
      }
      config.domains.push(origin);
      await storageSet(config);
      await resetDeclarativeMapping();
      await executeScript(null, {file: contentScript});
      await sendMessage(tab.id, {
        action: 'message',
        message: origin + ' added successfully !'
      });
    }
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    const $ = require('jquery');

    console.log(request);

    $.get(request.url, request.data)
      .done(function(data, statusText) {
        sendResponse([{
            data: data,
            status: 200,
            statusText: statusText
          }, null]);
      })
      .fail(function(error) {
        sendResponse([null, error]);
      });
    return true;
  });
})();