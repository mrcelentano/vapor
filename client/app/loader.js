'use strict';

define(function(require) {

  var $ = require('jquery');

  function loader () {
    var $el = $('.loader');
    var count = 0;
    var bankSize;

    return {
      update: function(i) {
        count = count+i;
        $el.css('width',
          count == bankSize ?
            0 :
          (count / bankSize * 100) + '%'
        );
      },
      reset: function(bank) {
        bankSize = Object.keys(bank).length;
        count = 0;
      },
      finish: function() {
        $el.width(0);
      }
    }
  }

  return loader();
});