define((require) => {
    const Vue = require('vue');
    const menu = require("text!./menu.html");
    const user = require('services/user');

    return {
        create: function (el, sharedRouter) {
            return new Vue({
                el: el || '#menu',
                template: menu,
                router: sharedRouter,
                data: function () {
                    return {
                        email: '...',
                        name: '...'
                    }
                },
                mounted: function () {
                    var self = this;
                    this.$nextTick(function () {
                        // Código que irá rodar apenas após toda
                        // a árvore do componente ter sido renderizada

                        var info = user.getUserInfo().then(function (data) {
                            self.email = data.email;
                            self.name = data.name;
                        }).catch((err) => {
                            self.email = "Error...";
                            self.name = "error...";
                        });

                        $(function () {
                            $.AdminBSB.browser.activate();
                            $.AdminBSB.leftSideBar.activate();
                            $.AdminBSB.rightSideBar.activate();
                            $.AdminBSB.navbar.activate();
                            $.AdminBSB.dropdownMenu.activate();
                            $.AdminBSB.input.activate();
                            $.AdminBSB.select.activate();
                            $.AdminBSB.search.activate();

                            setTimeout(function () { $('.page-loader-wrapper').fadeOut(); }, 50);
                        });
                    })
                }
            });
        }
    }
});