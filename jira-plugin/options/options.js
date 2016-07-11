var errorText = document.createElement("div");
document.body.appendChild(errorText)
window.onerror = function (msg, file, line, column, error) {
  errorText.innerHTML = error.stack;
}

function save_options() {
  var instanceUrl = document.getElementById('instanceUrl').value;
  chrome.storage.sync.set({
    instanceUrl: instanceUrl
  }, function () {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    instanceUrl: 'https://origamilogic.atlassian.net/'
  }, function (items) {
    document.getElementById('instanceUrl').value = items.instanceUrl;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
