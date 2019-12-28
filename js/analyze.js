/*
  Analyse der Konfiguration und Daten Files
*/

const Globals = require('./globals');
const Collection = require('./collection');
const colors = require('colors/safe');

const fs = require('fs-extra')
const clearConsole = require('clear-any-console');
const cliProgress = require('cli-progress');

const inquirer = require('inquirer');

var appConfig = Globals.readAppConfig();
var control = Globals.readEventControl(appConfig.LastName);

//****************************************************************************************************
async function main() {
    var allEvents = Globals.getAllEvents(false);

    clearConsole();
    console.log('Willkommen zum PicMix Tooling zum Abmischen mehrere Foto/Video Kollektionen!');
    console.log('----------------------------------------------------------------------------');
    console.log('');

    var questions = [{
        type: 'list',
        name: 'Event',
        message: 'Welches Event soll analysiert werden?',
        choices: allEvents,
        default: control.Name,
    }];

    inquirer.prompt(questions)
        .then(answers => {
            control = Globals.readEventControl(answers.Event);
            Globals.readEventData(appConfig.LastName);
            analyze();
        });
}

//****************************************************************************************************
async function analyze() {
    console.log("\nDie Kollektionen werden analysiert!");

    var collectionInstances = [];
    var totalFilesCount = 0;
    for (const collidx in control.Collections) {
        var collection = new Collection(control, control.Collections[collidx], control.Collections[collidx].Directory);
        await collection.readCollection();
        collectionInstances.push(collection);
        totalFilesCount += collection.FileCount;
    }

    const progressbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressbar.start(totalFilesCount, 0);
    var doneFilesCount = 0;
    var errorCount = 0;
    var errorCountMsg = "";
    for (const collidx in collectionInstances) {
        await collectionInstances[collidx].analyzeCollection(progressbar, doneFilesCount);
        doneFilesCount += collectionInstances[collidx].FileCount;
        if (collectionInstances[collidx].ErrorCount > 0) {
            errorCountMsg = errorCountMsg + "  --> Kollektion '" + collectionInstances[collidx].Name + "' enthält " + collectionInstances[collidx].ErrorCount + " Fehler\n";
            errorCount += collectionInstances[collidx].ErrorCount;
        }
    }
    progressbar.stop();
    
    if (errorCountMsg !== "") {
        console.log("\n" + colors.red.bold(errorCount + " Fehler gefunden:") + "\n" + errorCountMsg + "\n");
    }
    else {
        console.log("\n" + colors.green.bold("Keine Fehler gefunden!") + "\n");
    }

    appConfig.LastName = control["Name"];

    var collectionInstancesData = collectionInstances.map((collection) => {
        return collection.getDataObject();
    });
    

    Globals.writeEventControl(control);
    Globals.writeAppConfig(appConfig);
    Globals.writeEventData(control["Name"], collectionInstancesData);

    console.log("\n");
}

//****************************************************************************************************
main();