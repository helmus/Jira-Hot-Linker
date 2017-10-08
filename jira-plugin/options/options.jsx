/*global chrome */
import defaultConfig from 'options/config';
import ReactDOM from 'react-dom';
import {storageGet, storageSet, permissionsRequest} from 'src/chrome';

import 'options/options.scss';

const errorText = document.createElement('div');
document.body.appendChild(errorText);
window.onerror = function (msg, file, line, column, error) {
  errorText.innerHTML = error.stack;
};

const hasPathSlash = /.*:\/\/.*\//;

function toValidPermissionUri(val) {
  if (val.indexOf('://') === -1) {
    val = '*://' + val;
  }
  if (!hasPathSlash.test(val)) {
    val = val + '/';
  }
  return val;
}

async function saveOptions() {
  const status = document.getElementById('status');
  const domains = document.getElementById('domains')
    .value.split('\n').map(x => x.trim()).filter(x => !!x).map(x => x === '<all_urls>' ? '*://*/*' : x);
  const instanceUrl = document.getElementById('instanceUrl').value;
  domains.push(instanceUrl);
  
  let granted;
  try {
    granted = await permissionsRequest({'origins': domains.map(toValidPermissionUri)});
  } catch (ex) {
    status.innerHTML = `<br /><strong>${ex.message}</strong>`;
    return;
  }
  
  if (granted) {
    await storageSet({instanceUrl, domains});
    status.innerHTML = '<br />Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 750);
  } else {
    status.innerHTML = '<br /> Options <strong>Not</strong> saved.';
  }
}

async function main() {
  ReactDOM.render(ConfigPage(
    await storageGet(defaultConfig)
  ), document.getElementById('container'));
}

function ConfigPage(props) {
  return (
    <div>
      <label>
        Your full Jira instance url: <br/>
        <input
          id="instanceUrl"
          type="text"
          defaultValue={props.instanceUrl}
          placeholder="https://your-company.atlassian.net/"/>
      </label>
      <br/>
      <br/>
      <label>
        Domains where the plugin should be activated: <br/>
        This can be a domain a url or any valid {' '}
        <strong><a href='https://developer.chrome.com/extensions/match_patterns'>match pattern</a>
        </strong>.
        <br/>
        <textarea id="domains" defaultValue={props.domains.join('\n')} placeholder="1 site per line"/>
        <br/>
        You can also enable new domains at any time by clicking on the extension icon !
      </label>
      <div id='status'></div>
      <br/>
      <br/>
      <button onClick={saveOptions} id="save">Save</button>
    </div>
  );
}

document.addEventListener('DOMContentLoaded', main);

