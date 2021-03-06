define((require) => {
    const Vue = require("vue");
    const VueRouter = require("vue-router");
    Vue.use(VueRouter);

    var components = {
        Home: require('./components/home'),
        Page2: require('./components/page2'),
        NotFound: require('./components/notfound')
    }

    const sharedRouter = new VueRouter({
        //mode: 'history',
        routes: [
            { path: '/', name: 'home', component: components.Home },
            { path: '/page2', name: 'page2', component: components.Page2 },
            { path: '*', name: 'notfound', component: components.NotFound }
        ]
    })

    return sharedRouter;
});