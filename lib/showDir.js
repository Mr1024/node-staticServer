var fs = require('fs');
var path = require('path');
module.exports = function(pathname, res) {
    var reg = /^\/?(.*?)\/?$/;
    var pathname = pathname.replace(reg, "$1");
    var pathArry = pathname.split("/");
    while (pathArry.length) {
        var pathstr = pathArry.join("/");
        var filePath = path.join(process.cwd(), path.normalize(pathstr.replace(/\.\./g, '')));
        try {
            var files = fs.readdirSync(filePath);
            console.log(files);
            break;
        } catch (e) {
            pathArry.pop();
        }
    }
}
