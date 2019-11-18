/*
  Erstellen der Konfiguration und Daten Files
*/

const Globals = require('./globals');
const ts = require('./timestamp')
const Collection = require('./collection');

const fs = require('fs')
const clearConsole = require('clear-any-console');
const drivelist = require('fs-hard-drive').lsDevices;
var { from } = require('rxjs');
const cliProgress = require('cli-progress');

const inquirer = require('inquirer');
inquirer.registerPrompt('directory', require('inquirer-select-directory'));

var appConfig = Globals.readAppConfig();
var config = Globals.readEventControl(appConfig.LastName);
var observableQuestions;

var BaseDirSelectionTypeDefault;


//****************************************************************************************************
async function main() {
  var allEvents = Globals.getAllEvents(true);
  
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

  var questions = 
  [
    {
      type: 'list',
      name: 'Event',
      message: 'Bestehendes oder neues Event?',
      choices: allEvents,
      default: config.Name,      
    },
    {
      type: 'input',
      name: 'Name',
      message: "Name (eindeutiger Name für die Konfiguration- und Datendateien)",
      default: function(currentAnswer) { return config["Name"]; },
      filter: function (value) {
        value = value.replace(/\W+/g,"");
        return value;
      },
      validate: function (value) {
        //Check Name is not empty
        if (value==="") {
          return 'Der Name darf nicht leer sein!';
        }
        else {
          return true;
        }
      },
      when: function (answers) {
        return answers.Event === Globals.NewEvent;
      }    
    },
    {
      type: 'list',
      name: 'BaseDirSelectionType',
      message: 'Hauptverzeichnis auswählen oder manuell eingeben?',
      choices: ['Auswahl', 'Eingabe'],
      default: function(currentAnswer) { return BaseDirSelectionTypeDefault; },
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
      }
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
      default: function(currentAnswer) { return config["Base_Directory"]; },
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
      default: function(currentAnswer) { return config["Output_Timezone"]; }
    },
    {
      type: 'input',
      name: 'OutputMixDir',
      message: "Unterverzeichnis im Hauptverzeichnis für den FotoMix (Achtung! Wird überschrieben)?",
      default: function(currentAnswer) { return config["Output_Mix_Path"]; }
    },
    {
      type: 'input',
      name: 'Praefix',
      message: "Präfix für die Dateien im Mix Verzeichnis?",
      default: function(currentAnswer) { return config["Mix_Praefix"]; }
    }
  ];

  observableQuestions = from(questions);

  inquirer.prompt(observableQuestions).ui.process.subscribe(
    function (currentAnswer) {

      // Event => Name 
      if (currentAnswer.name == "Event") {
        config = Globals.readEventControl(currentAnswer.answer);
        if (currentAnswer.answer === Globals.NewEvent) {
          config.Name = "";
        }
        else {
          BaseDirSelectionTypeDefault = Globals.readEventControlExists(appConfig.LastName) ? "Eingabe" : "Auswahl";
        }
      }

      // Name 
      if (currentAnswer.name == "Name") {
        config = Globals.readEventControl(currentAnswer.answer);
        BaseDirSelectionTypeDefault = Globals.readEventControlExists(appConfig.LastName) ? "Eingabe" : "Auswahl";
      }

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

  appConfig.LastName = config["Name"];

  Globals.writeEventControl(config);
  Globals.writeAppConfig(appConfig);
  Globals.writeEventData(config["Name"], collectionInstances);

}

//****************************************************************************************************
const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

//****************************************************************************************************
main();
