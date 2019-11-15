// collection.js
// ========================

const Globals = require('./globals');
var recursive = require("recursive-readdir");
const FileInfo = require('./fileinfo');

class Collection {
    //****************************************************************************************************
    constructor(basePath, path) {
        this.path = Globals.getFullPath(basePath, path);
        this.files = [];
        this.fileInfos = [];
        this.fileCount = 0;
    }

    //****************************************************************************************************
    async readCollection() {
        this.files = await getAllFiles(this.path);
        this.fileCount = this.files.length;
        return this;
    }

    //****************************************************************************************************
    async analyzeCollection(progressbar, doneBefore) {
        var done = doneBefore;
        for (const file of this.files) {
            var fileInfo = await FileInfo.getFileInfo(file);
            this.fileInfos.push(fileInfo);
            progressbar.update(++done);
        }  
        
        /* for (const file of this.files) {
            var fileInfo = await FileInfo.getFileInfo(file);
            if (fileInfo.found) {
                // ToDo: ExifDevice and Namen anhängen & Timezone setzen 
                //collectionConfig.
                break;
            }
        } */          
    }


    //****************************************************************************************************
    getFiles() {
        return this.files;
    }
    
}

//****************************************************************************************************
// Local Functions
async function getAllFiles(path) {
    let getDirRecursivePromise = new Promise((resolve, reject) => {
        recursive(path, function (err, files) {
            // `files` is an array of file paths
            resolve(files);
        });
    });
    let files = await getDirRecursivePromise; // wait until the promise resolves (*)
    return files;
}

module.exports = Collection

