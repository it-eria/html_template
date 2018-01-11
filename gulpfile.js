/******************************************************
 * PATTERN LAB NODE
 * EDITION-NODE-GULP
 * The gulp wrapper around patternlab-node core, providing tasks to interact with the core library and move supporting frontend assets.
******************************************************/
var gulp = require('gulp'),
  path = require('path'),
  browserSync = require('browser-sync').create(),
  argv = require('minimist')(process.argv.slice(2)),
  wait = require('gulp-wait'),
  sourceMaps = require('gulp-sourcemaps'),
  autoprefixer = require('gulp-autoprefixer'),
  concat = require('gulp-concat'),
  rigger = require('gulp-rigger'),
  cleanCss = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  stringReplace = require('gulp-string-replace'),
  sass = require('gulp-sass');

function resolvePath(pathInput) {
  return path.resolve(pathInput).replace(/\\/g,"/");
}

/******************************************************
 * COPY TASKS - stream assets from source to destination
******************************************************/
// JS copy
gulp.task('pl-copy:js', function(){
  return gulp.src(resolvePath(paths().source.js) + '/*.js')
    .pipe(sourceMaps.init())
      .pipe(rigger())
      .pipe(rename({
        basename: 'functions',
        suffix: '.min'
      }))
    .pipe(sourceMaps.write())
    .pipe(gulp.dest(resolvePath(paths().public.js)));
});

// SASS Compilation
gulp.task("pl-sass", function() {
  return gulp.src(path.resolve(paths().source.scss, 'style.scss'))
    .pipe(wait(500))
    .pipe(sourceMaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(autoprefixer({
        browsers: ['last 3 versions'],
        cascade: false
      }))
    .pipe(sourceMaps.write())
    .pipe(gulp.dest(path.resolve(paths().source.css)));
});

// CSS Copy
gulp.task('pl-copy:css', function(){
  return gulp.src(resolvePath(paths().source.css) + '/*.css')
    .pipe(gulp.dest(resolvePath(paths().public.css)))
    .pipe(browserSync.stream());
});

gulp.task('pl-minimize:css', function(){
  return gulp.src(resolvePath(paths().public.css) + '/style.css')
    .pipe(cleanCss())
    .pipe(rename({
        basename: 'style',
        suffix: '.min'
    }))
    .pipe(gulp.dest(resolvePath(paths().public.css)))
    .pipe(browserSync.stream());
});

// Styleguide Copy everything but css
gulp.task('pl-copy:styleguide', function(){
  return gulp.src(resolvePath(paths().source.styleguide) + '/**/!(*.css)')
    .pipe(gulp.dest(resolvePath(paths().public.root)))
    .pipe(browserSync.stream());
});

// Change folder names to right
gulp.task('folders', function() {
  return gulp.src(['./**/*.html', './**/*.js', './**/*.min.js', './**/*.css', '!gulpfile.js', '!node_modules/**/*.*'])
    .pipe(stringReplace('styleguide/', 'Styleguide/'))
    .pipe(stringReplace('patterns/', 'Patterns/'))
    .pipe(stringReplace('n="patterns"', 'n="Patterns"'))
    .pipe(stringReplace('a="patterns"', 'a="Patterns"'))
    .pipe(stringReplace('"patterns"', '"Patterns"'))
    .pipe(gulp.dest(function(file) {
      return file.base;
    }));
});

// Styleguide Copy and flatten css
gulp.task('pl-copy:styleguide-css', function(){
  return gulp.src(resolvePath(paths().source.styleguide) + '/**/*.css')
    .pipe(gulp.dest(function(file){
      //flatten anything inside the styleguide into a single output dir per http://stackoverflow.com/a/34317320/1790362
      file.path = path.join(file.base, path.basename(file.path));
      return resolvePath(path.join(paths().public.styleguide, '/css'));
    }))
    .pipe(browserSync.stream());
});

gulp.task('pl-copy:patterns', function() {
   return gulp.src([
        resolvePath(paths().public.patterns) + '/05-Pages-01-Startseite-startseite/*.rendered.html',
        resolvePath(paths().public.patterns) + '/05-Pages-02-News-news/*.rendered.html',        
        resolvePath(paths().public.patterns) + '/05-Pages-03-News Detail-news-detail/*.rendered.html',        
        resolvePath(paths().public.patterns) + '/05-Pages-04-Formular-formular/*.rendered.html',        
        resolvePath(paths().public.patterns) + '/05-Pages-05-Suche-suche/*.rendered.html',        
      ])
    .pipe(rename(function(opt) {
      opt.basename = opt.basename.replace(/^\d{2}\-Pages\-\d{2}\-/, 'Page_');
      opt.basename = opt.basename.replace(/\-\w+/gi, '');
      opt.basename = opt.basename.replace(/\.rendered/, '');
      return opt;
    }))
    .pipe(stringReplace("&#x2F;", "/"))
    .pipe(stringReplace("../../", "typo3conf/ext/tmpl/Resources/Public/"))
    .pipe(gulp.dest('./'))
    .pipe(browserSync.stream()); 
});

/******************************************************
 * PATTERN LAB CONFIGURATION - API with core library
******************************************************/
//read all paths from our namespaced config file
var config = require('./patternlab-config.json'),
  patternlab = require('patternlab-node')(config);

function paths() {
  return config.paths;
}

function getConfiguredCleanOption() {
  return config.cleanPublic;
}

function build(done) {
  patternlab.build(done, getConfiguredCleanOption());
}

gulp.task('pl-assets', gulp.series(
  gulp.parallel(
    'pl-copy:js',
    gulp.series('pl-sass','pl-copy:css','pl-minimize:css', function(done){done();}),
    'pl-copy:styleguide',
    'pl-copy:styleguide-css'
  ),
  function(done){
    done();
  })
);

gulp.task('patternlab:version', function (done) {
  patternlab.version();
  done();
});

gulp.task('patternlab:help', function (done) {
  patternlab.help();
  done();
});

gulp.task('patternlab:patternsonly', function (done) {
  patternlab.patternsonly(done, getConfiguredCleanOption());
});

gulp.task('patternlab:liststarterkits', function (done) {
  patternlab.liststarterkits();
  done();
});

gulp.task('patternlab:loadstarterkit', function (done) {
  patternlab.loadstarterkit(argv.kit, argv.clean);
  done();
});

gulp.task('patternlab:build', gulp.series('pl-assets', build, 'pl-copy:patterns', function(done){
  done();
}));

gulp.task('patternlab:installplugin', function (done) {
  patternlab.installplugin(argv.plugin);
  done();
});

/******************************************************
 * SERVER AND WATCH TASKS
******************************************************/
// watch task utility functions
function getSupportedTemplateExtensions() {
  var engines = require('./node_modules/patternlab-node/core/lib/pattern_engines');
  return engines.getSupportedFileExtensions();
}
function getTemplateWatches() {
  return getSupportedTemplateExtensions().map(function (dotExtension) {
    return resolvePath(paths().source.patterns) + '/**/*' + dotExtension;
  });
}

// Reload Server
gulp.task('server:reload', function(done) {
  browserSync.reload();
  done();
});

function watch() {
  gulp.watch(path.resolve(paths().source.scss, '**/*.scss')).on('change', gulp.series('pl-sass'));
  gulp.watch(resolvePath(paths().source.css) + '/**/style.css', { awaitWriteFinish: true }).on('change', gulp.series('pl-copy:css', 'pl-minimize:css', 'server:reload'));
  gulp.watch(resolvePath(paths().source.styleguide) + '/**/*.*', { awaitWriteFinish: true }).on('change', gulp.series('pl-copy:styleguide', 'pl-copy:styleguide-css', 'server:reload'));
  gulp.watch(resolvePath(paths().source.js) + '/*.js', { awaitWriteFinish: true }).on('change', gulp.series('pl-copy:js', 'server:reload'));
  gulp.watch(resolvePath(paths().source.images) + '/*.*', { awaitWriteFinish: true }).on('change', gulp.series('server:reload'));

  var patternWatches = [
    resolvePath(paths().source.patterns) + '/**/*.json',
    resolvePath(paths().source.patterns) + '/**/*.mustache',
    resolvePath(paths().source.data) + '/**/*.json',
    resolvePath(paths().source.meta) + '/*',
    resolvePath(paths().source.annotations) + '/*'
  ].concat(getTemplateWatches());

  console.log(patternWatches);

  gulp.watch(patternWatches, { awaitWriteFinish: true }).on('change', gulp.series(build, 'server:reload'));
}

gulp.task('patternlab:connect', gulp.series(function(done) {
  browserSync.init({
    server: {
      baseDir: resolvePath(paths().public.root)
    },
    snippetOptions: {
      // Ignore all HTML files within the templates folder
      blacklist: ['/index.html', '/', '/?*']
    },
    notify: {
      styles: [
        'display: none',
        'padding: 15px',
        'font-family: sans-serif',
        'position: fixed',
        'font-size: 1em',
        'z-index: 9999',
        'bottom: 0px',
        'right: 0px',
        'border-top-left-radius: 5px',
        'background-color: #1B2032',
        'opacity: 0.4',
        'margin: 0',
        'color: white',
        'text-align: center'
      ]
    }
  }, function(){
    console.log('PATTERN LAB NODE WATCHING FOR CHANGES');
    done();
  });
}));

/******************************************************
 * COMPOUND TASKS
******************************************************/
gulp.task('default', gulp.series('patternlab:build', 'folders'));
gulp.task('patternlab:watch', gulp.series('patternlab:build', 'folders', watch));
gulp.task('patternlab:serve', gulp.series('patternlab:build', 'patternlab:connect', 'folders', watch));
