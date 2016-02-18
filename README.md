# Marvin
Marvin is a Slack chat bot for triggering Rundeck jobs.

### Running Marvin locally

Take a copy of `config.tmpl.json` and name it `config.json`.
Fill in the variables:
* `slack_token` - the API token for the Slack user you want to run Marvin as
* `json_file_store` - a directory to store the alias information (`data` is good for local use as it's in the `.gitignore`) 
* `rundeck_url` - base url for Rundeck
* `rundeck_auth_token` - an API token for Rundeck

Start Marvin by running: 

    npm install
    node marvin.js

For development purposes, it may be useful to run Marvin in watched mode. 
Install `nodemon` via 

    npm install -g nodemon
    
and then call

    nodemon marvin.js
