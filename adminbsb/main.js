define(function (require) {
    var framework = require('./framework');
    var pubsub = require('lib/pubsub');

    var $shell = $('#shell');
    var router = new Navigo(null, true, "#!");

    var app = new framework({
        shell: $shell,
        router: router,
        channel: 'busy' //channel pubsub
    });

    var modules = {
        usuario: require('viewmodels/usuario'),
        usuarios: require('viewmodels/usuarios'),
        permissao: require('viewmodels/permissao'),
        permissoes: require('viewmodels/permissoes'),
        home: require('viewmodels/home')
    }

    router.on({
        '/usuario/:id': function (args, query) {
            app.goto(modules.usuario, args, query);
        },
        '/usuarios': function (args, query) {
            app.goto(modules.usuarios, args, query);
        },
        '/permissao/:id': function (args, query) {
            app.goto(modules.permissao, args, query);
        },
        '/permissoes': function (args, query) {
            app.goto(modules.permissoes, args, query);
        },
        '*': function (args, query) {
            app.goto(modules.home, args, query);
        }
    }).resolve();

    function setBusy(bool) {
        if (bool) {
            $('.page-loader-wrapper').fadeIn();
        } else {
            $('.page-loader-wrapper').fadeOut();
        }
    }

    $(function () {
        $("ul.list a").click(function () {
            $("ul.list li").each(function () {
                var $this = $(this);
                $this.removeClass("active");
            });

            var $this = $(this);
            $this.parent().addClass("active");
        });

        /* componentes podem colocar um overlay quando fazem chamadas assincronas */
        pubsub.subscribe('busy', function (_, bool) {
            setBusy(bool);
        });

        /* componentes podem navegar enviando mensagens ao channel navigate */
        pubsub.subscribe('navigate', function (_, url) {
            router.navigate(url);
        });

        /* fecha o menu da esquerda caso esteja aberto */
        pubsub.subscribe('navigated', function (_, url) {
            $('.overlay').fadeOut();
            $('body').removeClass('overlay-open');
        });
    });
});