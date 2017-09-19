'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var walk    = require('walk');
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var AWS = require('aws-sdk');
if ( ! process.env.HOSTED ) {
  const sharp = require('sharp');  
}

if (process.env.HOSTED) {
  router.get('/', listS3Files);
} else {
  router.get('/', walkLocalFiles);  
}

var bucketName = process.env.BUCKET || 'vapor-vjapp';
module.exports = router;

var staticServer;

var validFilePattern = /\.(m4v|mov|webm|mp4|gif|jpg|png)$/i;
let thubsDir =  /* process.env.HOSTED ? 'images/thumbs/' : */ 'client/assets/images/thumbs/';

function listS3Files(req, res) {
  var s3 = new AWS.S3();
  var params = {
    Bucket: bucketName,
    Prefix: 'video/'
  };
  var staticServer = process.env.FILE_ROOT || 'http://dk1ug69h7ixee.cloudfront.net/';
  s3.listObjects(params, function(err, videoFilesData) {
    if (err) {
      console.error('error getting video list from s3', err);
    } else {

      let videoFiles = videoFilesData.Contents.filter(function(object) {
        return !! object.Key.match(object.Key);
      });

      res.json(200, videoFiles.map(function(object) {
        return staticServer + object.Key;
      }));

	return;

      console.log('generating thumbs');

      // check thumbnails, generate missing ones.
      s3.listObjects({
        Bucket: params.Bucket,
        Prefix: 'images/thumbs/'
      }, function(err, thumbsData) {
        if (err) {
          console.error('error getting thumbnail list from s3', err);
        } else {
          console.log('thumbs', videoFilesData, thumbsData);
          _.difference(videoFiles.map(function(fileObject) {
              return fileObject.Key.replace(videoFilesData.Prefix, thumbsData.Prefix)
            }), thumbsData.Contents.map(function(fileObject) {
              return fileObject.Key;
          })).forEach(function (missingThumb) {

            generateThumbnail({name: missingThumb});
          });
        }
      })

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
      .on('end', function() {
        //console.log('Screenshots taken');
        if (process.env.HOSTED) {
          // upload file to s3 and delete.
          fs.unlink(thubsDir + name);
        }
      })
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
    
    if (0) { // (process.env.HOSTED) {
      var s3Bucket = new AWS.S3({params: {
       Bucket: bucketName,
      }});
      var thumb = sharp(path.join(name))
      .resize(100);
      s3Bucket.upload({
        Key: '/images/thumbs' + name,
        Body: thumb
      });
    } else {
      let _name = name.replace(/\//g, '_');
      fs.mkdirSync(`${thubsDir}${_name}`);
      var thumb = sharp(path.join(root, name))
        .resize(100)
        .toFile(`${thubsDir}${_name}/tn.png`, (err, info) => {
          if (err) {
            console.error('failed to generate thum from image', err);
          } else {
            console.log('thumbnail generated', info);
          }
      });
    }
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
