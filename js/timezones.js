/*
  Ausgabe einer Zeitzonen Liste
*/

const Globals = require('./globals');
const colors = require('colors/safe');
const clearConsole = require('clear-any-console');
const inquirer = require('inquirer');
var moment = require('moment-timezone');

//****************************************************************************************************
async function main() {
  clearConsole();
  console.log('Willkommen zur PicMix Zeitzonen Auswahl!');
  console.log('----------------------------------------');
  console.log('');

  var questions = 
  [
    {
      type: 'input',
      name: 'TimezoneFilter',
      message: "Zeitzonen Filter (falls leer, werden alle aufgelistet)"
    }
  ];

  inquirer.prompt(questions)
  .then(answers => {
      listTimezones(answers.TimezoneFilter);
  });
}

//****************************************************************************************************
async function listTimezones(filter) {
  var timeZones = moment.tz.names();
  var fullTimeZones=[];
  
  for (var i in timeZones) {
      fullTimeZones.push({
        Beschreibung: "(UTC/GMT"+moment.tz(timeZones[i]).format('Z')+") " + timeZones[i],
        Offset: moment.tz(timeZones[i]).format('Z'),
        Zeitzone: timeZones[i]
      });
  }

  var filteredTimezones = fullTimeZones.filter(timezone => timezone.Beschreibung.toLowerCase().indexOf(filter.toLowerCase())>=0);

  //filteredTimezones.forEach((tz) => {
  //    console.log(tz.Zeitzone + " --> " + colors.green.bold(tz.Offset));
  //})

  console.table(filteredTimezones);
}

//****************************************************************************************************
main();
