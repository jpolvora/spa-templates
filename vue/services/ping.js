define((require) => {
    var pubsub = require('utils/pubsub');

    return {
        ping: function (url) {
            /* fake */
            pubsub.$emit('busy', true);

            return new Promise((resolve) => {
                setTimeout(function () {
                    pubsub.$emit('busy', false);
                    resolve(`${url} success!`);
                }, 1000);
            });
        }
    }
});