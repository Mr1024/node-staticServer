var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var portscanner = require('portscanner');
var mime = requrie('lib/mime.js');
http.createServer(function(req, res) {
    var reqURL = req.url;
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
            fs.readFile(filePath, 'binary', function(err, file) {
                if (err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.write(err);
                } else {
                    res.writeHead(200, {
                        'Content-Type': contentType
                    });
                    res.write(file, "binary");
                    res.end();
                }
            });
        }
    });
}).listen(3000);
