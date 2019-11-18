// globals.js
// ========================

const fs = require('fs')

module.exports = {
    status : {
        ok: "OK",
        unknown: "ERROR: Unknown Format",
        mediaInfoNotFound: "ERROR: MediaInfo not found",
        exifNotFound: "ERROR: Exif not found",
        fileNotFound: "ERROR: File not found"
    },

    template : {
        "Name": "Test Urlaub",
        "Base_Directory": "C:/FotoMix",
        "Output_Timezone": "CET",
        "Output_Mix_Path": "./mix",
        "Mix_Praefix": "TestMix_",
        "Collections": [
            {
                "Name": "Rogis Handy",
                "Directory": "./handy",
                "Timestamp_Type": "exif",
                "Input_Timezone": "CET",
                "Offset_Auto_Reference_Pic": "refpic.jpg", 
                "Offset_Auto_Reference_Pic_Master": "./ref_folder/refpic.jpg" 
            },
            {
                "Name": "Rogis Cam",
                "Directory": "./sony_kamera",
                "Timestamp_Type": "exif",
                "Input_Timezone": "CET",
                "Offset_Auto_Reference_Pic": "refpic.jpg", 
                "Offset_Auto_Reference_Pic_Master": "./ref_folder/refpic2.jpg" 
            },
            {
                "name": "Rogis GoPro",
                "path": "c:/temp/picmix/gopro",
                "timestamp_type": "mp4",
                "Input_Timezone": "",
                "Offset_Manual_Date": "-0000-00-00",
                "Offset_Manual_Time": "+00:01:15"
            }
        ]
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
        var config;
        if (fs.existsSync(file)) {
            config = JSON.parse(fs.readFileSync(file),'UTF8');
        }
        else {
            config = this.template; 
            config["Name"] = name;
        }        
        return config;
    },

    writeEventControl : function(config) {
        //Write to file data/[Name]-control.json 
        var file = "./data/" + config.Name + "-control.json";
        var newConfigString = JSON.stringify(config, null, "  ");
        fs.writeFile(file, newConfigString, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("\n\nDie Datendatei '" + file + "' wurde erstellt!");
        }); 
    },

    readEventData : function(name) {
        var file = "./data/" + name + "-data.json";
        var data = {};
        if (fs.existsSync(file)) {
            data = JSON.parse(fs.readFileSync(file),'UTF8');
        }
        return data;
    },

    writeEventData : function(name, data) {
        //Write to file data/[Name]-control.json 
        var file = "./data/" + name + "-data.json";
        var newDataString = JSON.stringify(data, null, "  ");
        fs.writeFile(file, newDataString, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("\n\nDie Datendatei '" + file + "' wurde erstellt!");
        }); 
    }
}