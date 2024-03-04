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


# Development

## In devcontainer

Open this with VScode and build the devcontainer

### Building/Running local version

```sh
npm install
npx webpack-cli build --mode development
```

Or if you want to continuously rebuild:

```sh
npx webpack-cli watch --mode development
```

Then install your local version of the plugin following this guide https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world

### Building for release/production

This will be much slower.

```sh
npx webpack-cli build --mode production
```
