// Gulp imports
const gulp = require("gulp");

const minifyCSS = require("gulp-clean-css");
const concat = require("gulp-concat");
const cond = require("gulp-cond");
const eslint = require("gulp-eslint");
const livereload = require("gulp-livereload");
const mocha = require("gulp-mocha");
const nodemon = require("gulp-nodemon");
const sass = require("gulp-sass");
const sourcemaps = require("gulp-sourcemaps");
const terser = require("gulp-terser");
const autoprefixer = require("gulp-autoprefixer");

// Other libraries
const browserify = require("browserify");
const del = require("del");
const hmr = require("browserify-hmr"); // high severity vulnerability, don't use in production
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const watchify = require("watchify");
const { argv } = require("yargs");
const log = require("fancy-log");
const bourbon = require("bourbon").includePaths;
const bourbon_n = require("bourbon-neat").includePaths;
require("@babel/register"); // Needed for mocha tests

// If gulp was called in the terminal with the --prod flag, set the node environment to production
if (argv.prod) {
  process.env.NODE_ENV = "production";
}
let PROD = process.env.NODE_ENV === "production";

// Configuration
const src = "src";
const config = {
  port: PROD ? 8080 : 3000,
  paths: {
    baseDir: PROD ? "build" : "dist",
    html: src + "/index.html",
    entry: src + "/index.js",
    js: src + "/**/*.js",
    test: src + "/**/test_*.js",
    css: src + "/**/*.scss",
    fonts: src + "/fonts/**/*"
  },
  sassIncludes: [].concat(bourbon).concat(bourbon_n)
};

// Browserify specific configuration
const b = browserify({
  entries: [config.paths.entry],
  debug: true,
  plugin: PROD ? [] : [watchify, hmr],
  cache: {},
  packageCache: {}
}).transform("babelify");
b.on("update", bundle_js);
b.on("log", log);

/**
 * Gulp Tasks
 **/

// Clears the contents of the dist and build folder
function clean() {
  return del(["dist/**/*", "build/**/*"]);
}

// Linting
function lint() {
  return gulp
    .src(config.paths.js)
    .pipe(eslint())
    .pipe(eslint.format());
}

// Unit tests
function test() {
  return gulp
    .src(config.paths.test, { read: false })
    .pipe(mocha({ reporter: "dot" }))
    .on("error", err => gulp.emit("end"));
}

// Copies our index.html file from the app folder to either the dist or build folder, depending on the node environment
function html() {
  return gulp
    .src(config.paths.html)
    .pipe(gulp.dest(config.paths.baseDir))
    .pipe(cond(!PROD, livereload()));
}

// Bundles our vendor and custom CSS. Sourcemaps are used in development, while minification is used in production.
function css() {
  return gulp
    .src(["node_modules/normalize.css/normalize.css", config.paths.css])
    .pipe(cond(!PROD, sourcemaps.init()))
    .pipe(
      sass({ includePaths: config.sassIncludes }).on("error", sass.logError)
    )
    .pipe(autoprefixer({ cascade: false }))
    .pipe(concat("bundle.css"))
    .pipe(cond(PROD, minifyCSS()))
    .pipe(cond(!PROD, sourcemaps.write()))
    .pipe(gulp.dest(config.paths.baseDir))
    .pipe(cond(!PROD, livereload()));
}

// Copies fonts into either the dist or build folder, depending on the node environment
function fonts() {
  return gulp
    .src([config.paths.fonts])
    .pipe(gulp.dest(config.paths.baseDir + "/fonts"));
}

// Runs an Express server defined in server.js
function server(done) {
  nodemon({
    script: "server.js"
  });
  done();
}

// Re-runs specific tasks when certain files are changed
function watch(done) {
  livereload.listen({ basePath: "dist" });
  gulp.watch(config.paths.html, html);
  gulp.watch(config.paths.css, css);
  gulp.watch(config.paths.js, gulp.series(lint, test));
  done();
}

// Default task, bundles the entire app and hosts it on an Express server
const default_build = gulp.series(
  clean,
  lint,
  test,
  html,
  css,
  bundle_js,
  fonts,
  gulp.parallel(server, watch)
);

// Bundles our JS using browserify. Sourcemaps are used in development, while minification is used in production.
function bundle_js() {
  return b
    .bundle()
    .on("error", log.bind(log, "Browserify Error"))
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(cond(PROD, terser()))
    .pipe(cond(!PROD, sourcemaps.init({ loadMaps: true })))
    .pipe(cond(!PROD, sourcemaps.write()))
    .pipe(gulp.dest(config.paths.baseDir));
}

exports.default = default_build;
exports.clean = clean;
exports.lint = lint;
exports.test = test;
exports.html = html;
exports.js = bundle_js;
exports.css = css;
exports.fonts = fonts;
exports.server = server;
exports.watch = watch;
