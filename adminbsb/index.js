require.config({
    baseUrl: '.',
    paths: {
        text: "./lib/text",
        viewmodels: './viewmodels',
        views: './views',
        lib: './lib'
    },
    deps: ["main"]
});

//requirejs('main');