/*global chrome */
import {waitForDocument} from 'src/utils';

waitForDocument(() => require('src/snack.scss'));

export function snackBar(message, timeout = 3000) {
  const $ = require('jquery');
  const content = $(`
      <div class="_JX_snack">
          <div class="_JX_snack_icon">
            <img src="${chrome.extension.getURL('resources/jiralink128.png')}" class="_JX_snack_icon_img" />
          </div>
          <div class="_JX_snack_message">${message}</div>
      </div>
  `);
  $(document.body).append(content);
  setTimeout(() => {
    content.addClass('_JX_snack_show');
    setTimeout(function () {
      content.removeClass('_JX_snack_show').on('transitionend', () => content.remove());
    }, timeout);
  }, 10);
}