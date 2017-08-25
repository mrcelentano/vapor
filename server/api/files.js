'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var walk    = require('walk');
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var AWS = require('aws-sdk');
const sharp = require('sharp');

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

      let thubsDir = 'client/assets/images/thumbs/';
      // generate a thumbnail.
      fs.exists(thubsDir + stat.name + '/tn.png', function(exists){
        if (! exists) {
          if (stat.name.match(/\.(m4v|mov|webm|mp4)$/)) {
            console.log('generating thumbnail: ', stat.name);

            var proc = new ffmpeg(path.join(root, stat.name))
              .screenshots({
                count: 1,
                size: '100x?',
                timemarks: [ '33%' ]
              }, thubsDir + stat.name, function(err) {
                if (err) {
                  console.error('error generating thumbnail', err);
                }
              });
          } else if (stat.name.match(/.(gif|jpg|png)$/)) {
            fs.mkdirSync(`${thubsDir}${stat.name}`);
            sharp(path.join(root, stat.name)) //
              .resize(100)
              .toFile(`${thubsDir}${stat.name}/tn.png`, (err, info) => {
                if (err) {
                  console.error('failed to generate thum from image', err);
                } else {
                  console.log('thumbnail generated', info);
                }
              });
          }
          
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
