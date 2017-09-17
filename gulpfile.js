'use strict';

var fs = require('fs')
  , pkg = require('./package.json')
  ;

var gulp = require('gulp')
  , glob = require('glob')
  , babelify = require('babelify')
  , browserify = require('browserify')
  , buffer = require('vinyl-buffer')
  , through = require('through2')
  , clean = require('gulp-clean')
  , env = require('gulp-env')
  , pump = require('pump')
  , rename = require('gulp-rename')
  , source = require('vinyl-source-stream')
  , uglify = require('gulp-uglify')
  , util = require('gulp-util')
  , sequence = require('run-sequence')
  , sourcemaps = require('gulp-sourcemaps')
  , tapColorize = require('tap-colorize')
  , tape = require('gulp-tape')
  , tapeRun = require('tape-run')
  ;


// -- [shared tasks]

gulp.task('env', function(done) {
  var dotenv_file = '.env';
  if (fs.existsSync(dotenv_file)) {
    return gulp.src(dotenv_file)
      .pipe(env({
        file: dotenv_file
      , type: '.ini'
      }));
  } else {
    return done();
  }
})

gulp.task('clean', function() {
  return gulp.src([
      './dist/*'
    , './tmp/build/**/*'
    , './coverage/*'
    ], {read: false})
    .pipe(clean());
});


// -- [build tasks]

var runBrowserify = function(inputFile, outputFile) {
  return function() {
    return browserify({
        entries: './src/' + inputFile
      , debug: false
      })
      .transform('babelify', {
        presets: ['es2015']
      , sourceMapsAbsolute: true
      })
      .bundle()
      .pipe(source(outputFile))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps: true
      }))
      .on('error', util.log)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist/'));
  };
};

var runMinify = function(filename) {
  return function() {
    return pump([
        gulp.src(['./dist/' + filename])
      , uglify()
      , rename({suffix: '.min'})
      , gulp.dest('./dist/')
      ]);
  };
};

var pkgName = pkg.name.split('/')[1];

gulp.task('build:browserify:index', ['env'],
  runBrowserify('index.js', pkgName + '.js'));
gulp.task('build:browserify:browser', ['env'],
  runBrowserify('browser.js', pkgName + '-browser.js'));

gulp.task('build:minify:index', ['env'],
  runMinify(pkgName + '.js'));
gulp.task('build:minify:browser', ['env'],
  runMinify(pkgName + '-browser.js'));

gulp.task('build:index', function(done) {
  return sequence('build:browserify:index', 'build:minify:index', done);
});

gulp.task('build:browser', function(done) {
  return sequence('build:browserify:browser', 'build:minify:browser', done);
});

gulp.task('build', ['build:index', 'build:browser']);


// -- [test tasks]

// unit test
gulp.task('test:unit:clean', function() {
  return gulp.src(['./tmp/build/test/unit-*.js'], {read: false})
    .pipe(clean());
});

gulp.task('test:unit:build', function() {
  return browserify({
      entries: './test/unit/index.js'
    , debug: true
    })
    .transform('babelify', {
      presets: ['es2015']
    , sourceMapsAbsolute: true
    })
    .bundle()
    .pipe(source('unit-test.js'))
    .pipe(buffer())
    .on('error', util.log)
    .pipe(gulp.dest('./tmp/build/test/'));
});

gulp.task('test:unit:run', function() {
  return gulp.src(['tmp/build/test/unit-test.js'])
    .pipe(tape({
      reporter: tapColorize()
    }));
});

gulp.task('test:unit', function(done) {
  return sequence('test:unit:clean', 'test:unit:build', 'test:unit:run', done);
});

// functional test
gulp.task('test:func:clean', function() {
  return gulp.src(['./tmp/build/test/func-*.js'], {read: false})
    .pipe(clean());
});

gulp.task('test:func:build', function() {
  return browserify({
      entries: glob.sync('./test/func/**/*.js')
    , debug: true
    })
    .transform('babelify', {
      presets: ['es2015']
    , sourceMapsAbsolute: true
    })
    .bundle()
    .pipe(source('func-test.js'))
    .pipe(buffer())
    .on('error', util.log)
    .pipe(gulp.dest('./tmp/build/test/'));
});

// run tests on electron (default)
gulp.task('test:func:run', function() {
  // same as:
  //   `cat ./tmp/build/test/func-test.js | ./node_modules/.bin/tape-run`
  var stream = function() {
    return through.obj(function(file, encoding, callback) {
      this.push(file.contents);
      return callback();
    });
  };
  return gulp.src([
      './tmp/build/test/func-*.js'
    ])
    .pipe(stream())
    .pipe(tapeRun())
    .on('error', util.log)
    .pipe(process.stdout);
});

gulp.task('test:func', function(done) {
  return sequence('test:func:clean', 'test:func:build', 'test:func:run');
});

gulp.task('test:clean', ['test:unit:clean', 'test:func:clean']);
gulp.task('test', ['test:unit', 'test:func']);


// -- [main tasks]

gulp.task('default', function(done) {
  var nodeEnv = process.env.NODE_ENV || 'production';
  console.log('» gulp:', nodeEnv);

  return sequence('clean', 'build', done);
});
