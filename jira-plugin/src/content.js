(function _init($, _, Promise) {
  if (Promise.longStackTraces) Promise.longStackTraces();

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

  var getJiraProjects = Promise.coroutine(function *() {
    var jiraProjects = (yield chrome.storage.sync.getP(['jiraProjects'])).jiraProjects;
    if (!_.size(jiraProjects)) {
      jiraProjects = yield $.get('https://origamilogic.atlassian.net/rest/api/2/project');
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

  Promise.coroutine(function * mainAsyncLocal() {
    var jiraProjects = yield getJiraProjects();
    if (!_.size(jiraProjects)) {
      console.log('Couldn\'t find any jira projects...');
      return;
    }
    var getJiraKeys = buildJiraKeyMatcher(jiraProjects.map(function (project) {
      return project.key;
    }));

    $(document.body).on('click', function (e) {
      var element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        var keys = getJiraKeys(element.innerText);
        if (_.size(keys)) {
          window.open('https://origamilogic.atlassian.net/browse/' + keys[0]);
        }
      }
    });
  })();
})($, _, Promise);
