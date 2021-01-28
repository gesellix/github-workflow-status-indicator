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
  console.log('settings file:', settings.path);
  console.log('settings', settings.get("github-workflow-status"));

  module.exports = {
    load: () => {
      return settings.get("github-workflow-status");
    }
  }
}());
