const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const del = require('del');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const WebpackMessages = require('webpack-messages');
// const { VueLoaderPlugin } = require('vue-loader')
const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

/*
 |--------------------------------------------------------------------------
 | E-MR
 |--------------------------------------------------------------------------
 */
const dev = false;

// paths
let rootPath = path.resolve(__dirname, '');
const corePath = rootPath;
const coreSrcPath = corePath + '/src';

// arguments/params from the line command
const args = getParameters();

// get theme name
let theme = getTheme(args);

if (args.indexOf('docs_html') !== -1) {
    theme = 'docs';
}

if (dev) {
    rootPath = path.resolve(__dirname, '../../../themes/' + theme + '/html');
}

// get selected demo
let demo = getDemo() ?? "";

// under demo paths
const demoPath = rootPath + (demo ? '/' + demo : '/resources/assets/admin');
const distPath = demoPath + '/../../../public/admin';
const assetDistPath = distPath;
const srcPath = demoPath + '/src';

if (dev) {
    console.log(`Source: ${srcPath.replace(/\\/g, '/')}`);
    console.log(`Output: ${assetDistPath.replace(/\\/g, '/')}`);
}

const extraPlugins = [];
const exclude = [];

const js = args.indexOf('js') !== -1;
const css = args.indexOf('css') !== -1 || args.indexOf('scss') !== -1;

function getEntryFiles() {

    const entries = {
        // 3rd party plugins css/js
        'admin/plugins/global/plugins.bundle': ['./webpack/plugins/plugins.js', './webpack/plugins/plugins.scss'],
        // Theme css/js
        'admin/css/style.bundle': ['./' + path.relative('./', srcPath) + '/sass/style.scss', './' + path.relative('./', srcPath) + '/sass/plugins.scss'],
        'admin/js/scripts.bundle': './webpack/scripts' + (demo ? '.' + demo : '') + '.js',

        // ADMIN
        // 'css/plugin': './resources/sass/plugin.scss',
        // 'css/app': './resources/sass/app.scss',
        // ADMIN
    };

    // Custom 3rd party plugins
    (glob.sync('./webpack/{plugins,js}/custom/**/*.+(js)') || []).forEach(file => {
        let loc = file.replace('webpack/', '').replace('./', '');
        loc = loc.replace('.js', '.bundle');
        entries['admin/' + loc] = './' + file;
    });

    // Custom JS files from src folder
    (glob.sync(path.relative('./', srcPath) + '/js/custom/**/!(_)*.js') || [])
        .filter(f => {
            // exclude folder with bundle
            return /\/bundle\/.*?\.js/.test(f) === false;
        })
        .forEach(file => {
            entries[file.replace(/.*js\/(.*?)\.js$/ig, 'admin/js/$1')] = './' + file;
        });

    // Widgets js
    // entries['js/widgets.bundle'] = (glob.sync(path.relative('./', srcPath) + '/js/widgets/**/!(_)*.js') || []);

    entries['admin/js/widgets.bundle'] = [];
    (glob.sync(path.relative('./', srcPath) + '/js/widgets/**/!(_)*.js') || []).forEach(file => {
        entries['admin/js/widgets.bundle'].push('./' + file);
    });

    if (args.indexOf('docs_html') !== -1) {
        entries['admin/js/scripts.bundle'] = './' + path.relative('./', rootPath) + '/src/js/scripts.js';
    }

    return entries;
}

function mainConfig() {
    return {
        // // enabled/disable optimizations
        // mode: args.indexOf('production') !== -1 ? 'production' : 'development',
        // console logs output, https://webpack.js.org/configuration/stats/
        stats: 'errors-warnings',
        /*ignoreWarnings: [{
            module: /esri-leaflet/,
            message: /version/,
        }],*/
        // performance: {
        //     // disable warnings hint
        //     hints: false,
        // },
        optimization: {
            minimize: args.indexOf('production') !== -1,
            // js and css minimizer
            minimizer: [new TerserJSPlugin(), new CssMinimizerPlugin()],
        },
        entry: getEntryFiles(),

        // output: {
        //     // main output path in assets folder
        //     path: assetDistPath,
        //     // output path based on the entries' filename
        //     filename: '[name].js',
        // },

        resolve: {
            alias: {
                jquery: path.join(__dirname, 'node_modules/jquery/src/jquery'),
                $: path.join(__dirname, 'node_modules/jquery/src/jquery'),
                '@': [demoPath, corePath],
                'handlebars': 'handlebars/dist/handlebars.js',
                '@form-validation': (dev ? coreSrcPath : srcPath) + '/plugins/@form-validation/cjs',
            },
            extensions: ['.js', '.scss'],
            fallback: {
                util: false,
            },
        },
        // devtool: 'source-map',
        plugins: [
            new WebpackMessages({
                name: theme,
                logger: str => console.log(`>> ${str}`),
            }),
            // create css file
            new MiniCssExtractPlugin({
                filename: '[name].css',
            }),
            // new VueLoaderPlugin()
        ].concat(extraPlugins),

        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                    ],
                },
                {
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                // Prefer `dart-sass`
                                implementation: require("sass"),
                                sourceMap: false,
                                sassOptions: {
                                    includePaths: [
                                        demoPath,
                                        path.resolve(__dirname, 'node_modules'),
                                    ],
                                },
                            },
                        },
                    ],
                },
                // {
                //     test: /\.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
                //     use: [
                //         {
                //             loader: 'file-loader',
                //             options: {
                //                 // prevent name become hash
                //                 name: '[name].[ext]',
                //                 // move files
                //                 outputPath: 'plugins/global/fonts',
                //                 // rewrite path in css
                //                 publicPath: 'fonts',
                //                 esModule: false,
                //             },
                //         },
                //     ],
                // },
                {
                    test: /\.(gif|png|jpe?g)$/,
                    include: [
                        path.resolve(__dirname, 'node_modules'),
                    ],
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                // emitFile: false,
                                name: '[path][name].[ext]',
                                publicPath: (url, resourcePath, context) => {
                                    return path.basename(url);
                                },
                                outputPath: (url, resourcePath, context) => {
                                    var plugin = url.match(/node_modules\/(.*?)\//i);
                                    if (plugin) {
                                        return `admin/plugins/custom/${plugin[1]}/${path.basename(url)}`;
                                    }
                                    return url;
                                },
                            },
                        },
                    ],
                },
                {
                    // for demo8 image in scss
                    test: /\.(gif|png|jpe?g)$/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                emitFile: false,
                                name: '[path][name].[ext]',
                                publicPath: (url, resourcePath, context) => {
                                    console.log(url, resourcePath, context);
                                    return '../';
                                },
                            },
                        },
                    ],
                },
                // {
                //     test: /\.vue$/,
                //     loader: 'vue-loader'
                // },
            ],
        },
    };
}

function copyFolders() {
    let options = [
        {
            // copy media
            from: srcPath + '/media',
            to: assetDistPath + '/media',
        },
        {
            // copy tinymce skins
            from: path.resolve(__dirname, 'node_modules') + '/tinymce/skins',
            to: assetDistPath + '/plugins/custom/tinymce/skins',
        },
        {
            // copy tinymce plugins
            from: path.resolve(__dirname, 'node_modules') + '/tinymce/plugins',
            to: assetDistPath + '/plugins/custom/tinymce/plugins',
        }
    ];

    if (fs.existsSync(coreSrcPath + '/media/plugins/jstree')) {
        options.push({
            // copy jstree image
            from: coreSrcPath + '/media/plugins/jstree',
            to: assetDistPath + '/plugins/custom/jstree',
            force: true
        });
    }

    if (dev) {
        options.push({
            // copy media from core
            from: coreSrcPath + '/media',
            to: assetDistPath + '/media',
        });
    }

    return options;
}

function getParameters() {
    var args = [];
    Object.keys(process.env).forEach(function (key) {
        if (key.startsWith('npm_config_')) {
            var arg = key.substring('npm_config_'.length);
            args.push(arg);
        }
    });

    if ('production' === process.env['NODE_ENV']) {
        args.push('production');
    }

    return args;
}

function getTheme() {

    const excludedKeys = [
        'npm_config_cache',
        'npm_config_globalconfig',
        'npm_config_global_prefix',
        'npm_config_init_module',
        'npm_config_local_prefix',
        'npm_config_metrics_registry',
        'npm_config_node_gyp',
        'npm_config_noproxy',
        'npm_config_prefix',
        'npm_config_userconfig',
        'npm_config_user_agent',
        'npm_config_rtl',
    ];

    const key = Object.keys(process.env)
        .filter(element => !element.match(/npm_config_(demo\d+)$/))
        .filter(key => !excludedKeys.includes(key))
        .find(element => element.match(/npm_config_.*?/));

    if (key) {
        return key.replace('npm_config_', '');
    }

    return null;
}

function getDemo() {
    const key = Object.keys(process.env).find(element => element.match(/npm_config_(demo\d+)$/));

    let demo = null;

    if (key) {
        demo = key.replace('npm_config_', '');
    }

    return demo;
}

function removeExistingAssets() {
    if (typeof args.localhost === 'undefined') {
        del(assetDistPath, { force: true });
    }
}

// /**
// * plugins specific issue workaround for webpack
// * @see https://github.com/morrisjs/morris.js/issues/697
// * @see https://stackoverflow.com/questions/33998262/jquery-ui-and-webpack-how-to-manage-it-into-module
// */
mix.webpackConfig(mainConfig());

copyFolders().forEach(directory => {
    mix.copyDirectory(directory.from, directory.to);
});

mix.combine([
    "node_modules/datatables.net/js/jquery.dataTables.js",
    "node_modules/datatables.net-bs5/js/dataTables.bootstrap5.js",
    path.relative('./', demoPath) + "/src/js/vendors/plugins/datatables.init.js",
    "node_modules/jszip/dist/jszip.min.js",
    "node_modules/pdfmake/build/pdfmake.min.js",
    "node_modules/pdfmake/build/vfs_fonts.js",
    "node_modules/datatables.net-buttons/js/dataTables.buttons.min.js",
    "node_modules/datatables.net-buttons-bs5/js/buttons.bootstrap5.min.js",
    "node_modules/datatables.net-buttons/js/buttons.colVis.js",
    "node_modules/datatables.net-buttons/js/buttons.flash.js",
    "node_modules/datatables.net-buttons/js/buttons.html5.js",
    "node_modules/datatables.net-buttons/js/buttons.print.js",
    "node_modules/datatables.net-colreorder/js/dataTables.colReorder.min.js",
    "node_modules/datatables.net-colreorder-bs5/js/colReorder.bootstrap5.js",
    "node_modules/datatables.net-fixedcolumns/js/dataTables.fixedColumns.min.js",
    "node_modules/datatables.net-fixedcolumns-bs5/js/fixedColumns.bootstrap5.js",
    "node_modules/datatables.net-fixedheader/js/dataTables.fixedHeader.min.js",
    "node_modules/datatables.net-fixedheader-bs5/js/fixedHeader.bootstrap5.js",
    "node_modules/datatables.net-responsive/js/dataTables.responsive.min.js",
    "node_modules/datatables.net-responsive-bs5/js/responsive.bootstrap5.min.js",
    "node_modules/datatables.net-rowgroup/js/dataTables.rowGroup.min.js",
    "node_modules/datatables.net-rowgroup-bs5/js/rowGroup.bootstrap5.js",
    "node_modules/datatables.net-rowreorder/js/dataTables.rowReorder.min.js",
    "node_modules/datatables.net-rowreorder-bs5/js/rowReorder.bootstrap5.js",
    "node_modules/datatables.net-scroller/js/dataTables.scroller.min.js",
    "node_modules/datatables.net-scroller-bs5/js/scroller.bootstrap5.js",
    "node_modules/datatables.net-select/js/dataTables.select.min.js",
    "node_modules/datatables.net-select-bs5/js/select.bootstrap5.js",
    "node_modules/datatables.net-datetime/dist/dataTables.dateTime.min.js",
], 'public/admin/plugins/custom/datatables/datatables.bundle.js');

mix.combine([
    "node_modules/pdfmake/build/pdfmake.min.js.map",
], 'public/admin/plugins/custom/datatables/pdfmake.min.js.map');

mix.combine([
    "node_modules/datatables.net-bs5/css/dataTables.bootstrap5.css",
    "node_modules/datatables.net-buttons-bs5/css/buttons.bootstrap5.min.css",
    "node_modules/datatables.net-colreorder-bs5/css/colReorder.bootstrap5.min.css",
    "node_modules/datatables.net-fixedcolumns-bs5/css/fixedColumns.bootstrap5.min.css",
    "node_modules/datatables.net-fixedheader-bs5/css/fixedHeader.bootstrap5.min.css",
    "node_modules/datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css",
    "node_modules/datatables.net-rowreorder-bs5/css/rowReorder.bootstrap5.min.css",
    "node_modules/datatables.net-scroller-bs5/css/scroller.bootstrap5.min.css",
    "node_modules/datatables.net-select-bs5/css/select.bootstrap5.min.css",
    "node_modules/datatables.net-datetime/dist/dataTables.dateTime.min.css",
], 'public/admin/plugins/custom/datatables/datatables.bundle.css');

mix.combine([
    'node_modules/fullcalendar/main.js',
    'node_modules/fullcalendar/locales-all.min.js',
], 'public/admin/plugins/custom/fullcalendar/fullcalendar.bundle.js');

mix.combine([
    'node_modules/fullcalendar/main.min.css',
], 'public/admin/plugins/custom/fullcalendar/fullcalendar.bundle.css');

/*
 |--------------------------------------------------------------------------
 | E-MR
 |--------------------------------------------------------------------------
 */

/*
 |--------------------------------------------------------------------------
 | ADMIN
 |--------------------------------------------------------------------------
 */
mix.copyDirectory('resources/assets/img', 'public/img');

mix.js('resources/js/app.js', 'public/js');
mix.vue();

/*
 |--------------------------------------------------------------------------
 | ADMIN
 |--------------------------------------------------------------------------
 */

if (mix.inProduction()) {
    mix.version();
    mix.then(async () => {
        const convertToFileHash = require("laravel-mix-make-file-hash");
        convertToFileHash({
            publicPath: "public",
            manifestFilePath: "public/mix-manifest.json",
            blacklist: [
                "plugins/global/fonts/*",
            ],
            keepBlacklistedEntries: true,
            delOptions: { force: false },
            debug: false
        });
    });
}
