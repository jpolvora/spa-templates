define((require) => {
    const shell = require("text!./shell.html");
    const Vue = require('vue');
    return {
        create: function (el, sharedRouter) {
            return new Vue({
                el: el || '#shell',
                router: sharedRouter,
                template: shell,
                mounted: function () {
                    this.$nextTick(function () {
                        // Código que irá rodar apenas após toda
                        // a árvore do componente ter sido renderizada
                    })
                }
            });
        }
    }
});