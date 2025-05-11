## Remarks by NL

### History
- Forked from https://github.com/helmus/Jira-Hot-Linker (couldn't open a PR there).

### How to setup locally

```sh
# Install requirements
cd Jira-Hot-Linker
npm install

# Build 
make
```

- Then open [chrome://extensions/](chrome://extensions/)
- Click on "Load unpacked"
- Navigate to the `jira-plugin` folder and validate
- Click on "details" on the extension, then visit "Extensions options", and add (for Spinergie) the following settings:
```sh
# Your full Jira instance url:
https://spinergie.atlassian.net/

#Locations where the plugin should be activated, comma separated:
https://github.com/, https://mail.google.com/, https://spinergie.atlassian.net/
```
- Then click on save.


## How to reload after a change
1. Build:
```
make
```
2. Click on the reload button on the extension detail page. 
--- 

## Jira Hot Linker

A Chrome plugin that will show Jira metadata when hovering over a Jira issue key on github.

Now available trough the Chrome Store !  
https://chrome.google.com/webstore/detail/jira-hotlinker/lbifpcpomdegljfpfhgfcjdabbeallhk

Make sure to configure your Jira instance url in the options page after installing. 
You can find the settings by clicking on the extensions icon and selecting options !

The tooltip is enabled on github.com by default, 
you can add new domains by clicking on the extension icon or in the option menu. 

### Features
- Title and link to Jira
- Related pull requests
- Descriptions
- Attachments
- Ticket Type / Status / Priority
- Comments
- Pin a ticket on the screen by dragging the title
- Copy issue key and title to clipboard
