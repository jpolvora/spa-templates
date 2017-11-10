define((require) => {
    const Vue = require('vue');
    const template = require('text!./home.html');

    const pubsub = require('../utils/pubsub');
    const service = require("../services/ping");

    const component = Vue.component('home', {
        template: template,
        data: function () {
            return {
                message: 'loading...'
            }
        },
        created: function () {
            console.info('home component created');
            var self = this;

            service.ping("...").then(function (data) {
                self.message = data;
            });
        },
        methods: {
            gopage2: function () {
                pubsub.$emit('navigate', { name: 'page2' });
            }
        }
    });

    return component;
});