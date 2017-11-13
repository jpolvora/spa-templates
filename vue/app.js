define((require) => {
    //boot up all components

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
        $('.overlay').fadeOut();
        $('body').removeClass('overlay-open');
    })

    function setBusy(bool) {
        if (bool) {
            $('.page-loader-wrapper').fadeIn();
        } else {
            $('.page-loader-wrapper').fadeOut();
        }
    }

    require('./components/menu').create('#menu', sharedRouter);
    require('./components/shell').create('#shell', sharedRouter);
});