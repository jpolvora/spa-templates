define((require) => {
    const Vue = require('vue');

    var component = Vue.component('home', {
        template: `
        <div>
            <p>Message: {{ message }}</p>
            <router-link to="page2">Page2</router-link>
        </div>
        `,
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