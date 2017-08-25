'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var walk    = require('walk');
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var AWS = require('aws-sdk');

router.get('/', walkLocalFiles); //walkLocalFiles

module.exports = router;

var staticServer;

var validFilePattern = /\.(m4v|mov|webm|mp4|gif|jpg|png)$/i;

function listS3Files(req, res) {
  var s3 = new AWS.S3();
  var params = {
    Bucket: process.env.BUCKET || 'vapor-vjapp'
  };
  var staticServer = process.env.FILE_ROOT || 'http://dk1ug69h7ixee.cloudfront.net/';
  s3.listObjects(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     res.json(200, data.Contents.map(function(object) {
      return staticServer + object.Key;
    }).filter(function(fileUrl) {
      return !! fileUrl.match(validFilePattern);
    }));
  });
}

function walkLocalFiles(req, res) {

  var files   = [];

  // Walker options
  var walker  = walk.walk('client/assets/video', { followLinks: false });
  walker.on('file', function(root, stat, next) {

    staticServer = 'http://' + getIpAddress() + ':8080/';

    // Add this file to the list of files
    if (stat.name.match(validFilePattern)) {
      files.push(root.replace(/^client\//, staticServer) + '/' + stat.name);

      // generate a thumbnail.
      fs.exists('client/assets/images/thumbs/' + stat.name + '/tn.png', function(exists){
        if (! exists && stat.name.match(/\.(mpg|mp4|m4v)$/)) {
          console.log('generating thumbnail: ', stat.name);
          var proc = new ffmpeg(path.join(root, stat.name))
            .screenshots({
              count: 1,
              size: '100x?',
              timemarks: [ '33%' ]
            }, 'client/assets/images/thumbs/' + stat.name, function(err) {
              if (err) {
                console.error('error generating thumbnail', err);
              }
            });
        }
      });
    }
    next();
  });

  walker.on('end', function() {
    res.json(200, files);
  });
}

function getIpAddress() {
  // get IP address
  var os=require('os');
  var ifaces=os.networkInterfaces();
  var ip;
  Object.keys(ifaces).forEach(function(dev) {
    ifaces[dev].forEach(function(details) {
      if (details.family=='IPv4') {
        ip = details.address;
      }
    });
  });
  return ip;
}
