var compressor = require('node-minify');
// Using UglifyJS
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