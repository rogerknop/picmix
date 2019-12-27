// collection.js
// ========================

const Globals = require('./globals');
var recursive = require("recursive-readdir");
const FileInfo = require('./fileinfo');
const ts = require('./timestamp');
const ct = require('countries-and-timezones');
const moment = require('moment-timezone');
moment.suppressDeprecationWarnings = true;

class Collection {
    // Only these attributes are visible in the data file
    static dataAttributes = ["Name", "Path", "Files", "FileInfos", "FileCount", "ErrorCount"];

    //****************************************************************************************************
    constructor(control, collectionControl, path) {
        this.control = Object.keys(control).filter(key => key != "Collections")
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: control[key]
                };
            }, {});

        this.collectionControl = collectionControl;
        
        // Properties for Data File
        this.Name = collectionControl.Name;
        this.Path = Globals.getFullPath(this.control["Base_Directory"], path);
        this.Files = [];
        this.FileInfos = [];
        this.FileCount = 0;
        this.ErrorCount = 0;
    }

    //****************************************************************************************************
    async readCollection() {
        this.Files = await getAllFiles(this.Path);
        this.FileCount = this.Files.length;
    }

    //****************************************************************************************************
    async analyzeCollection(progressbar, doneBefore) {
        //Falls Referenzbild - dann sollten Offset_Manual_Date und Offset_Manual_Date bereits berechnet sein
        var manualOffset = this.computeManualOffset(this.collectionControl.Offset_Manual_Date, this.collectionControl.Offset_Manual_Time);

        var done = doneBefore;
        for (const file of this.Files) {
            var fileInfo = await FileInfo.getFileInfo(this.Name, file);
            
            if (fileInfo.Status.indexOf('ERROR') >= 0) {
                this.ErrorCount++;
            }
            else {
                this.computeRealTimestamp(manualOffset, fileInfo);
            }

            this.FileInfos.push(fileInfo);

            progressbar.update(++done);
        }          
    }

    //****************************************************************************************************
    computeRealTimestamp(manualOffset, fileInfo) {
        if (fileInfo.debug) {
            debugger;
        }

        if (fileInfo.UseDateTaken) {
            fileInfo.ComputedTimestamp = fileInfo.DateTaken;
            return;
        }

        /*
          TODO: Durchfalllogik Timestamp
          1. fileInfo.DateTaken
          2. Falls fileInfo.Timezone einen Wert hat dann diesen für DateTaken setzen ohne umzurechnen
          3. Sonst collectionControl.Input_Timezone für DateTaken setzen ohne umzurechnen
        */

        // Foto/ Video Zeitzone ermitteln und moment Objekt mit dieser Zone erstellen
        var inputTimezone = ((fileInfo.Timezone) && (fileInfo.Timezone!=="")) ? fileInfo.Timezone : this.collectionControl.Input_Timezone;
        var mediaDate = moment.tz(fileInfo.DateTaken, inputTimezone);

        // Falls Zeitstempel nicht erkannt wurde Fehler
        if (!mediaDate.isValid()) {
            fileInfo.Status = Globals.status.dateNotValid;
            fileInfo.ComputedTimestamp = "";
            return;
        }
        
        // Zeitstempel gemäß Ausgabe Zeitzone umrechnen
        mediaDate.tz(ts.tzlookup[this.control.Output_Timezone].value);
        
        // Falls manuell Jahr, Monat, Sekunden Offset anfällt antsprechend addieren & Ergebnis in ComputedTimestamp ablegen
        fileInfo.ComputedTimestamp = mediaDate.add(manualOffset.years, "y").add(manualOffset.months, "M").add(manualOffset.seconds, "s").format("YYYY-MM-DD HH:mm:ss");

        //console.log( timeZone + " -> " + date.toLocaleString('de-DE', {hour12: false, timeZone: timeZone })  );

        
        /*
        ALT
        ---------------

        //Offset für den Ausgabe Mix
        var outputOffset = this.getTimezoneOffset(mediaDate, ts.tzlookup[this.control.Output_Timezone].value);
        
        //Datei offset oder falls leer collection input_timezone offset
        var mediaOffset = 0;
        if ((fileInfo.Timezone) && (fileInfo.Timezone!=="")) {
            mediaOffset = this.getTimezoneOffset(mediaDate, fileInfo.Timezone);
        }
        else {
            mediaOffset = this.getTimezoneOffset(mediaDate, this.collectionControl.Input_Timezone);
        }
        
        13:00
        Input nach UTC: +01:00 => -3600 Sek. => 12:00 UTC
          Output von UTC: +02:00 => +7200 Sek. => 14:00 local Timezone
          Manual                 => + 600 Sek. => 14:10 local Timezone 
         var secondsOffset = manualOffset.seconds + outputOffset - mediaOffset;
        */

    }

    //****************************************************************************************************
    getTimezoneOffset(date, timezone) {
        var timezoneDetails = ct.getTimezone(timezone);
        var offset = date.isDST ? timezoneDetails.dstOffset : timezoneDetails.utcOffset;
        return offset * 60;
    }
    
    //****************************************************************************************************
    computeManualOffset(date, time) {
        var seconds = 0;
        var months = 0;
        var years = 0;

        if ((date) && (date.length == 11)) {
            var dateFaktor = (date.substr(0,1) == "+") ? 1 : -1;
            years = date.substr(1,4) * dateFaktor;
            months = date.substr(6,2) * dateFaktor;
            seconds += Globals.days2seconds(date.substr(9,2)) * dateFaktor;
        } 

        if ((time) && (time.length == 6)) {
            var timeFaktor = (time.substr(0,1) == "+") ? 1 : -1;
            seconds += Globals.hours2seconds(time.substr(1,2)) * timeFaktor;
            seconds += Globals.minutes2seconds(time.substr(4,2)) * timeFaktor;
        } 
        
        return {years: years, months: months, seconds: seconds};
    }
    
    //****************************************************************************************************
    getDataObject() {
        var control = Collection.dataAttributes.reduce((accObj, attribute) => { return {...accObj, [attribute] : this[attribute]} }, {} );
        return control;
    }

    //****************************************************************************************************
    getFiles() {
        return this.Files;
    }
    
}

//****************************************************************************************************
// Local Functions
async function getAllFiles(path) {
    let getDirRecursivePromise = new Promise((resolve, reject) => {
        recursive(path, ["*.THM", "*.LRV"], function (err, files) {
            // `files` is an array of file paths
            resolve(files);
        });
    });
    let files = await getDirRecursivePromise; // wait until the promise resolves (*)
    return files;
}


module.exports = Collection

