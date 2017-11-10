require.config({
    baseUrl: '.',
    paths: {
        text: "../node_modules/text/text",
        viewmodels: './viewmodels',
        views: './views',
        lib: './lib'
    },
    deps: ["main"]
});

//requirejs('main');