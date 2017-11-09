require.config({
    baseUrl: '.',
    paths: {
        text: "./lib/text",
        viewmodels: './viewmodels',
        views: './views',
        lib: './lib',
        vue: '../node_modules/vue/dist/vue.min'
    },
    deps: ["main"]
});

//requirejs('main');