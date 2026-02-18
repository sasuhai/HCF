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
  var url = "https://hcf-app-1bb1e.web.app/google-sheets/?v=" + new Date().getTime();
  
  var html = HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><style>body,html,iframe{margin:0;padding:0;height:100%;width:100%;overflow:hidden;border:none;}</style></head><body>' +
    '<iframe id="iSantuniFrame" src="' + url + '" allow="clipboard-read; clipboard-write"></iframe>' +
    '<script>' +
    '  var frame = document.getElementById("iSantuniFrame");' +
    '  window.addEventListener("message", function(event) {' +
    '    if (event.data && event.data.type === "GS_REQUEST") {' +
    '       var callId = event.data.callId;' +
    '       google.script.run' +
    '         .withSuccessHandler(function(result) {' +
    '            frame.contentWindow.postMessage({ type: "GS_RESPONSE", callId: callId, result: result }, "*");' +
    '         })' +
    '         .withFailureHandler(function(error) {' +
    '            frame.contentWindow.postMessage({ type: "GS_RESPONSE", callId: callId, error: error.toString() }, "*");' +
    '         })' +
    '[event.data.functionName].apply(null, event.data.args || []);' +
    '    }' +
    '  });' +
    '</script></body></html>'
  )
  .setTitle('iSantuni Database Sync')
  .setWidth(350)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Server-side function called from the sidebar UI.
 */
function writeDataToSheet(tableName, values) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName) || ss.insertSheet(tableName);
  
  // 1. Scan existing headers to preserve user arrangement
  var existingHeaders = [];
  if (sheet.getLastColumn() > 0) {
    existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  var dbHeaders = values[0];
  var dbRows = values.slice(1);
  
  // 2. Decide the final column layout
  var finalHeaders = [];
  if (existingHeaders.length > 0 && existingHeaders.some(function(h) { return h !== ""; })) {
    // Keep user's column order
    finalHeaders = existingHeaders.filter(function(h) { return h !== ""; });
    // Append any columns from DB that are missing in the sheet
    dbHeaders.forEach(function(h) {
      if (finalHeaders.indexOf(h) === -1) finalHeaders.push(h);
    });
  } else {
    finalHeaders = dbHeaders;
  }
  
  // 3. Map values to match the layout
  var outputValues = [finalHeaders];
  dbRows.forEach(function(row) {
    var mapped = finalHeaders.map(function(h) {
      var idx = dbHeaders.indexOf(h);
      return idx !== -1 ? row[idx] : "";
    });
    outputValues.push(mapped);
  });
  
  // 4. Update the sheet without destroying formatting
  sheet.clearContents(); // Only wipes data, keeps colors/bold/borders
  sheet.getRange(1, 1, outputValues.length, finalHeaders.length).setValues(outputValues);
  
  sheet.setFrozenRows(1);
  
  // Only resize if it's the very first time (empty sheet)
  if (existingHeaders.length === 0) {
    if (outputValues.length < 500) {
      sheet.autoResizeColumns(1, finalHeaders.length);
    } else {
      sheet.setColumnWidths(1, finalHeaders.length, 150); 
    }
  }
  
  sheet.activate();
  return true;
}

/**
 * Server-side function called from the sidebar UI to read edited data.
 */
function readDataFromSheet(tableName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  
  if (!sheet) {
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) {
        if (all[i].getName().toLowerCase() === tableName.toLowerCase()) { sheet = all[i]; break; }
    }
  }

  if (!sheet) throw "Tab bernama '" + tableName + "' tidak dijumpai dalam spreadsheet ini.";
  
  var dataRange = sheet.getDataRange();
  if (dataRange.isBlank()) return [];
  
  var values = dataRange.getValues();
  
  // Basic filtering of truly empty trailing rows
  var clean = values.filter(function(row) {
    return row.some(function(cell) {
      return cell !== null && cell !== undefined && cell.toString().trim() !== "";
    });
  });
  
  return clean;
}
