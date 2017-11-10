define((require) => {
    const Vue = require("vue");
    const VueRouter = require("vue-router");
    Vue.use(VueRouter);

    var viewModels = {
        Home: require('./components/home'),
        Page2: require('./components/page2')
    }

    const routes = [
        { path: '/', component: viewModels.Home },
        { path: '/page2', component: viewModels.Page2 }
    ]

    const router = new VueRouter({
        routes // short for `routes: routes`
    })

    router.afterEach((to, from) => {
        console.dir({ to, from });
    })

    return router;
});