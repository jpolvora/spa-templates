define((require) => {
    var Vue = require('vue');
    Vue.component('hello', {
        props: [ 'message'],
        template: '<p>{{ message }}</p>'
    });
});