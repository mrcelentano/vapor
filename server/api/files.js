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

if (process.env.HOSTED) {
  router.get('/', listS3Files);
} else {
  router.get('/', walkLocalFiles);  
}

module.exports = router;

var staticServer;

var validFilePattern = /\.(m4v|mov|webm|mp4|gif|jpg|png)$/i;
let thubsDir = 'client/assets/images/thumbs/';

function listS3Files(req, res) {
  var s3 = new AWS.S3();
  var params = {
    Bucket: process.env.BUCKET || 'vapor-vjapp',
    Prefix: 'video/'
  };
  var staticServer = process.env.FILE_ROOT || 'http://dk1ug69h7ixee.cloudfront.net/';
  s3.listObjects(params, function(err, data) {
    if (err) {
      console.error('error getting video list from s3', err);
    } else {
      res.json(200, data.Contents.map(function(object) {
        s3.listObjects({
          Bucket: params.Bucket,
          Prefix: 'images/thumbs/'
        }, function(err, data) {
          if (err) {
            console.error('error getting thumbnail list from s3', err);
          } else {
            //generateThumbnail();
          }
        })
        return staticServer + object.Key;
      }).filter(function(fileUrl) {
        return !! fileUrl.match(validFilePattern);
      }));
    }
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
      fs.exists(thubsDir + stat.name + '/tn.png', function(exists){
        if (! exists) {
          generateThumbnail({
            name: stat.name, 
            root: root
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

function generateThumbnail({name, root}) {
  if (name.match(/\.(m4v|mov|webm|mp4)$/)) {
    console.log('generating thumbnail: ', name);
    var proc = new ffmpeg(path.join(root, name))
      .screenshots({
        count: 1,
        size: '100x?',
        timemarks: [ '33%' ]
      }, thubsDir + name, function(err) {
        if (err) {
          console.error('error generating thumbnail', err);
        }
      });
  } else if (name.match(/.(gif|jpg|png)$/)) {
    fs.mkdirSync(`${thubsDir}${name}`);
    sharp(path.join(root, name)) //
      .resize(100)
      .toFile(`${thubsDir}${name}/tn.png`, (err, info) => {
        if (err) {
          console.error('failed to generate thum from image', err);
        } else {
          console.log('thumbnail generated', info);
        }
      });
  }
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
