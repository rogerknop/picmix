// globals.js
// ========================

module.exports = {
    status : {
        ok: "OK",
        unknown: "ERROR: Unknown Format",
        mediaInfoNotFound: "ERROR: MediaInfo not found",
        exifNotFound: "ERROR: Exif not found",
        fileNotFound: "ERROR: File not found"
    },
    
    getFullPath: function(basePath, path) {
        if (basePath.substr(-1) != '/') basePath += '/';
        var fullPath = path.replace("./", basePath);
        fullPath = fullPath.replace(/\\\\/, "/");
        fullPath = fullPath.replace(/\\/, "/");
        return fullPath;
    }
}