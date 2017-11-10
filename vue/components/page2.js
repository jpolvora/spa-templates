define((require) => {
    const Vue = require('vue');

    var component = Vue.component('page2', {
        template: "<h1>Page2</h1>",
       
        created: function () {
            console.info('page2 component created');
        }
    });

    return component;
});