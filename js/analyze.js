/*
  Analyse der Konfiguration und Daten Files
*/

const Globals = require('./globals');
const ts = require('./timestamp')
const Collection = require('./collection');
const colors = require('colors/safe');

const fs = require('fs')
const clearConsole = require('clear-any-console');
const cliProgress = require('cli-progress');

const inquirer = require('inquirer');

var appConfig = Globals.readAppConfig();
var config = Globals.readEventControl(appConfig.LastName);

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
        default: config.Name,
    }];

    inquirer.prompt(questions)
        .then(answers => {
            config = Globals.readEventControl(answers.Event);
            analyze();
        });
}

//****************************************************************************************************
async function analyze() {
    console.log("\nDie Kollektionen werden analysiert!");

    //TODO: Timezone & Name/Device & TimestampType ermitteln (solange dateien durchsuchen, bis was gefunden)
    var collectionInstances = [];
    var totalFilesCount = 0;
    for (const collidx in config.Collections) {
        var collection = new Collection(config["Base_Directory"], config.Collections[collidx].Directory);
        collection = await collection.readCollection();
        collectionInstances.push(collection);
        totalFilesCount += collection.fileCount;
    }

    const progressbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressbar.start(totalFilesCount, 0);
    var doneFilesCount = 0;
    for (const collidx in collectionInstances) {
        await collectionInstances[collidx].analyzeCollection(progressbar, doneFilesCount);
        doneFilesCount += collectionInstances[collidx].fileCount;
    }
    progressbar.stop();

    var date = new Date();
    var timeZone = ts.tzlookup[config.Output_Timezone].value;
    //console.log( timeZone + " -> " + date.toLocaleString('de-DE', {hour12: false, timeZone: timeZone })  );

    appConfig.LastName = config["Name"];

    Globals.writeEventControl(config);
    Globals.writeAppConfig(appConfig);
    Globals.writeEventData(config["Name"], collectionInstances);

    console.log("\n");
}

//****************************************************************************************************
main();