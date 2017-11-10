define((require) => {
    const Vue = require('vue');
    var axios = require('axios');

    var component = Vue.component('page2', {
        template: "<div><h1>Page2</h1><p>{{ message }}</p></div>",

        data: function () {
            return {
                message: "..."
            };
        },
        created: function () {
            console.info('page2 component created');
        },

        mounted: function () {
            var self = this;
            axios.get('/services').then((response) => {
                self.message = response.statusText;
            }).catch((error) => {
                self.message = error.response.statusText;
            });
        }
    });

    return component;
});