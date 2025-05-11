/*global chrome */
import {waitForDocument} from 'src/utils';

waitForDocument(() => require('src/snack.scss'));

export function snackBar(message, timeout = 6000) {
  const $ = require('jquery');
  const content = $(`
      <div class="_JX_snack">
          <div class="_JX_snack_icon">
            <img src="${chrome.runtime.getURL('resources/jiralink128.png')}" class="_JX_snack_icon_img" />
          </div>
          <div class="_JX_snack_message">${message}</div>
      </div>
  `);
  $('._JX_snack').removeClass('_JX_snack_show');
  $(document.body).append(content);
  content.addClass('_JX_snack_show');
  setTimeout(function () {
    content.removeClass('_JX_snack_show').on('transitionend', () => content.remove());
  }, timeout);
}