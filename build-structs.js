var XLSX = require('xlsx');

var workbook = XLSX.readFile('Properties that can be set.xlsx');

var first_sheet_name = workbook.SheetNames[0];
var worksheet = workbook.Sheets[first_sheet_name];
var worksheetJSON = XLSX.utils.sheet_to_json(worksheet);

var fs = require('fs');

var script = JSON.stringify(worksheetJSON);

fs.writeFile("structs.json", script, function(err) {
    if(err) {
        return console.log(err);
    }
}); 