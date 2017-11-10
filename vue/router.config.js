define((require) => {
    const Vue = require("vue");
    const VueRouter = require("vue-router");
    Vue.use(VueRouter);

    var components = {
        Home: require('./components/home'),
        Page2: require('./components/page2')
    }

    const routes = [
        { path: '/', component: components.Home },
        { path: '/page2', component: components.Page2 }
    ]

    const router = new VueRouter({
        routes // short for `routes: routes`
    })

    router.afterEach((to, from) => {
        console.dir({ to, from });

        $('.overlay').fadeOut();
        $('body').removeClass('overlay-open');
    })

    return router;
});