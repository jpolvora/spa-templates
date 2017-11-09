define(function (require) {
    var view = require('text!views/permissao.html');
    var utils = require('lib/utils');

    /* returns a function that will be a factory */
    function viewmodel(args) {
        var self = this;
        this.id = ko.observable(args.id || 0);

        return {
            getView: function () {
                return view;
            },

            id: self.id,

            showId: function () {
                swal({
                    title: "Info!",
                    text: "Id: " + self.id(),
                    icon: "success",
                });
            },

            activate: function () {
                return utils.promiseTimeout(500);
            }
        }
    }

    return viewmodel;
});