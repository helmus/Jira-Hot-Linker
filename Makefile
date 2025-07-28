build:
	npx webpack-cli
	rm -f jira-plugin.zip
	zip -r jira-plugin.zip jira-plugin
