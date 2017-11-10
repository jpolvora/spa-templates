define((require) => {
    const Vue = require('vue');
    const template = require('text!./home.html');

    var service = require("../services/ping");

    var component = Vue.component('home', {
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
        }
    });

    return component;
});