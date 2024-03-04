///*global chrome */
/**
 * transform chrome callback style functions to return promises
 * @param context
 * @param funcName
 * @returns {*|n}
 */
export const promisifyChrome = (context, funcName) =>
  (...forwardedArgs) => {
    const callSiteStack = new Error().stack;
    return new Promise((resolve, reject) => {
      forwardedArgs.push((...resolvedArgs) => {
        if (chrome.runtime.lastError) {
          const err = new Error(chrome.runtime.lastError.message);
          err.lastError = chrome.runtime.lastError;
          //overwriting .stack actually overwrites the message to
          err.error_stack = callSiteStack;
          reject(err);
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
const sendMessage = promisifyChrome(chrome.runtime, 'sendMessage');


export {
  storageSet,
  storageGet,
  permissionsRequest,
  permissionsRemove,
  sendMessage,
};