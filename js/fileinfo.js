// fileinfo.js
// ========================

const Globals = require('./globals');

const Mediainfo = require('mediainfo-wrapper');
const ExifImage = require('exif').ExifImage;


module.exports = {
    //****************************************************************************************************
    getFileInfo: async function(filename) {    
        var mediaInfo;

        try {
            mediaInfo = await Mediainfo(filename);
            mediaInfo = mediaInfo[0];
        } catch (error) {
            console.log('Rogi Error: ' + error.message);
        }

        var fileInfo = {
            status: Globals.status.fileNotFound,
            filename: filename,
            found: false,
            format: ""
        };

        if (mediaInfo && mediaInfo.general && mediaInfo.general.commercial_name && mediaInfo.general.commercial_name[0]) {
            fileInfo.format = mediaInfo.general.commercial_name[0];
        }

        if (fileInfo.format == "") {
            fileInfo.status = Globals.status.mediaInfoNotFound;
            return fileInfo;
        }

        fileInfo.found = true;
        fileInfo.status = Globals.status.ok;
        
        if ((fileInfo.format == "MPEG-4") || (fileInfo.format == "MOV")) {
            return getDefaultInfo(mediaInfo, fileInfo);
        }

        if (fileInfo.format == "JPEG") {
            return getJpegInfo(mediaInfo, fileInfo);
        }    

        if (fileInfo.format == "BDAV") {
            return getBdavInfo(mediaInfo, fileInfo);
        }

        fileInfo.status = Globals.status.unknown + " " + fileInfo.format;
        return fileInfo;
    },

    //****************************************************************************************************
    debugInfos : function(fileInfo) {
        //var d = new Date(datestring);
        //console.log(format + " / " + datestring + " / " + d.toUTCString());
        console.log("FileInfo: " + JSON.stringify(fileInfo, null, 2));
    }
};

//****************************************************************************************************
// Local Functions
  
//****************************************************************************************************
function getDefaultInfo(mediaInfo, fileInfo) {
    fileInfo.dateTaken = mediaInfo.video[0].encoded_date;
    return fileInfo;
}

//****************************************************************************************************
async function getJpegInfo(mediaInfo, fileInfo) {
    var exifData = await getExif(fileInfo.filename);
    if (!exifData) {
        fileInfo.status = Globals.status.exifNotFound;
    }
    else {
        fileInfo.dateTaken = exifData.exif.DateTimeOriginal;
    }
    return fileInfo;
}

//****************************************************************************************************
function getBdavInfo(mediaInfo, fileInfo) {
    fileInfo.dateTaken = mediaInfo.general.file_last_modification_date;
    return fileInfo;
}

//****************************************************************************************************
async function getExif(filename) {
    let exifPromise = new Promise((resolve, reject) => {
        try {
            new ExifImage({ image : filename }, function (error, exifData) {
                if (error) {
                    //console.log('Error: '+error.message);
                    resolve(null);
                }
                else {
                    resolve(exifData);
                }
            });
        } catch (error) {
            console.log('Error: ' + error.message);
            reject(null);
        }    
    });
    
    let exifData = await exifPromise; // wait until the promise resolves (*)
    return exifData;
}