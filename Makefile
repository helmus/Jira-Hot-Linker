build:
	npx webpack-cli --mode=development
	rm -f jira-plugin.zip
	zip -r jira-plugin.zip jira-plugin