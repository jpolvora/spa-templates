define(function (require) {
    var view = require('text!views/permissoes.html');
    var utils = require('lib/utils');

    /* returns a function that will be a factory */
    function viewmodel(args) {
        return {
            getView: function () {
                return view;
            },

            activate: function () {
                return utils.promiseTimeout(2000);
            }
        }
    }

    return viewmodel;
});