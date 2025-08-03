build:
	npx webpack-cli
	rm -f jira-plugin.zip
	zip -r jira-plugin-build.zip jira-plugin
