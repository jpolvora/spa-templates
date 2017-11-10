({
    baseDir: "./",
    appDir: "./",
    dir: "./",
    paths: {
        paths: {
            vue: '../node_modules/vue/dist/vue',
            'vue-router': '../node_modules/vue-router/dist/vue-router',
            text: "../node_modules/text/text",
        },
    },
    name: './vendor/almond',
    include: ['shell'],
    insertRequire: ['shell'],
    out: 'main-built.js',
    wrap: true,
})