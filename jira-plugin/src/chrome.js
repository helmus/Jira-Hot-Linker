/*global chrome */
/**
 * transform chrome callback style functions to return promises
 * @param context
 * @param funcName
 * @returns {*|n}
 */
const promisfyChromeAsync = (context, funcName) =>
  (...forwardedArgs) => {
    return new Promise((resolve, reject) => {
      forwardedArgs.push((...resolvedArgs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(...resolvedArgs);
      });
      context[funcName](...forwardedArgs);
    });
  };

const storageGet = promisfyChromeAsync(chrome.storage.sync, 'get');
const storageSet = promisfyChromeAsync(chrome.storage.sync, 'set');
const permissionsRequest = promisfyChromeAsync(chrome.permissions, 'request');
const permissionsRemove = promisfyChromeAsync(chrome.permissions, 'remove');

export {
  storageSet,
  storageGet,
  permissionsRequest,
  permissionsRemove
};