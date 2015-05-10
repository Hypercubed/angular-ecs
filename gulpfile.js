'use strict';

var gulp = require('gulp');

// plugins
var connect = require('gulp-connect'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	clean = require('gulp-clean'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	ngAnnotate = require('gulp-ng-annotate'),
	header = require('gulp-header'),
	karma = require('karma').server,
	bump = require('gulp-bump'),
	gulpDocs = require('gulp-ngdocs'),
	sourcemaps = require('gulp-sourcemaps'),
	git = require('gulp-git'),
	fs = require('fs'),
	runSequence = require('run-sequence'),
	babel = require('gulp-babel'),
  ghPages = require('gulp-gh-pages');

// options
var pkg = require('./package.json');
var banner = ['/**',
	' * <%= pkg.name %> - <%= pkg.description %>',
	' * @version v<%= pkg.version %>',
	' * @link <%= pkg.homepage %>',
	' * @author <%= pkg.author.name %> <<%= pkg.author.email %>>',
	' * @license <%= pkg.license %>',
	' */',
	''].join('\n');

var sourceFiles = ['src/'+pkg.name+'.js', 'src/**/*.js'];
var docFiles = ['docs-content/*.ngdoc', 'src/'+pkg.name+'.js', 'src/**/*.js'];
var distFile = './dist/'+pkg.name+'.js';
var minFile = './dist/'+pkg.name+'.min.js';

gulp.task('connect', ['ngdocs'], function () {
	connect.server({
		root: 'docs/',
		port: 8888,
		livereload: true
	});
});

gulp.task('watch', function () {
	gulp.watch(docFiles, ['ngdocs']);
});

gulp.task('clean', function() {
	gulp.src('./dist/*')
		.pipe(clean({force: true}));
});

gulp.task('lint', function() {
	return gulp.src(sourceFiles)
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'));
});

gulp.task('scripts-build', ['clean'], function() {
	return gulp.src(sourceFiles)
		.pipe(sourcemaps.init())
		.pipe(ngAnnotate({
			sourceMap: true,
			gulpWarnings: false
		}))
		.pipe(concat(pkg.name+'.js'))
		.pipe(babel())
		.pipe(header(banner, { pkg : pkg } ))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('scripts-min', ['scripts-build'], function() {
	return gulp.src(distFile)
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify().on('error', function(e) { console.log('\x07',e.message); return this.end(); }))
		.pipe(header(banner, { pkg : pkg } ))
		.pipe(gulp.dest('./dist/'));
});

gulp.task('test', function (done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, function(){
		done();
	});
});

gulp.task('test-dist', ['scripts-build'], function (done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true,
		files: [
			'bower_components/angular/angular.js',
			'bower_components/jquery/dist/jquery.js',
			'bower_components/angular-mocks/angular-mocks.js',
			'bower_components/js-signals/dist/signals.js',
			distFile,
			'test/spec/*.js'
		],
	}, function(){
		done();
	});
});

gulp.task('test-min', ['scripts-min'], function (done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true,
		files: [
			'bower_components/angular/angular.js',
			'bower_components/jquery/dist/jquery.js',
			'bower_components/angular-mocks/angular-mocks.js',
			'bower_components/js-signals/dist/signals.js',
			minFile,
			'test/spec/*.js'
		],
	}, function(){
		done();
	});
});

gulp.task('bump-version', function () {
	gulp.src('*.json')
		.pipe(bump())
		.pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
	return gulp.src('.')
		.pipe(git.commit('Version number', {quiet: false, args: '-a', disableAppendPaths: true}));
});

gulp.task('push-changes', function (cb) {
	git.push('origin', 'master', cb);
});

gulp.task('create-new-tag', function (cb) {
	function getPackageJsonVersion () {
		return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
	}

	var version = getPackageJsonVersion();
	git.tag(version, 'Created Tag for version: ' + version, function (error) {
		if (error) {
			return cb(error);
		}
		git.push('origin', 'master', {args: '--tags'}, cb);
	});

});

gulp.task('release', ['build'], function (callback) {
	runSequence(
		'bump-version',
		'commit-changes',
		'push-changes',
		'create-new-tag',
		function (error) {
			if (error) {
				console.log(error.message);
			} else {
				console.log('RELEASE FINISHED SUCCESSFULLY');
			}
			callback(error);
		});
	});

gulp.task('ngdocs', [], function () {
	return gulp.src(docFiles)
		.pipe(gulpDocs.process({
			html5Mode: false
		}))
		.pipe(gulp.dest('./docs'))
		.pipe(connect.reload());
});

gulp.task('deploy', ['ngdocs'], function() {
  return gulp.src('./docs/**/*')
    .pipe(ghPages());
});

gulp.task('build', ['clean', 'scripts-build', 'scripts-min']);

gulp.task('default', ['lint', 'test', 'build']);
