import $ from 'jquery';
import _ from 'lodash';
import Promise from 'bluebird';
import {storageSet, storageGet} from './chrome'
import {centerPopup} from './utils'

var INSTANCE_URL = ''; // will be set asynchronously
var async = Promise.coroutine;

function getInstanceUrl() {
  return storageGet({
    instanceUrl: 'https://origamilogic.atlassian.net/'
  }).then(function (result) {
    return result.instanceUrl;
  });
}

var getJiraProjects = async(function *() {
  var jiraProjects = (yield storageGet(['jiraProjects'])).jiraProjects;
  if (!_.size(jiraProjects)) {
    jiraProjects = yield $.get(INSTANCE_URL + 'rest/api/2/project');
    if (!_.size(jiraProjects)) {
      return [];
    }
    yield storageSet({
      jiraProjects: jiraProjects
    });
  }
  return jiraProjects;
});

/**
 * Returns a function that will return an array of jira tickets for any given string
 * @param projectKeys project keys to match
 * @returns {Function}
 */
function buildJiraKeyMatcher(projectKeys) {
  var projectMatches = projectKeys.join('|');
  var jiraTicketRegex = new RegExp('(?:' + projectMatches + ')-\\d*', 'ig');

  return function (text) {
    var matches, result = [];
    while ((matches = jiraTicketRegex.exec(text)) !== null) {
      result.push(matches[0]);
    }
    return result;
  };
}

async(function * mainAsyncLocal() {
  INSTANCE_URL = yield getInstanceUrl();
  var jiraProjects = yield getJiraProjects();

  if (!_.size(jiraProjects)) {
    console.log('Couldn\'t find any jira projects...');
    return;
  }
  var getJiraKeys = buildJiraKeyMatcher(jiraProjects.map(function (project) {
    return project.key;
  }));

  var annotation = _.template(yield $.get(chrome.extension.getURL('resources/annotation.html')));
  var loaderGifUrl = chrome.extension.getURL('resources/ajax-loader.gif');

  /***
   * Retrieve only the text that is directly owned by the node
   * @param node
   */
  function getShallowText(node) {
    var TEXT_NODE = 3;
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

  var container = $('<div class="_JX_container">');
  $(document.body).append(container);

  $(document.body).on('click', '._JX_thumb', function previewThumb(e) {
    var currentTarget = $(e.currentTarget);
    if (currentTarget.data('_JX_loading')) {
      return;
    }
    currentTarget.data('loading', true);
    var opacityElements = currentTarget.children(':not(._JX_file_loader)');
    opacityElements.css('opacity', 0.2);
    currentTarget.find('._JX_file_loader').show();
    var localCancelToken = cancelToken;
    var img = new Image();
    img.onload = function () {
      currentTarget.data('_JX_loading', false);
      currentTarget.find('._JX_file_loader').hide();
      opacityElements.css('opacity', 1);
      if (localCancelToken.cancel) {
        return;
      }
      centerPopup(currentTarget.data('url'), currentTarget.data('url'), {
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
    var ESCAPE_KEY_CODE = 27;
    if (e.keyCode === ESCAPE_KEY_CODE) {
      hideContainer();
      passiveCancel(200);
    }
  });

  var cancelToken = {};

  function passiveCancel(cooldown) {
    // does not actually cancel xhr calls
    cancelToken.cancel = true;
    setTimeout(function () {
      cancelToken = {};
    }, cooldown);
  }

  var hideTimeOut;
  $(document.body).on('mousemove', _.debounce(function (e) {
    if (cancelToken.cancel) {
      return;
    }
    var element = document.elementFromPoint(e.clientX, e.clientY);
    if (element === container[0] || $.contains(container[0], element)) {
      return;
    }
    if (element) {
      var keys = getJiraKeys(getShallowText(element));
      if (_.size(keys)) {
        clearInterval(hideTimeOut);
        var key = keys[0];
        async(function *(cancelToken) {
          var issueData = yield getIssueMetaData(key);
          var prData = yield getPullRequestData(issueData.id);
          if (cancelToken.cancel) {
            return;
          }
          var displayData = {
            loaderGifUrl: loaderGifUrl,
            urlTitle: issueData.fields.summary,
            url: INSTANCE_URL + 'browse/' + key,
            prs: [],
            description: issueData.renderedFields.description,
            attachments: issueData.fields.attachment
          };
          if (_.size(prData.detail)) {
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
          var css = {
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
