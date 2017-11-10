define((require) => {
    const Vue = require("vue");

    var router = require('./router');

    var app = new Vue({
        el: '#shell',
        router: router
    });
});