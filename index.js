var http = require('http');
var path = require('path');
var url = require('url');
var portscanner = require('portsacnner');
http.createServer(function(req, res) {
    var reqURL = req.url;
    var pathname = url.parse(reqURL).pathname;
    path.exists(pathname, function(exists) {
        if (!exists) {
            req.writeHead('404', {
                'Content-Type': 'text/plain'
            });
            req.write();
        }
    });
});
