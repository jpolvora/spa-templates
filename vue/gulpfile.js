var gulp = require('gulp'),
    rjs = require('requirejs'),
    compressor = require('node-minify'),
    del = require('del'),
    runSequence = require('run-sequence');

gulp.task('clean', () => {
    console.log('clean -> before commit');
    del.sync('app.min.js');
    del.sync('app-built.js');
    del.sync('vendor.js');
    del.sync('vendor.css');
});

gulp.task('build', (cb) => {
    console.log('build -> prepare for production');
    rjs.optimize({
        baseUrl: ".",
        optimize: 'none',
        appUrl: ".",
        paths: {
            'services': './services',
            vue: '../node_modules/vue/dist/vue.min',
            'vue-router': '../node_modules/vue-router/dist/vue-router.min',
            text: "../node_modules/text/text",
            axios: "../node_modules/axios/dist/axios"
        },
        name: './vendor/almond',
        include: ['app'],
        insertRequire: ['app'],
        out: 'app-built.js',
        wrap: true
    }, () => cb());
});

gulp.task('minify', function () {
    return compressor.minify({
        compressor: 'gcc',
        input: './app-built.js',
        output: './app.min.js',
        callback: function (err, min) {
            if (!err) {
                console.log("finish...");
            } else {
                console.log(err);
            }
        }
    });
});

gulp.task('bundle-css', function () {
    return compressor.minify({
        compressor: 'no-compress',
        input: [
            'plugins/bootstrap/css/bootstrap.min.css',
            'plugins/node-waves/waves.min.css',
            'plugins/animate-css/animate.min.css',
            'plugins/sweetalert/sweetalert.css',
            'css/style.css',
            'css/themes/all-themes.min.css'
        ],
        output: './vendor.css',
        callback: function (err, min) {
            if (!err) {
                console.log("finish...");
            } else {
                console.log(err);
            }
        }
    });
});

gulp.task('bundle-js', function () {
    return compressor.minify({
        compressor: 'no-compress',
        input: [
            'plugins/jquery/jquery.min.js',
            'plugins/bootstrap/js/bootstrap.min.js',
            'plugins/jquery-slimscroll/jquery.slimscroll.js',
            'plugins/node-waves/waves.min.js',
            'plugins/sweetalert/sweetalert.min.js',
            'js/admin.js'
        ],
        output: './vendor.js',
        callback: function (err, min) {
            if (!err) {
                console.log("finish...");
            } else {
                console.log(err);
            }
        }
    });
});

gulp.task('default', () => {
    runSequence(
        'clean',
        'build',
        ['minify', 'bundle-css', 'bundle-js'] //run in parallel
    );
});