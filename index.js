#!/usr/bin/env node

var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var open = require('open');
var zlib = require('zlib');
var portscanner = require('portscanner');
var program = require('commander');
var mime = require('./lib/mime').types;
var package = require('./package.json');
var showDir = require('./lib/showDir');
var config = require('./lib/config');
program.version(package.version).option('-d, --dev', 'launch a server in the development mode').option('-p, --port [port]', 'set a server listening port').parse(process.argv);
var httpserver = http.createServer(function(req, res) {
    var reqURL = req.url;
    var reqHeader = req.headers;
    var pathname = url.parse(reqURL).pathname;
    pathname = pathname.slice(-1) === "/" ? (program.dev ? pathname : (pathname + config.Welcome.file)) : pathname;
    var filePath = path.join(process.cwd(), path.normalize(pathname.replace(/\.\./g, '')));
    var ext = path.extname(pathname);
    if (program.dev && !ext) {
        showDir(pathname, res);
    } else {
        ext = ext ? ext.slice(1) : 'unknown';
        var contentType = mime[ext] || "text/plain";
        fs.exists(filePath, function(exists) {
            if (!exists) {
                if (program.dev) {
                    res.writeHead(302, {
                        'Location': path.dirname(pathname)
                    });
                    res.end();
                } else {
                    res.writeHead(404, {
                        'Content-Type': 'text/plain'
                    });
                    res.write('This request  URL ' + pathname + ' was not found');
                    res.end();
                }

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
                            if (!program.dev) {
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

                                }
                            } else {
                                console.info('%s %s', req.method, req.url);
                                res.writeHead(200, {
                                    'Content-Type': contentType
                                });
                                raw.pipe(res);
                            }

                            raw.on('error', function() {
                                res.writeHead(500, {
                                    'Content-Type': 'text/plain'
                                });
                                res.end(err);
                            });
                        }
                    }

                });
            }
        });
    }

});

if (program.port) {
    var portnum = true === program.port? 3000:Number(program.port);
    portscanner.checkPortStatus(portnum, '127.0.0.1', function(error, status) {
        if (!error) {
            if (status == 'closed') {
                httpserver.listen(portnum);
                var target = 'http://localhost:' + portnum + '/index.html';
                open(target);
                console.log('start server listen the ' + portnum + ' port');
            } else {
                console.log('%port is in use now , please try to change other port or do not set parameter -p', portnum);
            }
        } else {
            console.err(error)
        }
    })
} else {
    portscanner.findAPortNotInUse(3000, 6000, '127.0.0.1', function(error, port) {
        if (!error) {
            httpserver.listen(port);
            var target = 'http://localhost:' + port + '/index.html';
            open(target);
            console.log('start server listen the ' + port + ' port');
        }
    });
}
