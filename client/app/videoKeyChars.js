define(function(require) {
  var videoKeyChars = ('qwertyuiopasdfghjkl;zxcvbnm'.split('')).concat(['comma','.','forward-slash']);
  return Object.freeze(videoKeyChars);
});