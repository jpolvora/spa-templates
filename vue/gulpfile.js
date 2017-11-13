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

gulp.task('default', ['clean', 'build', 'minify']);