// fileinfo.js
// ========================

const Globals = require('./globals');

const fs = require('fs-extra')
const Mediainfo = require('mediainfo-wrapper');
const ExifImage = require('exif').ExifImage;
const exifr = require('exifr');

module.exports = {
    //****************************************************************************************************
    getFileInfo: async function(collectionname, filename) {    
        var fileInfo = {};
        
        if ((Globals.existingFileData[collectionname] !== undefined) && (Globals.existingFileData[collectionname][filename] !== undefined)) {
            fileInfo = Globals.existingFileData[collectionname][filename];
        }
        else {
            fileInfo = {
                UseDateTaken: false,
                Status: Globals.status.fileNotFound,
                Filename: filename,
                Found: false,
                Format: "",
                DateTaken: "",
                ComputedTimestamp: ""
            };
        }
        
        if (fileInfo.debug) {
            debugger;
        }
        
        if (!fs.existsSync(filename)) {
            fileInfo.Status = Globals.status.fileNotFound;
            return fileInfo;
        }
        
        var mediaInfo;
        try {
            mediaInfo = await Mediainfo(filename);
            mediaInfo = mediaInfo[0];
        } catch (error) {
            console.log('Rogi Error: ' + error.message);
            fileInfo.Status = Globals.status.mediaInfoNotFound;
            return fileInfo;
        }

        if (fileInfo.UseDateTaken) {
            fileInfo.Status = Globals.status.ok;
            return fileInfo;
        }

        if (mediaInfo && mediaInfo.general && mediaInfo.general.commercial_name && mediaInfo.general.commercial_name[0]) {
            fileInfo.Format = mediaInfo.general.commercial_name[0].toUpperCase();
        }

        if (fileInfo.Format == "") {
            fileInfo.Status = Globals.status.mediaInfoNotFound;
            return fileInfo;
        }

        fileInfo.Found = true;
        fileInfo.Status = Globals.status.ok;
        
        try {
            if ((fileInfo.Format == "MPEG-4") || (fileInfo.Format == "MOV")) {
                    return getDefaultInfo(mediaInfo, fileInfo);
            }
            
            if (fileInfo.Format == "JPEG") {
                return getJpegInfo(mediaInfo, fileInfo);
            }    
            
            if (fileInfo.Format == "HEIC") {
                return getHeicInfo(mediaInfo, fileInfo);
            }    
            
            if (fileInfo.Format == "GIF") {
                return getGifInfo(mediaInfo, fileInfo);
            }    
            
            if (fileInfo.Format == "BDAV") {
                return getBdavInfo(mediaInfo, fileInfo);
            }
        }
        catch (e) {
            var msg = e.message ? e.message : e;
            fileInfo.Status = Globals.status.formatReadDateException + " " + fileInfo.Format + " / Meldung: " + msg;
            return fileInfo;
        }

        fileInfo.Status = Globals.status.unknown + " " + fileInfo.Format;
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
function globalTimestampChecks(fileInfo) {
    // Format yyyy:mm:dd ändern in yyyy-mm-dd
    if (fileInfo.DateTaken) { 
        fileInfo.DateTaken = fileInfo.DateTaken.replace(/(\d{4}):(\d{2}):(\d{2})/g, '$1-$2-$3')
    }
    
    return fileInfo;
}

//****************************************************************************************************
function getDefaultInfo(mediaInfo, fileInfo) {
    if ((mediaInfo.video) && (mediaInfo.video[0]) && (mediaInfo.video[0].encoded_date)) {
        if (mediaInfo.video[0].encoded_date instanceof Array) {
            fileInfo.DateTaken = mediaInfo.video[0].encoded_date[0];
        }
        else {
            fileInfo.DateTaken = mediaInfo.video[0].encoded_date;
        }

        fileInfo.DateTaken = fileInfo.DateTaken.replace("UTC ", "");
    }
    else {
        fileInfo.Status = Globals.status.timstampNotFound
    }           
    return globalTimestampChecks(fileInfo);
}

//****************************************************************************************************
async function getJpegInfo(mediaInfo, fileInfo) {
    var exifData = await getExif(fileInfo.Filename);
    if (!exifData) {
        fileInfo.Status = Globals.status.exifNotFound;
    }
    else {
        if (!exifData.exif.DateTimeOriginal) {
            fileInfo.Status = Globals.status.exifDateTimeNotFound;
        }
        else { 
            fileInfo.DateTaken = exifData.exif.DateTimeOriginal;


        }
    }
    return globalTimestampChecks(fileInfo);
}

//****************************************************************************************************
async function getHeicInfo(mediaInfo, fileInfo) {
    var exifData = await getExifr(fileInfo.Filename);
    if (!exifData) {
        fileInfo.Status = Globals.status.exifNotFound;
    }
    else {
        if (!exifData.DateTimeOriginal) {
            fileInfo.Status = Globals.status.exifDateTimeNotFound;
        }
        else { 
            fileInfo.DateTaken = exifData.DateTimeOriginal.toISOString();
        }
    }

    return globalTimestampChecks(fileInfo);
}

//****************************************************************************************************
function getGifInfo(mediaInfo, fileInfo) {
    fileInfo.DateTaken = mediaInfo.general.file_last_modification_date[0];
    return globalTimestampChecks(fileInfo);
}

//****************************************************************************************************
function getBdavInfo(mediaInfo, fileInfo) {
    fileInfo.DateTaken = mediaInfo.general.file_last_modification_date;
    return globalTimestampChecks(fileInfo);
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

//****************************************************************************************************
async function getExifr(filename) {
    let exifPromise = new Promise((resolve, reject) => {
        try {
            exifr.parse(filename)
            .then(exifData => {
              resolve(exifData);
          });
        } catch (error) {
            console.log('Error: ' + error.message);
            reject(null);
        }    
    });
    
    let exifData = await exifPromise; // wait until the promise resolves (*)
    return exifData;
}