/*global chrome */
import size from 'lodash/size';
import debounce from 'lodash/debounce';
import template from 'lodash/template';
import forEach from 'lodash/forEach';
import {centerPopup, waitForDocument} from 'src/utils';
import {sendMessage, storageGet, storageSet} from 'src/chrome';
import {snackBar} from 'src/snack';
import config from 'options/config.js';

waitForDocument(() => require('src/content.scss'));

const getInstanceUrl = async () => (await storageGet({
  instanceUrl: config.instanceUrl
})).instanceUrl;

const getConfig = async () => (await storageGet(config));

/**
 * Returns a function that will return an array of jira tickets for any given string
 * @param projectKeys project keys to match
 * @returns {Function}
 */
function buildJiraKeyMatcher(projectKeys) {
  const projectMatches = projectKeys.join('|');
  const jiraTicketRegex = new RegExp('(?:' + projectMatches + ')[- ]\\d*', 'ig');

  return function (text) {
    let matches;
    const result = [];

    while ((matches = jiraTicketRegex.exec(text)) !== null) {
      result.push(matches[0]);
    }
    return result;
  };
}

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.action === 'message') {
    snackBar(msg.message);
  }
});

let ui_tips_shown_local = [];

async function showTip(tipName, tipMessage) {
  if (ui_tips_shown_local.indexOf(tipName) !== -1) {
    return;
  }
  ui_tips_shown_local.push(tipName);
  const ui_tips_shown = (await storageGet({['ui_tips_shown']: []})).ui_tips_shown;
  if (ui_tips_shown.indexOf(tipName) === -1) {
    snackBar(tipMessage);
    ui_tips_shown.push(tipName);
    storageSet({'ui_tips_shown': ui_tips_shown});
  }
}

storageGet({'ui_tips_shown': []}).then(function ({ui_tips_shown}) {
  ui_tips_shown_local = ui_tips_shown;
});

async function get(url) {
  var response = await sendMessage({action: "get", url: url});
  if (response.result) {
    return response.result;
  } else if (response.error) {
    throw new Error(response.error);
  }
}

async function mainAsyncLocal() {
  const $ = require('jquery');
  const draggable = require('jquery-ui/ui/widgets/draggable');
  const clipboard = require('clipboard/dist/clipboard');

  const config = await getConfig();
  const INSTANCE_URL = config.instanceUrl;
  const jiraProjects = await get(await getInstanceUrl() + 'rest/api/2/project');

  if (!size(jiraProjects)) {
    console.log('Couldn\'t find any jira projects...');
    return;
  }
  const getJiraKeys = buildJiraKeyMatcher(jiraProjects.map(function (project) {
    return project.key;
  }));
  const annotation = template(await get(chrome.extension.getURL('resources/annotation.html')));
  const loaderGifUrl = chrome.extension.getURL('resources/ajax-loader.gif');

  /***
   * Retrieve only the text that is directly owned by the node
   * @param node
   */
  function getShallowText(node) {
    const TEXT_NODE = 3;
    return $(node).contents().filter(function (i, n) {
      //TODO, not specific enough, need to evaluate getBoundingClientRect
      return n.nodeType === TEXT_NODE;
    }).text();
  }

  function getPullRequestData(issueId) {
    return get(INSTANCE_URL + 'rest/dev-status/1.0/issue/detail?issueId=' + issueId + '&applicationType=github&dataType=pullrequest');
  }

  function getIssueMetaData(issueKey) {
    return get(INSTANCE_URL + 'rest/api/2/issue/' + issueKey + '?fields=description,id,summary,attachment,comment,issuetype,status,priority&expand=renderedFields');
  }

  function getRelativeHref(href) {
    const documentHref = document.location.href.split('#')[0];
    if (href.startsWith(documentHref)) {
      return href.slice(documentHref.length);
    }
    return href;
  }

  const container = $('<div class="_JX_container">');
  $(document.body).append(container);
  new draggable({
    handle: '._JX_title, ._JX_status',
  }, container);
  
  new clipboard('._JX_title_copy', {
    text: function (trigger) {
      return document.getElementById('_JX_title_link').text;
    }
  })
  .on('success', e => { snackBar('Copied!');})
  .on('error', e => { snackBar('There was an error!');})

  $(document.body).on('click', '._JX_thumb', function previewThumb(e) {
    const currentTarget = $(e.currentTarget);
    if (currentTarget.data('_JX_loading')) {
      return;
    }
    if (!currentTarget.data('mimeType').startsWith('image')) {
      return;
    }
    e.preventDefault();
    currentTarget.data('loading', true);
    const opacityElements = currentTarget.children(':not(._JX_file_loader)');
    opacityElements.css('opacity', 0.2);
    currentTarget.find('._JX_file_loader').show();
    const localCancelToken = cancelToken;
    const img = new Image();
    img.onload = function () {
      currentTarget.data('_JX_loading', false);
      currentTarget.find('._JX_file_loader').hide();
      const name = currentTarget.find('._JX_thumb_filename').text();
      opacityElements.css('opacity', 1);
      if (localCancelToken.cancel) {
        return;
      }
      centerPopup(chrome.extension.getURL(`resources/preview.html?url=${currentTarget.data('url')}&title=${name}`), name, {
        width: this.naturalWidth,
        height: this.naturalHeight
      }).focus();
    };
    img.src = currentTarget.data('url');
  });

  function hideContainer() {
    containerPinned = false;
    container.css({
      left: -5000,
      top: -5000,
      position: 'absolute',
    }).removeClass('container-pinned');

    passiveCancel(0);
  }

  $(document.body).on('keydown', function (e) {
    // TODO: escape not captured in google docs
    const ESCAPE_KEY_CODE = 27;
    if (e.keyCode === ESCAPE_KEY_CODE) {
      hideContainer();
      passiveCancel(200);
    }
  });

  let cancelToken = {};

  function passiveCancel(cooldown) {
    // does not actually cancel xhr calls
    cancelToken.cancel = true;
    setTimeout(function () {
      cancelToken = {};
    }, cooldown);
  }

  let hideTimeOut;
  let containerPinned = false;
  container.on('dragstop', () => {
    if (!containerPinned) {
      snackBar('Ticket Pinned! Hit esc to close !');
      container.addClass('container-pinned');
      const position = container.position();
      container.css({
        left: position.left - document.scrollingElement.scrollLeft,
        top: position.top - document.scrollingElement.scrollTop,
      });
      containerPinned = true;
      clearTimeout(hideTimeOut);
    }
  });
  $(document.body).on('mousemove', debounce(function (e) {
    if (cancelToken.cancel) {
      return;
    }
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element === container[0] || $.contains(container[0], element)) {
      showTip('tooltip_drag', 'Tip: You can pin the tooltip by dragging the title !');
      // cancel when hovering over the container it self
      return;
    }
    if (element) {
      let keys = getJiraKeys(getShallowText(element));
      if (!size(keys) && element.href) {
        keys = getJiraKeys(getRelativeHref(element.href));
      }
      if (!size(keys) && element.parentElement.href) {
        keys = getJiraKeys(getRelativeHref(element.parentElement.href));
      }

      if (size(keys)) {
        clearTimeout(hideTimeOut);
        const key = keys[0].replace(" ", "-");
        (async function (cancelToken) {
          const issueData = await getIssueMetaData(key);
          let prData = {};
          try {
            prData = await getPullRequestData(issueData.id);
          } catch (ex) {
            // probably no access
          }

          if (cancelToken.cancel) {
            return;
          }
          let comments = '';
          if (issueData.fields.comment && issueData.fields.comment.total) {
            comments = issueData.fields.comment.comments.map(
              comment => comment.author.displayName + ':\n' + comment.body
            ).join('\n\n');
          }
          const displayData = {
            urlTitle: key + ' ' + issueData.fields.summary,
            url: INSTANCE_URL + 'browse/' + key,
            prs: [],
            description: issueData.renderedFields.description,
            attachments: issueData.fields.attachment,
            issuetype: issueData.fields.issuetype,
            status: issueData.fields.status,
            priority: issueData.fields.priority,
            comment: issueData.fields.comment,
            comments,
            loaderGifUrl,
            size,
            forEach
          };
          if (size(prData.detail)) {
            displayData.prs = prData.detail[0].pullRequests.filter(function (pr) {
              return pr.url !== location.href;
            }).map(function (pr) {
              return {
                id: pr.id,
                url: pr.url,
                name: pr.name,
                status: pr.status,
                author: pr.author
              };
            });
          }
          // TODO: fix scrolling in google docs
          const css = {
            left: e.pageX + 20,
            top: e.pageY + 25
          };
          container.html(annotation(displayData));
          if (!containerPinned) {
            container.css(css);
          }
        })(cancelToken);
      } else if (!containerPinned) {
        hideTimeOut = setTimeout(hideContainer, 250);
      }
    }
  }, 100));
}

if (!window.__JX__script_injected__) {
  waitForDocument(mainAsyncLocal);
}

window.__JX__script_injected__ = true;