// Gulp imports
const gulp = require('gulp');

const minifyCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const cond = require('gulp-cond');
const eslint = require('gulp-eslint');
const livereload = require('gulp-livereload');
const mocha = require('gulp-mocha');
const nodemon = require('gulp-nodemon');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const minifyJS = require('gulp-uglify');

// Other libraries
const browserify = require('browserify');
const del = require('del');
const hmr = require('browserify-hmr'); // high severity vulnerability, don't use in production
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const watchify = require('watchify');
const coffeeify = require('coffeeify');
const {argv} = require('yargs');
const log = require('fancy-log');
require('@babel/register'); // Needed for mocha tests

// If gulp was called in the terminal with the --prod flag, set the node environment to production
if (argv.prod) {
  process.env.NODE_ENV = 'production';
}
let PROD = process.env.NODE_ENV === 'production';

// Configuration
const src = 'src';
const config = {
  port: PROD ? 8080 : 3000,
  paths: {
    baseDir: PROD ? 'build' : 'dist',
    html: src + '/index.html',
    entry: src + '/index.coffee',
    js: src + '/**/*.{js,coffee}',
    test: src +'/**/*.test.{js,coffee}',
    css: src + '/**/*.scss',
    fonts: src + '/fonts/**/*'
  }
};

// Browserify specific configuration
const b = browserify({
  entries: [config.paths.entry],
  debug: true,
  plugin: PROD ? [] : [watchify, hmr],
  cache: {},
  packageCache: {},
  transform: [coffeeify]
})
.transform('babelify');
b.on('update', bundle_js);
b.on('log', log);

/**
* Gulp Tasks
**/

// Clears the contents of the dist and build folder
function clean() {
  return del(['dist/**/*', 'build/**/*']);
}

// Linting
function lint() {
  return gulp.src(config.paths.js)
  .pipe(eslint())
  .pipe(eslint.format())
}

// Unit tests
function test() {
  return gulp.src(config.paths.test, {read: false})
  .pipe(mocha({ "require": ["coffeescript/register"] }));
}

// Copies our index.html file from the app folder to either the dist or build folder, depending on the node environment
function html() {
  return gulp.src(config.paths.html)
  .pipe(gulp.dest(config.paths.baseDir))
  .pipe(cond(!PROD, livereload()));
}

// Bundles our vendor and custom CSS. Sourcemaps are used in development, while minification is used in production.
function css() {
  return gulp.src(
    [
      config.paths.css
    ]
  )
  .pipe(cond(!PROD, sourcemaps.init()))
  .pipe(sass().on('error', sass.logError))
  .pipe(concat('bundle.css'))
  .pipe(cond(PROD, minifyCSS()))
  .pipe(cond(!PROD, sourcemaps.write()))
  .pipe(gulp.dest(config.paths.baseDir))
  .pipe(cond(!PROD, livereload()));
}

// Copies fonts into either the dist or build folder, depending on the node environment
function fonts() {
  return gulp.src([config.paths.fonts])
  .pipe(gulp.dest(config.paths.baseDir + '/fonts'));
}

// Runs an Express server defined in server.js
function server(done) {
  nodemon({
    script: 'server.js'
  });
  done();
}

// Re-runs specific tasks when certain files are changed
function watch(done) {
  livereload.listen({basePath: 'dist'});
  gulp.watch(config.paths.html, html);
  gulp.watch(config.paths.css, css);
  gulp.watch(config.paths.js, gulp.series(lint, test));
  done();
}

// Default task, bundles the entire app and hosts it on an Express server
const default_build = gulp.series(clean, lint, test, html, css, bundle_js, fonts, gulp.parallel(server, watch));

// Bundles our JS using browserify. Sourcemaps are used in development, while minification is used in production.
function bundle_js() {
  return b.bundle()
  .on('error', log.bind(log, 'Browserify Error'))
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe(cond(PROD, minifyJS()))
  .pipe(cond(!PROD, sourcemaps.init({loadMaps: true})))
  .pipe(cond(!PROD, sourcemaps.write()))
  .pipe(gulp.dest(config.paths.baseDir));
}

exports.default = default_build;
exports.clean   = clean;
exports.lint    = lint;
exports.test    = test;
exports.html    = html;
exports.js      = bundle_js;
exports.css     = css;
exports.fonts   = fonts;
exports.server  = server;
exports.watch   = watch;
