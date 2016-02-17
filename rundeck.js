var rp = require('request-promise');
var retry = require('bluebird-retry');
//rp.debug = true;

module.exports = {
    rundeck: rundeck
};

function rundeck(config) {
    var timeout = config.request_timeout | 2000;
    var token = config.rundeck_auth_token;

    return {
        listProjects: listProjects,
        listJobs: listJobs,
        findJob: findJob,
        runJob: runJob,
        finalExecutionStatus: finalExecutionStatus
    };

    function request(url, method, user) {
        if (!method) method = "GET";

        return rp({
            baseUrl: config.rundeck_url + '/api/15',
            url: url,
            json: true,
            method: method,
            headers: {
                'X-Rundeck-Auth-Token': token,
                'Accept': "application/json"
            },
            body: {
                asUser: user
            },
            timeout: timeout
        });
    }

    function listProjects() {
        return request("/projects").then(response =>response.map(project => project.name));
    }

    function listJobs(project) {
        return request("/project/" + project + "/jobs").then(response =>
            response.map(function (job) {
                return {'id': job.id, 'name': job.name};
            }));
    }

    function findJob(id) {
        return request("/job/" + id + "/executions");
    }

    function runJob(id, user) {
        return request("/job/" + id + "/run", "POST", user);
    }

    function executionStatus(id) {
        return request("/execution/" + id + "/output");
    }

    function finalExecutionStatus(id, interval, max_tries) {
        if (!interval) interval = 5000;
        if (!max_tries) max_tries = 10;

        function f() {
            return executionStatus(id).then(function (response) {
                if (response.execState === "running") throw "running";
                else return {state: response.execState, duration: parseInt(response.execDuration)};
            });
        }

        return retry(f, {interval: interval, max_tries: max_tries});
    }
}