require.config({
  waitSeconds: 1,
  baseUrl: 'app',
  shim: {
    $: {
      exports: '$'
    },
    jquery: {
      exports: '$'
    },
    jwerty: {
      deps: ['jquery'],
      exports: 'jwerty'
    },
    'underscore': {
      exports: '_'
    },
    capslockstate: {
      deps: ['jquery']
    },
    'jquery-keymap': {
      deps: ['jquery']
    }
  },
  paths: {
    jquery: '../bower_components/jquery/dist/jquery',
    '$': '../bower_components/jquery/dist/jquery',
    "socket.io": '/socket.io/socket.io',
    jwerty: '../bower_components/jwerty/jwerty',
    underscore: '../bower_components/lodash/dist/lodash',
    capslockstate: '../components/jquery.capslockstate',
    'jquery-keymap': '../components/jquery-keymap/keymap'
  }
});
require(['./app']);
