/**
 * 
 * @param {*} projectKeys The project keys for the JIRA issue keys to detect in the text 
 * @param {*} jiraUrl The URL of the JIRA instance
 * @param {*} getUrl a function that returns a promise with an object datum as a result.
 * @returns a Promise to await on.
 */
export async function renderJiraBadges(projectKeys, jiraUrl, getUrl){
  if( ! projectKeys.length > 0 ){
    console.log('No project keys. Doing nothing');
    return;
  }

  const $ = require('jquery');

  const re = new RegExp('\\b(?:' + projectKeys.join('|') + ')-\\d+\\b', 'g');

  const replacementsOf = (textNode) => {
    const nodeValue = textNode.nodeValue;
    // A collection of new nodes to replace the original with
    var fragments = [];
    var issueKeys = [];

    // Last end will iterate in the original nodeValue
    var last_end = 0;

    let match;
    while ((match = re.exec(nodeValue)) !== null) {
      // We matched after the last end of the previous match
      if( last_end != match.index){
        // Save the bit of string as a plain fragment.
        fragments.push(document.createTextNode(nodeValue.substring(last_end, match.index )));
      }

      // Time to build a replacement for the match
      const key = match[0];
      const jspan = $('<span class="jira-' + key + ' jira-hotlink-badge"><a href="' + jiraUrl + '/browse/' + key + '">'+ key +'</a></span>');

      issueKeys.push(match[0]);
      fragments.push(jspan.get(0));
      // We have progressed in the original string
      last_end = match.index + match[0].length;
    }

    // Have we matched anything and is there any leftover string?
    if( last_end > 0 && last_end < nodeValue.length ){
      fragments.push(document.createTextNode(nodeValue.substring(last_end,nodeValue.length)));
    }

    if( fragments.length > 0 ){
      return { replace: textNode , with: fragments , issueKeys };
    }

    // No replacement
    return null;
  };

  // The scanning.
  const ignore_elements = {
    'STYLE': true,
    'SCRIPT': true,
    'NOSCRIPT': true,
    'IFRAME' : true,
    'OBJECT': true,
    'INPUT': true,
    'FORM': true,
    'TEXTAREA': true,
    'HEAD': true,
    'LINK': true,
    'A': true,
  };

  // Scan all elements in the page.
  var elements = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    (e) => {
      return ignore_elements[( e.tagName  || '' ).toUpperCase()]  ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  );

  // Holds a collection of { replace: <node> , with: [ replacementNodes... ], issueKeys: [ keys.. ] }
  const replacements = [];
  let element;
  while ((element = elements.nextNode() )) {
    // Find only the texts of this element
    var texts = document.createNodeIterator(element, NodeFilter.SHOW_TEXT, (node) => {
      // Only consider direct children, so we don't go over text nodes multiple times.
      return node.parentNode === element ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    });
    let text;
    while ((text = texts.nextNode())) {
      const r = replacementsOf(text);
      if( r != null ){
        replacements.push(r);
      }
    }
  }

  let r;
  for(r of replacements){
    r.replace.replaceWith.apply(r.replace, r.with);
  }


  // Build all promises of data filling
  function getShortMetaData(issueKey) {
    return getUrl(jiraUrl + 'rest/api/2/issue/' + issueKey + '?fields=id,summary,issuetype,status,priority&expand=renderedFields');
  }
  const dataPromise = Promise.allSettled(
    replacements
      .flatMap( r => { return r.issueKeys; } )
      .filter((v,i,a)=>a.indexOf(v)==i) // No duplicates please.
      .map( k => { return getShortMetaData(k); })
      .map( dp => { return dp.then( r => {
        const thespans = $('.jira-' + r.key);
        const summary = $('<span class="summary" />');
        const status  = $('<span class="status" />');
        summary.append(r.fields.summary);
        status.append(r.fields.status.name);
        status.addClass( r.fields.status.statusCategory.colorName );
        thespans.append(summary);
        thespans.append(status);
        return null;
      });
      })
  );

  return dataPromise;
}