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
      context[funcName].apply(context, forwardedArgs);
    });
  };

const storageGet = promisfyChromeAsync(chrome.storage.sync, 'get');
const storageSet = promisfyChromeAsync(chrome.storage.sync, 'set');

export {storageSet, storageGet};