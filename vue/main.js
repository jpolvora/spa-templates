define((require) => {
    const Vue = require("vue");
    const shell = require("text!./shell.html");
    const router = require('./router.config');
    const pubsub = require('utils/pubsub');

    pubsub.$on('busy', (value) => {
        //set a global loader
        console.log("App is Busy: {0}", value);
        setBusy(value);
    });

    const app = new Vue({
        el: '#shell',
        router: router,
        template: shell
    });

    function setBusy(bool) {
        if (bool) {
            $('.page-loader-wrapper').fadeIn();
        } else {
            $('.page-loader-wrapper').fadeOut();
        }
    }

    $(function () {
        $("ul.list a").click(function () {
            $("ul.list li").each(function () {
                var $this = $(this);
                $this.removeClass("active");
            });

            var $this = $(this);
            $this.parent().addClass("active");
        });
    });
});