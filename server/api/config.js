// config
'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');

// get IP address
var os=require('os');
var ifaces=os.networkInterfaces();
var ip;

router.get('/', function(req, res) {

  var config = {};
  var varsToPass = [
    'FILE_SOURCE'
  ];
  varsToPass.forEach(function (varName) {
    config[varName] = process.env[varName];
  });

  res.json(200, files);
});


module.exports = router;

// TODO: hash all the files and store their thumbnail.
