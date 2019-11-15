/*
- read_path oder master_path - offen - einlesen und config einlesen und gemäß eingelesenen Werten anpassen und ausgeben zum kopieren - evtl. vorlage datei erstellen
*/

const Globals = require('./globals');
const ts = require('./timestamp')
const Collection = require('./collection');

const fs = require('fs')
const clearConsole = require('clear-any-console');
var config = require('config');
const drivelist = require('fs-hard-drive').lsDevices;
var { from } = require('rxjs');
const cliProgress = require('cli-progress');

const inquirer = require('inquirer');
inquirer.registerPrompt('directory', require('inquirer-select-directory'));


var observableQuestions;

//****************************************************************************************************
async function main() {
  // Drive List ermitteln
  var drives = await drivelist();
  drives = drives.map((record) => {
    return record.caption;
  });

  clearConsole();
  console.log('Willkommen zum PicMix Tooling zum Abmischen mehrere Foto/Video Kollektionen!');
  console.log('----------------------------------------------------------------------------');
  console.log('');
  console.log('Das Hauptverzeichnis entspricht in der Konfiguration "./"');
  console.log('');

  var questions = [{
      type: 'list',
      name: 'BaseDirSelectionType',
      message: 'Hauptverzeichnis auswählen oder manuell eingeben?',
      choices: ['Auswahl', 'Eingabe'],
      filter: function (val) {
        return val.toLowerCase();
      }
    },
    {
      type: 'list',
      name: 'Drive',
      message: "In welchem Laufwerk befindet sich das Hauptverzeichnis?",
      choices: drives,
      when: function (answers) {
        return answers.BaseDirSelectionType == 'auswahl';
      },
    },
    {
      type: 'directory',
      name: 'BaseDirSelect',
      message: 'Hauptverzeichnis auswählen?',
      basePath: "X:",
      when: function (answers) {
        return answers.BaseDirSelectionType == 'auswahl';
      }
    },
    {
      type: 'input',
      name: 'BaseDir',
      message: "Hauptverzeichnis manuell eingeben?",
      default: "c:/FotoMix",
      validate: function (value) {
        //Check if path exists
        if (fs.existsSync(value)) {
            return true;
        }
        else {
          return 'Das Verzeichnis existiert nicht! Bitte korrektes Verzeichnis eintragen.';
        }
      },
      when: function (answers) {
        return answers.BaseDirSelectionType == 'eingabe';
      }
    },
    {
      type: 'list',
      name: 'OutputTimezone',
      message: "Zeitzone für den Foto Mix?",
      choices: ts.tzchoices,
      default: "(UTC+01:00) Berlin"
    },
    {
      type: 'input',
      name: 'OutputMixDir',
      message: "Unterverzeichnis im Hauptverzeichnis für den FotoMix (Achtung! Wird überschrieben)?",
      default: "Mix"
    },
    {
      type: 'input',
      name: 'Praefix',
      message: "Präfix für die Dateien im Mix Verzeichnis?",
      default: "UrlaubsMix_"
    }
  ];

  observableQuestions = from(questions);

  inquirer.prompt(observableQuestions).ui.process.subscribe(
    function (currentAnswer) {

      // Pfadauswahl gemäß Drive Anwort anpassen
      if (currentAnswer.name == "Drive") {
        observableQuestions.forEach((obs) => {
          if (obs.name == "BaseDirSelect") {
            obs.basePath = currentAnswer.answer + '/';
          }
        });
      }

      // BaseDir Auswahl in Inputfeld übernehmen
      if (currentAnswer.name == "BaseDirSelect") {
        observableQuestions.forEach((obs) => {
          if (obs.name == "BaseDir") {
            obs.basePath = currentAnswer.answer;
          }
        });
        config["Base_Directory"] = currentAnswer.answer;
      }

      // BaseDir Inputfeld
      if (currentAnswer.name == "BaseDir") {
        config["Base_Directory"] = currentAnswer.answer;
      }

      // Output-Timezone
      if (currentAnswer.name == "OutputTimezone") {
        config["Output_Timezone"] = currentAnswer.answer;
      }

      // Output-Mix-Path
      if (currentAnswer.name == "OutputMixDir") {
        config["Output_Mix_Path"] = currentAnswer.answer;
      }

      //Mix-Praefix
      if (currentAnswer.name == "Praefix") {
        config["Mix_Praefix"] = currentAnswer.answer;
      }


    },
    function (err) {
      console.log('Error: ', err);
    },
    function () {
      config["Base_Directory"] = config["Base_Directory"].replace(/\\\\/, "/");
      config["Base_Directory"] = config["Base_Directory"].replace(/\\/, "/");

      finalizeConfig();
    }
  );

}

//****************************************************************************************************
async function finalizeConfig() {
  console.log("\nDie Kollektionen werden ermittelt!");
  var subfolders = getDirectories(config["Base_Directory"]);  
  //console.log(subfolders);

  var collections = subfolders.map( (path) => {
    return {
      "Name": path,
      "Directory": "./" + path,
      "Timestamp_Type": "",
      "Input_Timezone": "CET",
      "Offset_Auto_Reference_Pic": "", 
      "Offset_Auto_Reference_Pic_Master": "",
      "Offset_Manual_Date": "+0000-00-00",
      "Offset_Manual_Time": "+00:00:00"
    }
  });

  //TODO: Timezone & Name/Device & TimestampType ermitteln (solange dateien durchsuchen, bis was gefunden)
  var collectionInstances = [];
  var totalFilesCount = 0;
  for (const collidx in collections) {
    var collection = new Collection(config["Base_Directory"], collections[collidx].Directory);
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

  config["Collections"] = collections;
  
  //Write to file config/active.json 
  var newConfigString = JSON.stringify(config, null, "  ");
  fs.writeFile("./config/active.json", newConfigString, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("\n\nDie Konfigurationsdatei 'config/active.json' wurde erstellt!");
  }); 

  //Write Collection and Files 
  var collectionInstancesString = JSON.stringify(collectionInstances, null, "  ");
  fs.writeFile("./data/collections.json", collectionInstancesString, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("Die Kollectionen mit den Dateien wurden in die Datei 'data/collections.json' geschrieben!");
  }); 

}

//****************************************************************************************************
const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

//****************************************************************************************************
main();
