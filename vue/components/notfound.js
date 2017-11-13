define((require) => {
    const Vue = require('vue');
    const template = require('text!./notfound.html');

    var component = Vue.component('notfound', {
        template: template
    });

    return component;
});