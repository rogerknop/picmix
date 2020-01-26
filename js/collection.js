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
        //Falls Referenzbild - dann Offset_Manual_Timestamp ermitteln
        await this.setManualOffsetBasedOnReference();

        //Offset berechnen für die Kollektion
        var manualOffset = this.computeManualOffset(this.collectionControl.Offset_Manual_Timestamp);
        var globalOffset = this.computeManualOffset(this.control["Output_Offset_Manual_Timestamp"]);

        var done = doneBefore;
        for (const file of this.Files) {
            var fileInfo = await FileInfo.getFileInfo(this.Name, file);
            
            if (fileInfo.Status.indexOf('ERROR') >= 0) {
                this.ErrorCount++;
            }
            else {
                this.computeRealTimestamp(globalOffset, manualOffset, fileInfo);
            }

            this.FileInfos.push(fileInfo);

            progressbar.update(++done);
        }          
    }

    //****************************************************************************************************
    computeRealTimestamp(globalOffset, manualOffset, fileInfo) {
        if (fileInfo.debug) {
            debugger;
        }

        if (fileInfo.UseDateTaken) {
            fileInfo.ComputedTimestamp = fileInfo.DateTaken;
            return;
        }

        /*
          Durchfalllogik Timestamp
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
        fileInfo.ComputedTimestamp = mediaDate.add(globalOffset.years, "y").add(globalOffset.months, "M").add(globalOffset.seconds, "s").format("YYYY-MM-DD HH:mm:ss");

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
    async setManualOffsetBasedOnReference() {
        if (!this.collectionControl.Offset_Auto_Reference_Pic || (this.collectionControl.Offset_Auto_Reference_Pic==="") ||
            !this.collectionControl.Offset_Auto_Reference_Pic_Master || (this.collectionControl.Offset_Auto_Reference_Pic_Master==="")) { return; }
        //Referenzbild Timestamp ermitteln
        var fileInfoRef = await FileInfo.getFileInfo("", this.Path + "/" + this.collectionControl.Offset_Auto_Reference_Pic);
        
        //Referenzbild Master Timestamp ermitteln
        var fileInfoRefMaster = await FileInfo.getFileInfo("", Globals.getFullPath(this.control["Base_Directory"] + "/", this.collectionControl.Offset_Auto_Reference_Pic_Master));

        //Manual Offset Date und Time setzen
        var refTimestamp = moment(fileInfoRef.DateTaken);
        var refTimestampMaster = moment(fileInfoRefMaster.DateTaken);
        var diff = refTimestampMaster.diff(refTimestamp);

        var sign = (diff >= 0) ? "+" : "-";
        if (diff < 0) {diff = diff * (-1)}

        var duration = moment.duration(diff);

        if (!duration.isValid()) {return;}

        this.collectionControl.Offset_Manual_Timestamp = 
          sign + 
          String(duration.years()).padStart(4, '0') + "-" +
          String(duration.months()).padStart(2, '0') +  "-" +
          String(duration.days()).padStart(2, '0') + 
          " " + 
          String(duration.hours()).padStart(2, '0') +  ":" +
          String(duration.minutes()).padStart(2, '0') +  ":" +
          String(duration.seconds()).padStart(2, '0');
    }
    
    //****************************************************************************************************
    computeManualOffset(timestamp) {
        var seconds = 0;
        var months = 0;
        var years = 0;

        if ((timestamp) && (timestamp.length == 20)) {
            var faktor = (timestamp.substr(0,1) == "+") ? 1 : -1;
            years = timestamp.substr(1,4) * faktor;
            months = timestamp.substr(6,2) * faktor;
            seconds += Globals.days2seconds(timestamp.substr(9,2)) * faktor;
            seconds += Globals.hours2seconds(timestamp.substr(12,2)) * faktor;
            seconds += Globals.minutes2seconds(timestamp.substr(15,2)) * faktor;
            seconds += parseInt(timestamp.substr(18,2)) * faktor;            
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

