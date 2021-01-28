(function () {
  "use strict";
  const _ = require('lodash');
  const fetch = require('node-fetch');

  module.exports = {

    run: async (settings, cb) => {
      const config = settings.config;
      if (!_.has(config, 'githubToken') || !config.githubToken) {
        return cb(null, "Please configure a Personal Access Token at " + settings.path + ".");
      }

      const requestRepoWorkflowRuns = async (repo) => {
        const uri = config.baseUri + "/repos/" + repo.slug + "/actions/runs?status=completed&branch=" + (repo.branch || "master");
        const response = await fetch(uri, {
          method: 'GET',
          headers: {
            Accept: '*/*',
            Authorization: 'token ' + config.githubToken,
            'User-Agent': 'GitHub Workflow Status Indicator'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error, status: ${response.status}`);
        }
        let res = await response.json();
        res.repo = repo
        return res;
      };

      console.log("Collecting workflow status' for repos", config.repos);
      await Promise.all(_.map(config.repos, requestRepoWorkflowRuns)).then((d) => {
        const result = [];
        _.forEach(d, (data) => {
          let summary = _
            .chain(data['workflow_runs'] || [])
            .groupBy('workflow_id')
            .map(_.head)
            .map(function (run) {
              return {
                repo: data.repo,
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
          result.push(summary);
        });
        cb(_.flatten(result), null);
      }).catch((e) => {
        console.log('error:', e);
        cb(null, "can't get workflow runs");
      });
    }
  };
}());
