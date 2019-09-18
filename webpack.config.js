var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: ["babel-polyfill","./index.js"],
    output: {
        filename: "./dist/js/bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel"
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader","css-loader")
            },
            {
                // Extract scss files
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract("style-loader","css-loader!sass-loader")
            }
        ]
    },
    plugins: [
        // Use plugin to specify resulting filename of bundled css
        new ExtractTextPlugin("dist/css/style.css")
    ]
};