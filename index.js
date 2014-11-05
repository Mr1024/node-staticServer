var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var zlib = require('zlib');
var portscanner = require('portscanner');
var mime = require('./lib/mime');
var config = require('./lib/config');
http.createServer(function(req, res) {
    var reqURL = req.url;
    var reqHeader = req.headers;
    var pathname = url.parse(reqURL).pathname;
    var filePath = process.cwd() + pathname;
    var ext = path.extname(pathname);
    ext = ext ? ext.slice(1) : 'unknown';
    var contentType = mime[ext] || "text/plain";
    fs.exists(filePath, function(exists) {
        if (!exists) {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            res.write('This request  URL ' + pathname + ' was not found');
            res.end();
        } else {
            fs.stat(filePath, function(err, stat) {
                if (!err) {
                    var raw = fs.createReadStream(filePath);
                    var acceptEncoding = reqHeader['accept-encoding'] || "";
                    var matched = ext.match(config.Compress.match);
                    var lastModified = stat.mtime.toUTCString();
                    res.setHeader('Last-Modified', lastModified);
                    if (reqHeader['ifModifiedSince'] && lastModified == reqHeader['ifModifiedSince']) {
                        res.writeHead(304, "Not Modified");
                    } else {
                        if (ext.match(config.Expires.fileMatch)) {
                            var expires = new Date();
                            expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
                            res.setHeader("Expires", expires.toUTCString());
                            res.setHeader('Cache-Control', "max-age=" + config.Expires.maxAge);
                        }
                        if (matched && acceptEncoding.match(/\bgzip\b/)) {
                            res.writeHead(200, "Ok", {
                                'Content-Encoding': 'gzip'
                            });
                            raw.pipe(zlib.createGzip()).pipe(res);
                        } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
                            res.writeHead(200, "Ok", {
                                'Content-Encoding': 'deflate'
                            });
                            raw.pipe(zlib.createDeflate()).pipe(res);
                        } else {
                            res.writeHead(200, {
                                'Content-Type': contentType
                            });
                            raw.pipe(res);
                        }
                        raw.on('error',function() {
                            res.writeHead(500, {
                                'Content-Type': 'text/plain'
                            });
                            res.end(err);
                        });
                    }
                }

            });
            /*var raw = fs.createReadStream(filePath);
            var acceptEncoding = reqHeader['accept-encoding'] || "";
            var matched = ext.match(config.Compress.match);
            if (matched && acceptEncoding.match(/\bgzip\b/)) {
                res.writeHead(200, "Ok", {
                    'Content-Encoding': 'gzip'
                });
                raw.pipe(zlib.createGzip()).pipe(res);
            } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
                res.writeHead(200, "Ok", {
                    'Content-Encoding': 'deflate'
                });
                raw.pipe(zlib.createDeflate()).pipe(res);
            } else {
                res.writeHead(200, "Ok");
                raw.pipe(res);
            }
            raw.on('error', function()function() {
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                res.end(err);
            });
            fs.readFile(filePath, 'binary', function(err, file) {
                if (err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.end(err);
                } else {
                    fs.stat(filePath, function(err, stat) {
                        var lastModified = stat.mtime.toUTCString();
                        res.setHeader('Last-Modified', lastModified);
                        if (reqHeader['ifModifiedSince'] && lastModified == reqHeader['ifModifiedSince']) {
                            res.writeHead(304, "Not Modified");
                        } else {
                            if (ext.match(config.Expires.fileMatch)) {
                                var expires = new Date();
                                expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
                                res.setHeader("Expires", expires.toUTCString());
                                res.setHeader('Cache-Control', "max-age=" + config.Expires.maxAge);
                            }
                            res.writeHead(200, {
                                'Content-Type': contentType
                            });
                            res.write(file, "binary");
                        }
                        res.end();
                    });
                }
            });*/
        }
    });
}).listen(3000);
