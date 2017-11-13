define((require) => {
    const Vue = require('vue');
    return {
        create: function (el, router) {
            return new Vue({
                el, //el : el,
                router, //router: router
                template: '<router-view></router-view>',
                mounted: function () {
                    this.$nextTick(function () {
                        // Código que irá rodar apenas após toda
                        // a árvore do componente ter sido renderizada
                        console.log('shell mounted.');
                    })
                }
            });
        }
    }
});