var gulp = require('gulp');
var compressor = require('node-minify');

gulp.task('clean', () => {
    console.log('clean -> before commit');
});

gulp.task('build', () => {
    console.log('build -> prepare for production');
});

gulp.task('minify', function () {
    compressor.minify({
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
    compressor.minify({
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
    compressor.minify({
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

gulp.task('default', ['clean', 'build', 'minify', 'bundle-css', 'bundle-js']);