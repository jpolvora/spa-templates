var router = new Router({
    routes: [
        {
            "default": "{controller=home}/{action=index}/:id?",
        }
    ],
    root: "./controllers",
    hooks: {
        before: (args) => {

        },
        after: (args) => {

        }
    }
});

router.start();

/**
 *when the app starts, it will get the current path and make the initial request to the server.
 the server will handle the request by executing the action and returning the view. The view will be rendered from 
 a view engine that is configured. 
 */