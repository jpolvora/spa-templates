define(function (require) {
    var view = require('text!views/usuario.html');
    var pubsub = require('lib/pubsub');

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
                alert(self.id());
            },
            navigate: function () {
                pubsub.publish('navigate', '/permissao/123');
            },
            canDeactivate: function () {
                return self.id() == 1;
            },
            deactivate: function () {
                //clean up
                console.log('deactivate');
            }
        }
    }

    return viewmodel;
});