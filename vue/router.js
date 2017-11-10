define((require) => {
    const Vue = require("vue");
    const VueRouter = require("vue-router");
    Vue.use(VueRouter);

    var views = {
        Home: require('./components/home'),
        Page2: require('./components/page2')
    }

    const routes = [
        { path: '/', component: views.Home },
        { path: '/page2', component: views.Page2 }
    ]

    const router = new VueRouter({
        routes // short for `routes: routes`
    })

    router.afterEach((to, from) => {
        console.dir({ to, from });
    })

    return router;
});