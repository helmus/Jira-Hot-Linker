/*global chrome */
/**
 * transform chrome callback style functions to return promises
 * @param context
 * @param funcName
 * @returns {*|n}
 */
export const promisifyChrome = (context, funcName) =>
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

const storageGet = promisifyChrome(chrome.storage.sync, 'get');
const storageSet = promisifyChrome(chrome.storage.sync, 'set');
const permissionsRequest = promisifyChrome(chrome.permissions, 'request');
const permissionsRemove = promisifyChrome(chrome.permissions, 'remove');


export {
  storageSet,
  storageGet,
  permissionsRequest,
  permissionsRemove
};