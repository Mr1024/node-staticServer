var fs = require('fs');
var path = require('path');
module.exports = function(pathname, res) {
    var reg = /^\/?(.*?)\/?$/;
    var pathname = pathname.replace(reg, "$1");
    var pathArry = pathname.split("/");
    var pathstr = pathArry.join("/");
    var filePath = path.join(process.cwd(), path.normalize(pathstr.replace(/\.\./g, '')));
    fs.readdir(filePath, function(err, files) {
        if (err) {
            pathArry.pop();
            do {
                var pathstr = pathArry.join("/");
                var filePath = path.join(process.cwd(), path.normalize(pathstr.replace(/\.\./g, '')));
                try {
                    fs.readdirSync(filePath);
                    res.writeHead(302, {
                        'Location': '/' + path.normalize(pathstr.replace(/\.\./g, ''))
                    });
                    res.end();
                    break;
                } catch (e) {
                    pathArry.pop();
                }
            } while (pathArry.length)
        } else {
            var currentDir = pathArry.pop();
            var parentDir = pathArry[pathArry.length - 1];
            var pathstr = pathArry.join("/");
            var htmlStr = '<!doctype html>' +
                '<html>' +
                '<head>' +
                '<meta charset="utf8">' +
                '<style></style>' +
                '</head>' +
                '<body>' +
                '<h1>Index of /' + currentDir + '</h1>' +
                (currentDir ? ('<h2><a target="_self" href="/' + pathstr + '">Parent Directory: ' + (pathArry.length > 0 ? parentDir : '/') + '</a></h2><ul>') : '<ul>');

            var htmlfooter = '</ul></body>' +
                '<html>';
            var filestr = [];
            files.forEach(function(value, index, array) {
                if (path.extname(value) != '') {
                    filestr.push('<li><a target="_self" href="/' + (parentDir ? (pathstr + '/') : '') + (currentDir ? (currentDir + '/') : '') + value + '">' + value + '</a></li>');
                } else {
                    filestr.unshift('<li><a target="_self" href="/' + (parentDir ? (pathstr + '/') : '') + (currentDir ? (currentDir + '/') : '') + value + '">' + value + '/</a></li>');
                }

            });
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(htmlStr + filestr.join("") + htmlfooter);
        }
    });
}
