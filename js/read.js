/*
  Erstellen der Konfiguration und Daten Files
*/

const Globals = require('./globals');
const ts = require('./timestamp')
const Collection = require('./collection');
const colors = require('colors/safe');

const fs = require('fs-extra')
const clearConsole = require('clear-any-console');
const drivelist = require('fs-hard-drive').lsDevices;
var { from } = require('rxjs');
const cliProgress = require('cli-progress');

const inquirer = require('inquirer');
inquirer.registerPrompt('directory', require('inquirer-select-directory'));

var appConfig = Globals.readAppConfig();
var control = Globals.readEventControl(appConfig.LastName);
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
      default: control.Name,      
    },
    {
      type: 'input',
      name: 'Name',
      message: "Name (eindeutiger Name für die Konfiguration- und Datendateien)",
      default: function(currentAnswer) { return control["Name"]; },
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
      default: function(currentAnswer) { return control["Base_Directory"]; },
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
      default: function(currentAnswer) { return control["Output_Timezone"]; }
    },
    {
      type: 'input',
      name: 'OutputMixDir',
      message: "Unterverzeichnis im Hauptverzeichnis für den FotoMix (Achtung! Wird überschrieben)?",
      default: function(currentAnswer) { return control["Output_Mix_Path"]; }
    },
    {
      type: 'input',
      name: 'Praefix',
      message: "Präfix für die Dateien im Mix Verzeichnis?",
      default: function(currentAnswer) { return control["Mix_Praefix"]; }
    }
  ];

  observableQuestions = from(questions);

  
  inquirer.prompt(observableQuestions).ui.process.subscribe(
    function (currentAnswer) {

      // Event => Name 
      if (currentAnswer.name == "Event") {
        control = Globals.readEventControl(currentAnswer.answer);
        if (currentAnswer.answer === Globals.NewEvent) {
          control.Name = "";
        }
        else {
          console.log("\n" + colors.red.bold("ACHTUNG! Die Kollektionen werden anhand der gelesenen Daten überschrieben!") + "\n");
          BaseDirSelectionTypeDefault = Globals.readEventControlExists(appConfig.LastName) ? "Eingabe" : "Auswahl";
        }
      }

      // Name 
      if (currentAnswer.name == "Name") {
        control = Globals.readEventControl(currentAnswer.answer);
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
        control["Base_Directory"] = currentAnswer.answer;
      }

      // BaseDir Inputfeld
      if (currentAnswer.name == "BaseDir") {
        control["Base_Directory"] = currentAnswer.answer;
      }

      // Output-Timezone
      if (currentAnswer.name == "OutputTimezone") {
        control["Output_Timezone"] = currentAnswer.answer;
      }

      // Output-Mix-Path
      if (currentAnswer.name == "OutputMixDir") {
        control["Output_Mix_Path"] = currentAnswer.answer;
      }

      //Mix-Praefix
      if (currentAnswer.name == "Praefix") {
        control["Mix_Praefix"] = currentAnswer.answer;
      }


    },
    function (err) {
      console.log('Error: ', err);
    },
    function () {
      control["Base_Directory"] = control["Base_Directory"].replace(/\\\\/, "/");
      control["Base_Directory"] = control["Base_Directory"].replace(/\\/, "/");

      finalizeConfig();
    }
  );

}

//****************************************************************************************************
async function finalizeConfig() {
  console.log("\nDie Kollektionen werden ermittelt!");
  var subfolders = getDirectories(control);  
  //console.log(subfolders);

  var collections = subfolders.map( (path) => {
    return {
      "Name": path,
      "Directory": "./" + path,
      "Timestamp_Type": "",
      "Input_Timezone": "Europe/Berlin",
      "Offset_Auto_Reference_Pic": "", 
      "Offset_Auto_Reference_Pic_Master": "",
      "Offset_Manual_Timestamp": "+0000-00-00 00:00:00"
    }
  });

  // Kollektionen ermitteln mit Anzahl Dateien
  var collectionInstances = [];
  var totalFilesCount = 0;
  for (const collidx in collections) {
    var collection = new Collection(control, collections[collidx], collections[collidx].Directory);
    await collection.readCollection();   
    collectionInstances.push(collection);
    totalFilesCount += collection.FileCount;
  }

  control["Collections"] = collections;

  appConfig.LastName = control["Name"];

  Globals.writeEventControl(control);
  Globals.writeAppConfig(appConfig);

}

//****************************************************************************************************
function getDirectories(control) {
  var outputPath = Globals.getFullPath("", control["Output_Mix_Path"]);
  outputPath = outputPath.replace(/\//, "");
  return fs.readdirSync(control["Base_Directory"], { withFileTypes: true })
    .filter(dirent => (dirent.isDirectory() && (dirent.name !== outputPath)))
    .map(dirent => dirent.name);
}
  
//****************************************************************************************************
main();
