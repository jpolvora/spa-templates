({
    baseUrl: ".",

    paths: {
        text: "../node_modules/text/text",
        viewmodels: './viewmodels',
        views: './views',
        lib: './lib'
    },
    name: './vendor/almond',
    include: ['main'],
    insertRequire: ['main'],
    out: 'main-built.js',
    wrap: true,
})