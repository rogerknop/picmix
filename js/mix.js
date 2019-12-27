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
        message: 'Welcher Event MIX soll erstellt werden?',
        choices: allEvents,
        default: control.Name,
    }];

    inquirer.prompt(questions)
        .then(answers => {
            control = Globals.readEventControl(answers.Event);
            Globals.readEventData(appConfig.LastName);
            mix();
        });
}

//****************************************************************************************************
async function mix() {
    console.log("\nDer Event MIX wird erstellt!");

    await fs.remove(control.Base_Directory +  "/" + control.Output_Mix_Path);

    var collections = Globals.existingCollectionData;
    var files = Globals.existingFileData;
    
    var totalFilesCount = 0;
    for (const collkey in collections) {
        totalFilesCount += collections[collkey].FileCount;
    }

    var success = 0;
    var error = 0;
    const progressbar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressbar.start(totalFilesCount, 0);
    var doneFilesCount = 0;
    for (const collkey in collections) {
        for (const filekey in files[collkey]) {
            if (copyFile(totalFilesCount, doneFilesCount, control, files[collkey][filekey])) {
                success++;
            }
            else {
                error++;
            }        
            progressbar.update(++doneFilesCount);
        }
    }
    progressbar.stop();
    
    appConfig.LastName = control["Name"];
    Globals.writeAppConfig(appConfig);

    if (error > 0) {
        console.log("\n" + colors.red.bold(error + " Dateien wurden nicht kopiert!\n"));
    }
    if (success > 0) {
        console.log("\n" + colors.green.bold(success + " Dateien wurden erfolgreich kopiert!\n"));
    }

    console.log("\n");
}

//****************************************************************************************************
function copyFile(total, count, control, fileInfo) {
    if ((fileInfo.Status !== Globals.status.ok) || (fileInfo.ComputedTimestamp.length != 19)) { return; }

    var source = fileInfo.Filename;
    var destination = control.Base_Directory +  "/" + control.Output_Mix_Path + "/" + control.Mix_Praefix;

    destination += fileInfo.ComputedTimestamp.substr(0,4) + fileInfo.ComputedTimestamp.substr(5,2) + fileInfo.ComputedTimestamp.substr(8,2) + 
                   "_" +
                   fileInfo.ComputedTimestamp.substr(11,2) + fileInfo.ComputedTimestamp.substr(14,2) + fileInfo.ComputedTimestamp.substr(17,2) + 
                   "_" +
                   String(count).padStart(total.toString().length, '0') + 
                   fileInfo.Filename.substr(-4);

    try {
        fs.copySync(source, destination);
        return true;
    } 
    catch (err) {
        return false;
    }
}

//****************************************************************************************************
main();