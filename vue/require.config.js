const $root = ''; //relative to the webserver path
require.config({
    //baseUrl: './',

    paths: {
        'services': $root + 'services',
        vue: $root + '/node_modules/vue/dist/vue.min',
        'vue-router': $root + '/node_modules/vue-router/dist/vue-router.min',
        text: $root + "/node_modules/text/text",
        axios: $root + "/node_modules/axios/dist/axios"
    },
    deps: ["app"]
});