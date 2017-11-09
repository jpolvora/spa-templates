define(function (require) {
    var view = require('text!views/home.html');
    var pubsub = require('lib/pubsub');
    var dataservice = require('dataservice');
    var utils = require('lib/utils');
    var count = 0;

    function viewmodel(args, query) {
        count++;
        var self = this;
        this.message = ko.observable('');
        function activate() {
            console.log('activate: ' + count);
            return dataservice.ping().then(function (data) {
                var date = utils.jsonDateConverter(data.DateTime);
                self.message(date);
            }, function (err) {
                swal({
                    title: "Erro!",
                    text: err.statusText,
                    icon: "error",
                });
            });
        }

        return {
            getView: function () {
                return view;
            },
            activate: activate,
            message: self.message
        }
    }

    return viewmodel;
});