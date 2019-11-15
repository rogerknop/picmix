// timestamp.js
// ========================

const Globals = require('./globals');

// https://github.com/prantlf/timezone-support/blob/HEAD/docs/API.md#api-reference
//const tz = require('timezone-support');
const tzlist = require('timezonelist-js');
var tzlookup = new Array();

function initialize() {    
    tzchoices = tzlist.map( (rec) => {
        tzlookup[rec.text] = rec; 
        return rec.text;
    });
}
initialize();

module.exports = {
    tzlookup,
    tzchoices

    //****************************************************************************************************
    //func: function() {}
}

//****************************************************************************************************
//****************************************************************************************************
//****************************************************************************************************
// Local Functions
  



