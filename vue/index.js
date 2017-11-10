define((require) => {
    const Vue = require("vue");
    const shell = require("text!./shell.html");

    var router = require('./router.config');

    var pubsub = require('utils/pubsub');
    pubsub.$on('busy', (value) => {
        //set a global loader
        console.log("App is Busy: {0}", value);
    });
    
    var app = new Vue({
        el: '#shell',
        router: router,
        template: shell
    });
});