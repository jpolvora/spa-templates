define((require) => {
    const Vue = require("vue");


    const sharedRouter = require('./router.config');
    const pubsub = require('utils/pubsub');




    pubsub.$on('busy', (value) => {
        //set a global loader
        console.log('message:busy:', value);
        setBusy(value);
    });

    pubsub.$on('navigate', (config) => {
        console.log('message:navigated:', config);

        sharedRouter.push(config);
    });

    sharedRouter.afterEach((to, from) => {
        //console.dir({ to, from });

        $('.overlay').fadeOut();
        $('body').removeClass('overlay-open');
    })


    var shell = require('./components/shell');
    shell.create('#shell', sharedRouter);

    var menu = require('./components/menu');
    menu.create('#menu', sharedRouter);

    function setBusy(bool) {
        if (bool) {
            $('.page-loader-wrapper').fadeIn();
        } else {
            $('.page-loader-wrapper').fadeOut();
        }
    }
});