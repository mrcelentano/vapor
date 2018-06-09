define(function(require) {

  var videoKeyChars = require('../videoKeyChars');

  var jwerty = require('jwerty');

  var Autopilot = function(config){
    // config must be passed play and stop;

    jwerty.key('tab', function(e) {
      pilot.tap();
      e.preventDefault();
    });
    $('#main').on('touchstart', function(e) {
      pilot.tap();
    });

    jwerty.key('`', function() {
      pilot.clearBmp();
    });

    jwerty.key('option+`', function(){
      $('.autopilot').toggleClass('hidden');
    });

    var maxLayers = 2;
    // set the max number of layers to play at once
    //var numbers = '1234567890'.split('').forEach(function(n) {
    //  jwerty.key(n, function() {
    //    maxLayers = n;
    //  });
    //});


    var lastTapTime,
      tapIntervals = [];
    var intervalId;
    var played = [];
    var playing = [];
    var intervalRate;
    var lastKey;

    var pilot = {
      screens: config.screens,
      interval: 5000,
      suffle: true,
      measure: 1,
      playlist: {}, // object with array for each screen.
      tap: function() {
        var tapTime = new Date().getTime();
        if (lastTapTime) {
          var interval = tapTime-lastTapTime;
          lastTapTime = tapTime;
        } else {
          lastTapTime = tapTime;
          return;
        }

        if (intervalRate && (interval) > intervalRate * 2) {
          pilot.clearBmp();
          return;
        }
        tapIntervals.push(interval);
        if (tapIntervals.length) {
          var sum = 0;
          tapIntervals.forEach(function(interval) {
            sum += interval;
          });
          intervalRate = sum/tapIntervals.length;

          $('.bpm').text(Math.round(60000/intervalRate));
          clearInterval(intervalId);
          intervalId = setInterval(pilot.playNext, intervalRate);
          pilot.playNext();
        }
      },
      clearBmp: function() {
        lastTapTime = undefined;
        tapIntervals = [];
        intervalRate = null;
        $('.bpm').text('');
        clearInterval(intervalId);
        pilot.screens.forEach(function(screen) {
          screen.$el.trigger('stopVideo', [_.last(played)]);
        });
      },
      playNext: function() {
        // TODO: make a little pulsing indicator.
        if (lastKey) {
          config.socket.emit('keyup', lastKey);
        }
        var keys = Object.keys(pilot.screens[0].videoKeyMap);
        var newKey = keys[_.random(0,keys.length-1)];
        
        config.socket.emit('keydown', newKey);
        lastKey = newKey;

        pilot.screens.forEach(function(screen){

          if (played.length >= Object.keys(config.screens[0].bank()).length * 2) {
            config.changeBank(parseInt(Math.random() * config.screens[0].banks.length));
            played = [];
          }

          if (playing.length >= maxLayers) {
            var videoToStop = playing[_.random(playing.length)];
            screen.$el.trigger('stopVideo', [videoToStop]);
            _.remove(playing, function(video) {
              return video === videoToStop;
            });
          }
          if (playing.length <= maxLayers) {
            screen.$el.trigger('startVideo', [newKey]);
            playing.push(newKey);
            played.push(newKey);
          }
        });


      },
      play: config.play,
      stop: config.stop
    };

    return pilot;
  }

  return Object.freeze(Autopilot);
});
