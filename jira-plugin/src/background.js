/*global chrome */
import defaultConfig from 'options/config.js';
import {storageGet, storageSet, permissionsRequest, promisifyChrome} from 'src/chrome';
import {contentScript, resetDeclarativeMapping} from 'options/declarative';
import $ from 'jquery';

const executeScript = promisifyChrome(chrome.tabs, 'executeScript');
const sendMessage = promisifyChrome(chrome.tabs, 'sendMessage');

var SEND_RESPONSE_IS_ASYNC=true;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'get') {
    $.get(request.url).then(result => {
      sendResponse({
        result
      })
    }).catch(error => {
      sendResponse({
        error
      })
    });
    return SEND_RESPONSE_IS_ASYNC;
  }
});

async function browserOnClicked (tab) {
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
}

(function () {
  chrome.runtime.onInstalled.addListener(async () => {
    const config = await storageGet(defaultConfig);
    if (!config.instanceUrl || !config.v15upgrade) {
      chrome.runtime.openOptionsPage();
      return;
    }
    resetDeclarativeMapping();
  });

  chrome.browserAction.onClicked.addListener(tab => {
    browserOnClicked(tab).catch( (err) => {
      console.log("Error: ", err)
    });
  });
})();