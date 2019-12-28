// globals.js
// ========================

const fs = require('fs-extra')


module.exports = {
    existingCollectionData: [],
    existingFileData: [],

    status : {
        ok: "OK",
        unknown: "ERROR: Unknown Format",
        formatReadDateException: "ERROR: Reading date from ",
        timstampNotFound: "ERROR: Timestamp not found as expected",
        mediaInfoNotFound: "ERROR: MediaInfo not found",
        exifNotFound: "ERROR: Exif not found",
        fileNotFound: "ERROR: File not found",
        dateNotValid: "ERROR: DateTaken Timestamp not valid"
    },

    template : {
        "Name": "Test Urlaub",
        "Base_Directory": "C:/FotoMix",
        "Output_Timezone": "CET",
        "Output_Mix_Path": "./mix",
        "Mix_Praefix": "TestMix_"
    },
    
    NewEvent: "<< Neue Konfiguration anlegen >>",

    getFullPath: function(basePath, path) {
        if (basePath.substr(-1) != '/') basePath += '/';
        var fullPath = path.replace("./", basePath);
        fullPath = fullPath.replace(/\\\\/, "/");
        fullPath = fullPath.replace(/\\/, "/");
        return fullPath;
    },

    appConfigFile: './config/appconfig.json',

    readAppConfig : function() {
        var appConfig;
        if (fs.existsSync(this.appConfigFile)) {
            appConfig = JSON.parse(fs.readFileSync(this.appConfigFile),'UTF8');
        }
        else {
            appConfig = 
            {
                LastName: "Test Event"
            }
        }
        return appConfig;
    },

    writeAppConfig : function(appconfig) {
        //Write to file config/appconfig.json 
        var file = "./config/appconfig.json";
        var newAppConfigString = JSON.stringify(appconfig, null, "  ");
        fs.writeFile(file, newAppConfigString, function(err) {
            if(err) {
                return console.log(err);
            }
        }); 
    },

    readEventControlExists : function(name) {
        var file = "./data/" + name + "-control.json";
        if (fs.existsSync(file)) {
            return true;
        }
        else {
            return false;
        }        
    },

    getAllEvents: function(includeNew) {
        var allEvents = [];
        if (includeNew) { allEvents.push(this.NewEvent); }
        fs.readdirSync('./data/').filter(function(file) {
            var result = file.match(/(.*?)-control.json/);
            if (result && result[1]) { allEvents.push(result[1]) }
        });
        return allEvents;        
    },

    readEventControl : function(name) {
        var file = "./data/" + name + "-control.json";
        var control;
        if (fs.existsSync(file)) {
            control = JSON.parse(fs.readFileSync(file),'UTF8');
        }
        else {
            control = this.template; 
            control["Name"] = name;
        }        
        return control;
    },

    writeEventControl : function(control) {
        //Write to file data/[Name]-control.json 
        var file = "./data/" + control.Name + "-control.json";
        var newControlString = JSON.stringify(control, null, "  ");
        fs.writeFile(file, newControlString, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("\nDie Control-Datei '" + file + "' wurde erstellt!");
        }); 
    },

    readEventData : function(name) {
        var file = "./data/" + name + "-data.json";

        var data = {};
        if (fs.existsSync(file)) {
            data = JSON.parse(fs.readFileSync(file),'UTF8');
        }

        this.existingFileData = {};
        for (const collidx in data) {
            var collection = data[collidx];

            // Create copy of object and delete file properties
            this.existingCollectionData[collection.Name] = {...collection};

            for (const fileidx in collection.FileInfos) {
                var fileinfo = collection.FileInfos[fileidx];
                if (this.existingFileData[collection.Name] === undefined) {
                    this.existingFileData[collection.Name] = {};
                }
                this.existingFileData[collection.Name][fileinfo.Filename] = fileinfo;
            }
        }
    },

    writeEventData : function(name, data) {
        //Write to file data/[Name]-control.json 
        var file = "./data/" + name + "-data.json";
        var newDataString = JSON.stringify(data, null, "  ");
        fs.writeFile(file, newDataString, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("\nDie Datendatei '" + file + "' wurde erstellt!");
        }); 
    },

    minutes2seconds : function(minutes) { return Math.floor(minutes * 60);  },
    hours2seconds   : function(hours)   { return Math.floor(hours * this.minutes2seconds(60));  },
    days2seconds    : function(days)    { return Math.floor(days  * this.hours2seconds(24));  }

}