export async function renderJiraBadges(projectKeys){
  if( ! projectKeys.length > 0 ){
    console.log('No project keys. Doing nothing');
    return;
  }

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
      const span = document.createElement('span');
      span.className = 'jira-hotlink';
      span.append(nodeValue.substring(match.index, match.index + match[0].length ));
      issueKeys.push(match[0]);
      fragments.push(span);
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

  console.log('Rendering JIRA badges');
  // Scan all elements in the page.
  var elements = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    (e) => {
      // return NodeFilter.FILTER_ACCEPT;
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
  console.log('REPLACEMENTS: ', replacements);

  const jiraKeys = replacements.flatMap( r => { return r.issueKeys; } );
  console.log('Must get data about ', jiraKeys); 

  return null;
}