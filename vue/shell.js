define((require) => {
    const Vue = require("vue");
    const shell = require("text!./shell.html");
    const menu = require("text!./menu.html");
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
        console.dir({ to, from });

        $('.overlay').fadeOut();
        $('body').removeClass('overlay-open');
    })


    const app = new Vue({
        el: '#shell',
        router: sharedRouter,
        template: shell,
        mounted: function () {
            this.$nextTick(function () {
                // Código que irá rodar apenas após toda
                // a árvore do componente ter sido renderizada
            })
        }
    });

    const left = new Vue({
        el: '#menu',
        template: menu,
        router: sharedRouter,
        mounted: function () {

            this.$nextTick(function () {
                // Código que irá rodar apenas após toda
                // a árvore do componente ter sido renderizada

                $(function () {
                    $.AdminBSB.browser.activate();
                    $.AdminBSB.leftSideBar.activate();
                    $.AdminBSB.rightSideBar.activate();
                    $.AdminBSB.navbar.activate();
                    $.AdminBSB.dropdownMenu.activate();
                    $.AdminBSB.input.activate();
                    $.AdminBSB.select.activate();
                    $.AdminBSB.search.activate();

                    setTimeout(function () { $('.page-loader-wrapper').fadeOut(); }, 50);
                });
            })
        }
    });

    function setBusy(bool) {
        if (bool) {
            $('.page-loader-wrapper').fadeIn();
        } else {
            $('.page-loader-wrapper').fadeOut();
        }
    }
});