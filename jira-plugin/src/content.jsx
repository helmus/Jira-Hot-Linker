/*global chrome */
import $ from 'jquery';
import size from 'lodash/size';
import debounce from 'lodash/debounce';
import template from 'lodash/template';
import forEach from 'lodash/forEach';
import {storageSet, storageGet} from './chrome';
import {centerPopup} from './utils';
import './content.scss';

const getInstanceUrl = async () => (await storageGet({
  instanceUrl: 'https://origamilogic.atlassian.net/'
})).instanceUrl;

const getJiraProjects = async function () {
  let jiraProjects = (await storageGet(['jiraProjects'])).jiraProjects;
  if (!size(jiraProjects)) {
    jiraProjects = await $.get(await getInstanceUrl() + 'rest/api/2/project');
    if (!size(jiraProjects)) {
      return [];
    }
    await storageSet({
      jiraProjects: jiraProjects
    });
  }
  return jiraProjects;
};

/**
 * Returns a function that will return an array of jira tickets for any given string
 * @param projectKeys project keys to match
 * @returns {Function}
 */
function buildJiraKeyMatcher(projectKeys) {
  const projectMatches = projectKeys.join('|');
  const jiraTicketRegex = new RegExp('(?:' + projectMatches + ')-\\d*', 'ig');

  return function (text) {
    let matches;
    const result = [];

    while ((matches = jiraTicketRegex.exec(text)) !== null) {
      result.push(matches[0]);
    }
    return result;
  };
}

(async function mainAsyncLocal() {
  const INSTANCE_URL = await getInstanceUrl();
  const jiraProjects = await getJiraProjects();

  if (!size(jiraProjects)) {
    console.log('Couldn\'t find any jira projects...');
    return;
  }
  const getJiraKeys = buildJiraKeyMatcher(jiraProjects.map(function (project) {
    return project.key;
  }));

  const annotation = template(await $.get(chrome.extension.getURL('resources/annotation.html')));
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
    return $.get(INSTANCE_URL + 'rest/dev-status/1.0/issue/detail?issueId=' + issueId + '&applicationType=github&dataType=pullrequest');
  }

  function getIssueMetaData(issueKey) {
    return $.get(INSTANCE_URL + 'rest/api/2/issue/' + issueKey + '?fields=description,id,summary,attachment,comment&expand=renderedFields');
  }

  const container = $('<div class="_JX_container">');
  $(document.body).append(container);

  $(document.body).on('click', '._JX_thumb', function previewThumb(e) {
    const currentTarget = $(e.currentTarget);
    if (currentTarget.data('_JX_loading')) {
      return;
    }
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
    container.css({
      left: -5000,
      top: -5000
    });
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
  $(document.body).on('mousemove', debounce(function (e) {
    if (cancelToken.cancel) {
      return;
    }
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element === container[0] || $.contains(container[0], element)) {
      return;
    }
    if (element) {
      const keys = getJiraKeys(getShallowText(element));
      if (size(keys)) {
        clearInterval(hideTimeOut);
        const key = keys[0];
        (async function (cancelToken) {
          const issueData = await getIssueMetaData(key);
          const prData = await getPullRequestData(issueData.id);
          if (cancelToken.cancel) {
            return;
          }
          const displayData = {
            urlTitle: issueData.fields.summary,
            url: INSTANCE_URL + 'browse/' + key,
            prs: [],
            description: issueData.renderedFields.description,
            attachments: issueData.fields.attachment,
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
            left: e.pageX - 30,
            top: e.pageY + 35
          };
          container.html(annotation(displayData)).css(css);
        })(cancelToken);
      } else {
        hideTimeOut = setTimeout(hideContainer, 250);
      }
    }
  }, 100));
})();
