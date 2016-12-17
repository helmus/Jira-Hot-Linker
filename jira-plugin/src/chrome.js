/**
 * transform chrome callback style functions to return promises
 * @param context
 * @param funcName
 * @returns {*|n}
 */
var promisfyChromeAsync = (context, funcName) =>
  (...forwardedArgs) => {
    return new Promise((resolve, reject) => {
      forwardedArgs.push(function (...resolvedArgs) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve.apply(this, resolvedArgs);
      });
      context[funcName].apply(context, forwardedArgs);
    });
  };

var storageGet = promisfyChromeAsync(chrome.storage.sync, 'get');
var storageSet = promisfyChromeAsync(chrome.storage.sync, 'set');

export {storageSet, storageGet};