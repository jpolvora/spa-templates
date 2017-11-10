define((require) => {
    const Vue = require('vue');
    const template = require('text!./home.html');

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
            setTimeout(function () {
                self.message = 'loaded!!!';
            }, 2000);
        }
    });

    return component;
});