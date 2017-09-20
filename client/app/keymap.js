define(function(require){
  require('jquery-keymap');
  require('jwerty');
  var _ = require('underscore');
  var Screens = require('Screens/Screens');

  var $keymap = $('.keymap').keymap({
    layout: 'mac_laptop'
  });

  jwerty.key('option+k', function(){
    $keymap.toggleClass('hidden')
      .find('.keymap-key')
        .removeClass('down');
    keymap.hidden = $keymap.hasClass('hidden');
  });

  var keymap = {
    $el: $keymap,
    render: function(options) {
      keymap.$el.keymap({
        type: 'reset'
      });
      var videoKeyMap = options.videoKeyMap || {};
      var banks = options.banks || [];
      keymap.renderBanks(banks);
      Object.keys(videoKeyMap).forEach(function(key) {
        keymap.setVideoKey(videoKeyMap[key], key);
      });
    },
    clear: function() {
      $('.keymap-key').css('background-image', '')
        .removeClass('populated');
    },
    renderBanks: function() {
      var banks = Screens.current.banks
      $('.keymap-key').removeClass('populated selected');
      Object.keys(banks).forEach(function(key) {
        if (Object.keys(banks[key]).length) {
          $('[data-value="' + key + '"]', keymap.$el).addClass('populated');
        }
      });
      $('[data-value="' + Screens.current.currentBankIndex + '"]', keymap.$el).addClass('selected');
    },
    setVideoKey: function($video, key) {
      var url = typeof $video === 'string' ? $video : $video.attr('src');
      var _key = key;
      switch (key) {
        case 'comma':
          _key = ',';
          break;
        case 'forward-slash':
          _key = '/';
          break;
      };

      // check if the file is local or on the server
      var thumbUrl = (url.indexOf('/assets/video/') !== -1) ?
        '/assets/images/thumbs/' + encodeURI(_.last(url.split('/'))) + '/tn.png' :
        url.replace(/\/video\//, '/thumbnails/video/').replace(/\.\w+$/, '.jpg');

      $('[data-value="' + _key + '"]', keymap.$el)
        .css('background-image', 'url("' + thumbUrl + '")');
    },
    keydown: function(key) {
      if (!keymap.hidden )
        $keymap.find('[data-value="' + key + '"]').addClass('down');
    },
    keyup: function(key) {
      if (! keymap.hidden)
        $keymap.find('[data-value="' + key + '"]').removeClass('down');
    }
  };

  return keymap;
});