define(function(require) {
  var Bank = function(_config){
    var config = {
      videoKeyChars: _config.videoKeyChars
    };
    var bank = {
      keys: function(newKeys) {
      }
    };

    return bank;
  };
  return Object.freeze(Bank);
});