(function () {
  "use strict";

  const Store = require('electron-store');
  const settings = new Store({
    defaults: {
      "github-workflow-status": {
        title: "GitHub Workflow Status",
        baseUri: "https://api.github.com",
        githubToken: "",
        pollInterval: 5000,
        repos: [
          {
            slug: "example/repo",
            branch: "main"
          }
        ]
      }
    }
  });

  module.exports = {
    load: () => {
      return {
        path: settings.path,
        config: settings.get("github-workflow-status")
      };
    }
  }
}());
