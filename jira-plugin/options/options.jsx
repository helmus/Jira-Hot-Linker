/*global chrome */
import defaultConfig from 'options/config';
import ReactDOM from 'react-dom';
import {storageGet, storageSet, permissionsRequest} from 'src/chrome';

import 'options/options.css';

const errorText = document.createElement('div');
document.body.appendChild(errorText);
window.onerror = function (msg, file, line, column, error) {
  errorText.innerHTML = error.stack;
};

async function saveOptions() {
  const status = document.getElementById('status');
  const domains = document.getElementById('domains').value.split(',').map(x => x.trim());
  await storageGet(defaultConfig);
  const granted = await permissionsRequest({'origins': domains});
  
  if (granted) {
    storageSet({
      instanceUrl: document.getElementById('instanceUrl').value,
      domains
    });
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 750);
  } else {
    status.innerHTML = 'Options <strong>Not</strong> saved.';
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
        Comma separated list ( supports * wild cards ): <br/>
        <textarea rows="10" id="domains" defaultValue={props.domains.join(',\n')} placeholder="Comma separated text"/>
      </label>
      <div id='status'></div>
      <br/>
      <br/>
      <button onClick={saveOptions} id="save">Save</button>
    </div>
  );
}

document.addEventListener('DOMContentLoaded', main);

