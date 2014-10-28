/**
 * @param  {Grunt} grunt
 */
module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      main: {
        files: {
          'bin/minjector.min.js': ['src/minjector.js']
        },
        options: {
          'screw-ie8': true,
          'mangle': {
            'sort': true,
            'toplevel': true
          },
          'compress': true,
          'lint': true
        }
      }
    },

    exec: {
      rmgzip: {
        command: 'rm bin/minjector.min.js.gz'
      },
      gzip: {
        command: '7z a -aoa -tgzip bin/minjector.min.js.gz bin/minjector.min.js'
      }
    },

    watch: {
      configFiles: {
        files: ['Gruntfile.js'],
        options: {
          reload: true
        }
      },
      options: {
        livereload: {
          port: 35732
        }
      },
      files: [
        'tests/specs/MinjectorSpec.js',
        'src/minjector.js'
        // 'bin/jsx.js'
      ],
      tasks: [
        'uglify',
        'exec:rmgzip',
        'exec:gzip'
      ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('compile', ['uglify', 'exec']);

};
