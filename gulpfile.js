var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var files = ["./*.html", "./js/*.js", "./css/*.css","./scss/*.scss"];

// Static server
gulp.task('browser-sync', ['sass'], function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch(files,['sass']).on('change', browserSync.reload);
});

gulp.task('sass', function(){
  return gulp.src('scss/main.scss')
    .pipe(sass())
    .pipe(gulp.dest('css'))
});