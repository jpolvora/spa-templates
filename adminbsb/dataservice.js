define(function (require) {
    var pubsub = require('lib/pubsub');
    return {
        ping: function () {

            return new Promise(function (resolve, reject) {
                pubsub.publish('busy', true);
                $.post('/hello').done(function (data) {
                    resolve(data);
                }).fail(function (err) {
                    console.error('ping error:', err);
                    reject(err);
                }).always(function () {
                    pubsub.publish('busy', false);
                });
            });
        }
    }
});