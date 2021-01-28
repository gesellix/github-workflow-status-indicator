(function () {
  "use strict";
  const {ipcRenderer} = require('electron');

  module.exports = (model) => {
    model = model || {};

    const init = () => {
      ipcRenderer.on('config', function (e, config) {
        console.log('on config', e, config);

        model.config.baseUri = config.baseUri;
      });

      ipcRenderer.on('error', function (e, error) {
        console.log('on error', e, error);

        model.status = 'error';
        model.error = error;
        model.repos = [];
      });

      ipcRenderer.on('update', function (e, status, repos) {
        console.log('on update', e, status, repos);

        model.status = status;
        model.error = '';
        model.repos = repos;
      });
    };

    init();

    return {};
  };
}());
