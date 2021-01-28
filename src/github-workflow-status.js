(function () {
  "use strict";
  const _ = require('lodash');
  const Q = require('q');
  const request = require('request');

  module.exports = {

    run: (config, cb) => {
      if (!_.has(config, 'githubToken') || !config.githubToken) {
        return cb(null, "Please configure a GitHub Personal Access Token (github-workflow-status.githubToken).")
      }

      const requestGitHubApi = function (requestUri) {
        const deferred = Q.defer();
        jsonRequest(requestUri, function (error, json) {
          if (error) {
            deferred.reject(error);
          }
          else {
            deferred.resolve(json);
          }
        });
        return deferred.promise;
      }

      const requestRepoWorkflowRuns = function (repo) {
        return requestGitHubApi(config.baseUri + "/repos/" + repo.slug + "/actions/runs?status=completed&branch=" + (repo.branch || "master"))
      };

      console.log("Collecting workflow status' for repos", config.repos);
      _.forEach(config.repos, function (repo) {
        // console.log("Working on repo", repo);

        requestRepoWorkflowRuns(repo).then(
          function (jsonResponse) {
            var summary = _
              .chain(jsonResponse['workflow_runs'] || [])
              .groupBy('workflow_id')
              .map(_.head)
              .map(function (run) {
                return {
                  repo: repo,
                  id: run.id,
                  workflow_id: run.workflow_id,
                  name: run.name,
                  status: run.status,
                  conclusion: run.conclusion,
                  url: run.url,
                  html_url: run.html_url,
                  created_at: run.created_at,
                  updated_at: run.updated_at
                }
              })
              .value();
            // console.log("summary", summary);
            cb(summary, null);
          },
          function (error) {
            console.log('error:', error);
            cb(null, "can't get prometheus alertmanager alerts");
          }
        )
      });

      function jsonRequest(requestUri, callback) {
        request({
          uri: requestUri,
          method: 'GET',
          headers: {
            Accept: '*/*',
            Authorization: 'token ' + config.githubToken,
            'User-Agent': 'GitHub Workflow Status Indicator'
          }
        }, function (err, response, body) {
          if (err || !response || response.statusCode !== 200) {
            err = (err || (response ? ("bad statusCode: " + response.statusCode) : "bad response")) + " from " + requestUri;
          }
          let jsonBody;
          try {
            jsonBody = JSON.parse(body);
          }
          catch (e) {
            if (!err) {
              err = 'invalid json response';
            }
          }
          callback(err, jsonBody, response);
        });
      }

      function convertToMessage(alert) {
        if (alert.annotations && alert.annotations['teamwall_summary']) {
          return alert.annotations['teamwall_summary'];
        }
        else {
          return [
            alert.labels.env ? alert.labels.env.toUpperCase() : '',
            alert.labels.alertname,
            alert.labels.human_readable_context_name
          ].join(' ').trim();
        }
      }
    }
  };
}());
