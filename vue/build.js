({
    baseUrl: ".",
    optimize: 'none',

    paths: {
        vue: '../node_modules/vue/dist/vue.min',
        'vue-router': '../node_modules/vue-router/dist/vue-router.min',
        text: "../node_modules/text/text",
        axios: "../node_modules/axios/dist/axios"
    },
    name: './vendor/almond',
    include: ['shell'],
    insertRequire: ['shell'],
    out: 'shell-built.js',
    wrap: true,
})