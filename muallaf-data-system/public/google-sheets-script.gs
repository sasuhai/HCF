/**
 * iSantuni Google Sheets Connector
 * Paste this into Extensions > Apps Script in your Google Spreadsheet.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('iSantuni')
    .addItem('Buka Database Tool', 'showSidebar')
    .addToUi();
}

/**
 * Opens a sidebar in the spreadsheet.
 */
function showSidebar() {
  var url = "https://hcf-app-1bb1e.web.app/google-sheets";
  
  var html = HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><style>body,html,iframe{margin:0;padding:0;height:100%;width:100%;overflow:hidden;border:none;}</style></head><body>' +
    '<iframe id="iSantuniFrame" src="' + url + '" allow="clipboard-read; clipboard-write"></iframe>' +
    '<script>' +
    '  var frame = document.getElementById("iSantuniFrame");' +
    '  window.addEventListener("message", function(event) {' +
    '    if (event.data && event.data.type === "GS_REQUEST") {' +
    '       var callId = event.data.callId;' +
    '       var functionName = event.data.functionName;' +
    '       var args = event.data.args || [];' +
    '       ' +
    '       google.script.run' +
    '         .withSuccessHandler(function(result) {' +
    '            frame.contentWindow.postMessage({ type: "GS_RESPONSE", callId: callId, result: result }, "*");' +
    '         })' +
    '         .withFailureHandler(function(error) {' +
    '            frame.contentWindow.postMessage({ type: "GS_RESPONSE", callId: callId, error: error.toString() }, "*");' +
    '         })' +
    '         [functionName].apply(google.script.run, args);' +
    '    }' +
    '  });' +
    '</script></body></html>'
  )
  .setTitle('iSantuni Database Sync')
  .setWidth(350)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Added to ensure iframe can be loaded
  
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Server-side function called from the sidebar UI.
 */
function writeDataToSheet(tableName, values) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  
  if (!sheet) {
    sheet = ss.insertSheet(tableName);
  } else {
    sheet.clear();
  }
  
  if (values && values.length > 0) {
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, values[0].length);
    // Select the sheet so the user sees the data
    sheet.activate();
  }
  
  return true;
}

/**
 * Server-side function called from the sidebar UI to read edited data.
 */
function readDataFromSheet(tableName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  
  if (!sheet) {
    throw new Error("Jadual '" + tableName + "' tidak dijumpai di dalam sheet ini.");
  }
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  
  return values;
}
