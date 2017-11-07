define(function (require) {
    var pubsub = require('lib/pubsub');

    const emptyStr = "";

    function setViewModel($shell, viewmodel, args, query, channel) {
        var instance = null;
        args = args || {};
        query = query || {};
        if (typeof viewmodel === "function") {
            try {
                instance = new viewmodel(args, query);
            } catch (e) {
                console.error(e);
            }
            finally {
                if (!instance) instance = {};
            }

        } else {
            instance = viewmodel;
        }

        var view = emptyStr;
        if (typeof instance.getView === "function") {
            try {
                view = instance.getView.call(instance);
            } catch (e) {
                console.error(e);
            }
        }

        $shell.html(view);

        var node = $shell.children().first()[0];
        if (node) {
            try {
                ko.applyBindings(instance, node);
            } catch (e) {
                console.error(e);
            }
        }

        /* métodos activate podem retornar uma Promise */
        if (typeof instance.activate === "function") {
            try {
                pubsub.publish(channel, true);
                /* Promise.resolve() aceita um metodo que retorna um valor ou uma promise */
                Promise.resolve(instance.activate.call(instance)).then(function () {
                    pubsub.publish(channel, false);
                });

            } catch (e) {
                console.error(e);
            }
            finally {
                pubsub.publish('navigated', {});
            }
        } else {
            pubsub.publish('navigated', {});
        }

        return true;
    }

    function framework(config) {
        var self = this;
        var router = config.router || new Navigo(null, true, "#!");
        var $shell = config.shell || $('body');
        var channel = config.channel || 'changingview';


        router.hooks({
            before: function (done, params) {
                var node = $shell.children().first()[0];
                if (node) ko.cleanNode(node);

                $shell.empty();

                done(true); //done(false); //cancels
            },
            after: function (params) {
                router.updatePageLinks();
                window.scrollTo(0, 0);
                var lr = router.lastRouteResolved();
                console.dir(lr);
            }
        });

        return {
            goto: function (viewmodel, args, query) {
                if (setViewModel.call(self, $shell, viewmodel, args, query, channel)) {
                    //
                }
            }
        }
    }

    return framework;
});