import $ from 'jquery'
import _ from 'lodash'
import Promise from 'bluebird'

var INSTANCE_URL = ''; // will be set asynchronously
var async = Promise.coroutine;

/**
 * transform chrome callback style functions to return promises
 * @param context
 * @param funcName
 * @returns {*|n}
 */
function promisfyChromeAsync(context, funcName) {
  return function promisfyForward() {
    var forwardedArgs = _.toArray(arguments);
    return new Promise(function (resolve, reject) {
      forwardedArgs.push(function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve.apply(this, arguments);
      });
      context[funcName].apply(context, forwardedArgs);
    });
  }
}

chrome.storage.sync.getP = promisfyChromeAsync(chrome.storage.sync, 'get');
chrome.storage.sync.setP = promisfyChromeAsync(chrome.storage.sync, 'set');

function getInstanceUrl() {
  return chrome.storage.sync.getP({
    instanceUrl: 'https://origamilogic.atlassian.net/'
  }).then(function (result) {
    return result.instanceUrl;
  });
}

var getJiraProjects = async(function *() {
  var jiraProjects = (yield chrome.storage.sync.getP(['jiraProjects'])).jiraProjects;
  if (!_.size(jiraProjects)) {
    jiraProjects = yield $.get(INSTANCE_URL + 'rest/api/2/project');
    if (!_.size(jiraProjects)) {
      return [];
    }
    yield chrome.storage.sync.setP({
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
  }
}

function getCenter(width, heigth) {
  var totalScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
  var totalScreenRight = window.screenTop !== undefined ? window.screenTop : screen.top;
  var screenWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  var screenHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
  var left = ((screenWidth / 2) - (width / 2)) + totalScreenLeft;
  var top = ((screenHeight / 2) - (heigth / 2)) + totalScreenRight;
  return {
    left: left,
    top: top
  };
}

function toOptionsString(options) {
  return _.map(options, function (value, key) {
    return key + '=' + value;
  }).join(', ');
}

function centerPopup(url, title, options) {
  options = _.defaults(options || {}, {
    width: 800,
    height: 600
  });
  options = _.defaults(options, getCenter(options.width, options.height));
  return window.open(url, title, toOptionsString(options));
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
    if (e.keyCode == ESCAPE_KEY_CODE) {
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
              }
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
