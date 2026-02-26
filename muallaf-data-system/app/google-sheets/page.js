'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
    Loader2,
    RefreshCw,
    Database,
    Save,
    Layers,
    Copy,
    Check,
    HelpCircle,
    ExternalLink,
    ChevronRight,
    Search,
    Download,
    CheckCircle2,
    Info,
    Eye,
    Edit3,
    ShieldAlert,
    ToggleLeft,
    ListFilter
} from 'lucide-react';

const COLORS = {
    primary: '#10b981', // emerald-500
    primaryDark: '#059669', // emerald-600
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b'
};

export default function GoogleSheetsSyncPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('mualaf');
    const [mounted, setMounted] = useState(false);
    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedHtml, setCopiedHtml] = useState(false);
    const [view, setView] = useState('sync'); // 'sync' or 'instructions'
    const [syncMode, setSyncMode] = useState('view'); // 'view' or 'edit'
    const [jsonExpand, setJsonExpand] = useState('none'); // 'none' or 'auto'

    useEffect(() => {
        setMounted(true);
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            // First try calling the RPC
            const { data, error } = await supabase.rpc('get_public_tables');
            if (error) {
                console.warn("RPC get_public_tables failed, falling back to basic list.", error);
                // Fallback list of known tables
                setTables(['mualaf', 'classes', 'workers', 'attendance_records', 'locations', 'states', 'other_kpis', 'rateCategories']);
                return;
            }
            if (data) {
                setTables(data.map(t => typeof t === 'string' ? t : t.table_name));
            }
        } catch (err) {
            console.error("Error fetching tables:", err);
            setTables(['mualaf', 'classes', 'workers', 'attendance_records']);
        }
    };

    const normalize = (val) => {
        if (val === null || val === undefined) return "";
        const s = String(val).trim();
        if (s.toUpperCase() === 'TRUE') return 'TRUE';
        if (s.toUpperCase() === 'FALSE') return 'FALSE';
        return s;
    };

    const getFingerprint = (item) => {
        if (!item) return '';
        const keys = Object.keys(item).sort();
        let fp = "";
        for (const k of keys) {
            if (['updatedAt', 'updatedBy', 'createdAt', 'createdBy'].includes(k)) continue;
            fp += normalize(item[k]) + "|";
        }
        return fp;
    };

    const runGAS = (functionName, ...args) => {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || window.parent === window) {
                reject('Aplikasi ini mesti dibuka di dalam Google Sheets (Sidebar). Sila ikut arahan persediaan.');
                return;
            }
            const id = Math.random().toString(36).substring(7);
            const listener = (event) => {
                if (event.data?.type === 'GS_RESPONSE' && event.data?.callId === id) {
                    window.removeEventListener('message', listener);
                    if (event.data.error) reject(event.data.error);
                    else resolve(event.data.result);
                }
            };
            window.addEventListener('message', listener);
            window.parent.postMessage({ type: 'GS_REQUEST', callId: id, functionName, args }, '*');
            setTimeout(() => {
                window.removeEventListener('message', listener);
                reject('Google Sheets tidak memberi respon (Timeout). Pastikan script anda betul.');
            }, 60000);
        });
    };

    const loadDataToSheets = async () => {
        if (!user) {
            setStatus({ type: 'error', message: 'Sila log masuk terlebih dahulu.' });
            return;
        }

        setLoading(true);
        setProgress(0);
        setStatus({ type: 'info', message: `Menarik data dari jadual ${selectedTable}...` });

        try {
            let allData = [];
            let page = 0, size = 1000, hasMore = true;

            while (hasMore) {
                let q = supabase.from(selectedTable).select('*', { count: 'exact' });
                if (selectedTable === 'mualaf') {
                    q = q.eq('status', 'active');
                }
                const { data, error, count } = await q.range(page * size, (page * size) + size - 1).order('id', { ascending: true });
                if (error) throw error;
                allData = [...allData, ...data];
                const currentProgress = Math.round((allData.length / count) * 40);
                setProgress(isNaN(currentProgress) ? 10 : currentProgress);
                if (data.length < size) hasMore = false;
                else page++;
            }

            if (allData.length === 0) throw "Tiada data ditemui dalam jadual ini.";

            // Save valid database headers for this table (used for sync filtering)
            const dbRefHeaders = Object.keys(allData[0]);
            localStorage.setItem(`db_fields_${selectedTable}`, JSON.stringify(dbRefHeaders));

            // Save fingerprints
            const fps = {};
            allData.forEach(item => { fps[item.id] = getFingerprint(item); });
            sessionStorage.setItem(`sync_v1_${selectedTable}`, JSON.stringify(fps));

            setStatus({ type: 'info', message: 'Menyediakan Sheet...' });

            let finalRefHeaders = [...dbRefHeaders];
            if (jsonExpand === 'auto') {
                const extraHeaders = new Set();
                allData.forEach(item => {
                    dbRefHeaders.forEach(h => {
                        if (item[h] && typeof item[h] === 'object' && !Array.isArray(item[h])) {
                            Object.keys(item[h]).forEach(key => extraHeaders.add(`${h}.${key}`));
                        }
                    });
                });
                finalRefHeaders = [...dbRefHeaders, ...Array.from(extraHeaders)];
            }

            const finalSheetHeaders = await runGAS('prepareSheet', selectedTable, finalRefHeaders);

            const chunkSize = 1500;
            const totalChunks = Math.ceil(allData.length / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = allData.slice(i * chunkSize, (i + 1) * chunkSize);
                setStatus({ type: 'info', message: `Memproses Batch ${i + 1}/${totalChunks}...` });

                // Map database data to exact sheet column positions
                const rows = chunk.map(item => finalSheetHeaders.map(h => {
                    if (h.includes('.')) {
                        const [parent, child] = h.split('.');
                        const val = item[parent] ? item[parent][child] : null;
                        if (val === null || val === undefined) return null;
                        return typeof val === 'object' ? JSON.stringify(val) : val;
                    }

                    const val = item[h];
                    if (val === null || val === undefined) return null;
                    if (typeof val === 'object') return JSON.stringify(val);
                    return val;
                }));

                await runGAS('upsertDataToSheet', selectedTable, finalSheetHeaders, rows);
                setProgress(40 + Math.round(((i + 1) / totalChunks) * 60));
            }

            setStatus({ type: 'success', message: `Selesai! Data berjaya disync tanpa memadam format/column anda.` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: typeof err === 'string' ? err : 'Gagal memproses data.' });
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const handleSync = async () => {
        if (!user) {
            setStatus({ type: 'error', message: 'Sila log masuk terlebih dahulu.' });
            return;
        }

        setLoading(true);
        setProgress(0);
        setStatus({ type: 'info', message: 'Membaca data dari Google Sheet...' });

        try {
            const sheetData = await runGAS('readDataFromSheet', selectedTable);
            const cleanData = (sheetData || []).filter(row => row && row.some(cell => cell !== null && cell.toString().trim() !== ""));

            if (cleanData.length < 2) throw `Sheet '${selectedTable}' nampak kosong.`;

            const sheetHeaders = cleanData[0];
            const rows = cleanData.slice(1);
            const idIdx = sheetHeaders.indexOf('id');
            if (idIdx === -1) throw "Lajur 'id' tidak dijumpai!";

            const fingerprints = JSON.parse(sessionStorage.getItem(`sync_v1_${selectedTable}`) || '{}');
            if (Object.keys(fingerprints).length === 0) throw "Sesi Sync tamat. Sila klik 'TARIK DATA' semula.";

            // Load valid DB fields to filter out custom sheet columns
            const dbFields = JSON.parse(localStorage.getItem(`db_fields_${selectedTable}`) || '[]');

            const toUpdate = [];
            rows.forEach(row => {
                const id = row[idIdx];
                if (!id) return;
                const cur = {};
                sheetHeaders.forEach((h, j) => {
                    let v = row[j];
                    if (v === "") v = null;

                    if (h.includes('.')) {
                        const [parent, child] = h.split('.');
                        if (dbFields.includes(parent)) {
                            if (!cur[parent]) cur[parent] = {};
                            cur[parent][child] = v;
                        }
                    } else if (dbFields.includes(h)) {
                        cur[h] = v;
                    }
                });
                if (fingerprints[id] !== getFingerprint(cur)) toUpdate.push({ id, data: cur });
            });

            if (toUpdate.length === 0) {
                setStatus({ type: 'success', message: 'Tiada perubahan dikesan.' });
                setLoading(false);
                return;
            }

            setStatus({ type: 'info', message: `Mengemaskini ${toUpdate.length} rekod...` });
            let success = 0, fail = 0;

            for (let i = 0; i < toUpdate.length; i++) {
                const { id, data } = toUpdate[i];
                const cleanPayload = {};
                Object.keys(data).forEach(h => {
                    if (!['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'].includes(h)) {
                        cleanPayload[h] = data[h];
                    }
                });

                const { error } = await supabase.from(selectedTable).update({
                    ...cleanPayload,
                    updatedAt: new Date().toISOString(),
                    updatedBy: user.id
                }).eq('id', id);

                if (error) { console.error(error); fail++; } else success++;
                setProgress(Math.round(((i + 1) / toUpdate.length) * 100));
            }

            setStatus({ type: fail > 0 ? 'error' : 'success', message: `Berjaya: ${success}, Gagal: ${fail}.` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Ralat: ' + err });
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const getGASScript = () => {
        return `/**
 * iSantuni Google Sheets Sync Script
 * Versi: 1.2 (Sokongan JSONB & Optimasi)
 */

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('🔄 iSantuni Sync')
      .addItem('Buka Panel Sync', 'showSyncSidebar')
      .addToUi();
}

function showSyncSidebar() {
  var html;
  try {
    html = HtmlService.createTemplateFromFile('index').evaluate();
  } catch (e) {
    try {
      html = HtmlService.createTemplateFromFile('Index').evaluate();
    } catch (err) {
      throw "Fail 'index' atau 'Index' tidak dijumpai. Sila pastikan anda telah menambah fail HTML bernama 'index'.";
    }
  }
  html.setTitle('iSantuni Database Sync').setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function prepareSheet(tableName, dbHeaders) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName) || ss.insertSheet(tableName);
  var existingHeaders = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  var missing = dbHeaders.filter(function(h) { return existingHeaders.indexOf(h) === -1; });
  if (missing.length > 0) {
    var startCol = existingHeaders.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing])
      .setBackground('#10b981').setFontColor('#ffffff').setFontWeight('bold').setVerticalAlignment('middle');
    if (existingHeaders.length === 0) sheet.setFrozenRows(1);
    existingHeaders = existingHeaders.concat(missing);
  }
  return existingHeaders;
}

function upsertDataToSheet(tableName, sheetHeaders, dbRows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  var lastRow = Math.max(1, sheet.getLastRow());
  var lastCol = sheet.getLastColumn();
  var range = sheet.getRange(1, 1, lastRow, lastCol);
  var values = range.getValues();
  var formulas = range.getFormulas();
  var idColIdx = sheetHeaders.indexOf('id');
  if (idColIdx === -1) throw "Lajur ID tidak dijumpai!";
  var idMap = {};
  for (var i = 1; i < values.length; i++) idMap[values[i][idColIdx]] = i; 
  var newRows = [];
  dbRows.forEach(function(dbRow) {
    var id = dbRow[idColIdx];
    var rowIndex = idMap[id];
    if (rowIndex !== undefined) {
      for (var c = 0; c < dbRow.length; c++) {
        if (dbRow[c] !== null) {
          values[rowIndex][c] = dbRow[c];
          formulas[rowIndex][c] = "";
        }
      }
    } else {
      var newRow = new Array(lastCol).fill("");
      for (var c = 0; c < dbRow.length; c++) if (dbRow[c] !== null) newRow[c] = dbRow[c];
      newRows.push(newRow);
    }
  });
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) if (formulas[r][c]) values[r][c] = formulas[r][c];
  }
  range.setValues(values);
  if (newRows.length > 0) sheet.getRange(lastRow + 1, 1, newRows.length, lastCol).setValues(newRows);
  return true;
}

function readDataFromSheet(tableName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}

function processClientRequest(request) {
  try {
    var result = this[request.functionName].apply(this, request.args);
    return { type: 'GS_RESPONSE', callId: request.callId, result: result };
  } catch (err) {
    return { type: 'GS_RESPONSE', callId: request.callId, error: err.toString() };
  }
}

/**
 * Helper: Ambil data dari kolum JSONB
 * Cara guna: =PARSE_JSON(A2, "key_name")
 */
function PARSE_JSON(jsonString, field) {
  try {
    if (!jsonString || jsonString == "{}") return "";
    var data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    return data[field] || "";
  } catch(e) {
    return "";
  }
}
`;
    };

    const getGASHtml = () => {
        const origin = window.location.origin;
        return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
      iframe { width: 100%; height: 100%; border: none; }
      .loading { padding: 20px; font-weight: bold; color: #10b981; }
    </style>
  </head>
  <body>
    <div id="loader" class="loading">Sila tunggu, panel sedang dimuatkan...</div>
    <iframe src="${origin}/google-sheets/" id="appFrame" onload="document.getElementById('loader').style.display='none'"></iframe>
    <script>
      window.addEventListener('message', function(e) {
        if (e.data.type === 'GS_REQUEST') {
          google.script.run
            .withSuccessHandler(function(response) {
              document.getElementById('appFrame').contentWindow.postMessage(response, '*');
            })
            .withFailureHandler(function(err) {
              document.getElementById('appFrame').contentWindow.postMessage({
                type: 'GS_RESPONSE',
                callId: e.data.callId,
                error: err.toString()
              }, '*');
            })
            .processClientRequest(e.data);
        }
      });
    </script>
  </body>
</html>`;
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'script') {
            setCopiedScript(true);
            setTimeout(() => setCopiedScript(false), 2000);
        } else {
            setCopiedHtml(true);
            setTimeout(() => setCopiedHtml(false), 2000);
        }
    };

    if (!mounted) return null;
    if (authLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

    const isInsideSheets = typeof window !== 'undefined' && window.parent !== window;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-200">
                        <Database className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Google Sheets Sync</h1>
                        <p className="text-slate-500 text-sm font-medium">Auto-sync database dengan Google Sheets anda</p>
                    </div>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setView('sync')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'sync' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Sync Panel
                    </button>
                    <button
                        onClick={() => setView('instructions')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'instructions' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Arahan
                    </button>
                </div>
            </header>

            {view === 'sync' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Sync Controls */}
                    <div className="md:col-span-2 space-y-6">
                        {!user ? (
                            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4 shadow-sm">
                                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <Layers className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold">Log Masuk Diperlukan</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Sila log masuk ke sistem iSantuni terlebih dahulu untuk menggunakan alat ini.</p>
                                <a href="/login" className="inline-block bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-colors">
                                    Pergi ke Log Masuk
                                </a>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                                {/* Table Selection */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Pilih Jadual Database</label>
                                    <div className="relative group">
                                        <select
                                            value={selectedTable}
                                            onChange={(e) => setSelectedTable(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 appearance-none focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                        >
                                            {tables.map(t => (
                                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                            <Search size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Mode Selection */}
                                <div className="p-1 bg-slate-100 rounded-2xl flex gap-1">
                                    <button
                                        onClick={() => setSyncMode('view')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${syncMode === 'view' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Eye size={18} /> LIHAT DATA
                                    </button>
                                    <button
                                        onClick={() => setSyncMode('edit')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${syncMode === 'edit' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Edit3 size={18} /> EDIT & SYNC
                                    </button>
                                </div>

                                {/* JSON Expand Selection */}
                                <div className="p-1 bg-slate-50 border border-slate-100 rounded-2xl flex gap-1 items-center">
                                    <div className="pl-3 pr-2 py-2">
                                        <ToggleLeft size={16} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                        Kembangkan JSONB?
                                    </div>
                                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                                        <button
                                            onClick={() => setJsonExpand('none')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${jsonExpand === 'none' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            TIADA
                                        </button>
                                        <button
                                            onClick={() => setJsonExpand('auto')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${jsonExpand === 'auto' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            SEMUA (AUTO)
                                        </button>
                                    </div>
                                </div>

                                {/* Mode Notice */}
                                {syncMode === 'view' ? (
                                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                                        <Info className="text-blue-500 shrink-0" size={20} />
                                        <div className="text-xs text-blue-800 font-medium">
                                            <p className="font-bold uppercase tracking-tight">Mode Lihat Sahaja</p>
                                            <p className="mt-1 opacity-80">Anda boleh menarik data ke Google Sheets tanpa risiko mengubah data asal di database.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                                        <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                                        <div className="text-xs text-amber-800 font-medium">
                                            <p className="font-bold uppercase tracking-tight">Mode Edit Aktif</p>
                                            <p className="mt-1 opacity-80">Perubahan yang anda simpan di Google Sheets akan terus dikemaskini ke dalam database iSantuni.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Warning if not in Sheets */}
                                {!isInsideSheets && (
                                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                                        <div className="text-xs text-red-800 font-medium">
                                            <p className="font-bold">Laman ini dibuka sebagai standalone.</p>
                                            <p className="mt-1 opacity-80">Sync hanya berfungsi apabila laman ini dibuka dari dalam Google Sheets. Sila baca tab <b>Arahan</b> untuk menyediakan script.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className={`grid gap-4 ${syncMode === 'edit' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                    <button
                                        onClick={loadDataToSheets}
                                        disabled={loading}
                                        className={`relative group overflow-hidden bg-white border-4 p-4 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 ${syncMode === 'edit' ? 'border-emerald-500 text-emerald-600' : 'border-slate-800 text-slate-800'}`}
                                    >
                                        <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                                        {syncMode === 'edit' ? 'TARIK DATA' : 'MULAKAN SYNC (VIEW ONLY)'}
                                    </button>

                                    {syncMode === 'edit' && (
                                        <button
                                            onClick={handleSync}
                                            disabled={loading}
                                            className="bg-emerald-500 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all hover:bg-emerald-600 hover:shadow-emerald-300 disabled:opacity-50"
                                        >
                                            <Save size={20} />
                                            SIMPAN / SYNC
                                        </button>
                                    )}
                                </div>

                                {/* Status & Progress */}
                                {status.message && (
                                    <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${status.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                                        status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                            'bg-blue-50 border-blue-100 text-blue-700'
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            {status.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> :
                                                status.type === 'error' ? <AlertCircle size={18} className="mt-0.5" /> :
                                                    <Loader2 size={18} className="mt-0.5 animate-spin" />}
                                            <div className="flex-1">
                                                <p className="text-sm font-bold">{status.message}</p>
                                                {loading && (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] font-black uppercase opacity-60 mb-1">
                                                            <span>Memproses...</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-current h-full transition-all duration-300"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Info Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <HelpCircle size={18} className="text-emerald-500" />
                                Tips Sync
                            </h4>
                            <ul className="space-y-4 text-xs font-medium text-slate-500">
                                <li className="flex gap-2">
                                    <span className="text-emerald-500">1.</span>
                                    <span>Gunakan <b>Tarik Data</b> untuk mengisi Sheet buat kali pertama atau overwrite perubahan manual.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-500">2.</span>
                                    <span>Gunakan <b>Simpan / Sync</b> selepas anda mengemaskini data di dalam Google Sheets.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-500">3.</span>
                                    <span>Jangan padam lajur <b>id</b> kerana ia diperlukan untuk mengenalpasti rekod yang berubah.</span>
                                </li>
                                <li className="flex gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="text-emerald-500 font-bold">4.</span>
                                    <div className="space-y-1">
                                        <p className="font-bold text-emerald-800">Tips JSONB:</p>
                                        <p>Gunakan formula <code>=PARSE_JSON(A2, "medan")</code> untuk memecah data JSON ke kolum baru.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/20">
                            <h4 className="font-bold mb-2">Automasi Lanjut</h4>
                            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Untuk laporan dinamik tanpa menekan butang, gunakan formula Google Sheets:</p>
                            <div className="bg-slate-800 p-3 rounded-xl font-mono text-[10px] break-all border border-slate-700 text-emerald-400">
                                =IMPORTHTML(...)
                            </div>
                            <p className="mt-4 text-[10px] text-slate-500 italic">*Hubungi admin untuk setup API Token jika perlu.</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Instructions View */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-2xl font-black mb-3">Panduan Persediaan (Mudah)</h2>
                            <p className="text-slate-500 font-medium">Ikuti 3 langkah mudah di bawah untuk menyambungkan Google Sheet anda dengan sistem database iSantuni.</p>
                        </div>

                        <div className="space-y-16">
                            {/* Step 0: Open Editor */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center font-black shrink-0 shadow-sm border border-slate-200">0</div>
                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold">Buka Editor Script</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Di Google Sheet anda, klik menu <b className="text-slate-900 px-1 bg-slate-100 rounded">Extensions</b> &gt; <b className="text-slate-900 px-1 bg-slate-100 rounded">Apps Script</b>. Satu tab baru akan dibuka.
                                    </p>
                                </div>
                            </div>

                            {/* Step 1: Code.gs */}
                            <div className="flex flex-col md:flex-row gap-8 items-start relative before:absolute before:left-6 before:-top-8 before:w-px before:h-8 before:bg-slate-200">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-200">1</div>
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold">Salin Kod Utama (Code.gs)</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Padam semua kod sedia ada di dalam fail <code className="text-red-500 font-bold bg-red-50 px-1 rounded">Code.gs</code>. Kemudian, klik butang di sebelah dan <b>Paste (Ctrl+V)</b> ke dalam fail tersebut.
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 group hover:border-emerald-200 transition-colors">
                                        <button
                                            onClick={() => copyToClipboard(getGASScript(), 'script')}
                                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                        >
                                            {copiedScript ? <Check className="text-emerald-400" /> : <Copy size={18} />}
                                            {copiedScript ? 'KOD DISALIN!' : 'SALIN KOD CODE.GS'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Index.html */}
                            <div className="flex flex-col md:flex-row gap-8 items-start relative before:absolute before:left-6 before:-top-8 before:w-px before:h-8 before:bg-slate-200">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-200">2</div>
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold">Tambah Fail Panel (Index.html)</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Klik butang <b className="px-1 bg-slate-100 rounded">+ (Tambah fail)</b> &gt; pilih <b className="px-1 bg-slate-100 rounded">HTML</b>. Namakan fail sebagai <b className="text-emerald-600">index</b> (huruf kecil). Pastikan anda <b>Paste</b> kod di bawah ke dalamnya.
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 group hover:border-emerald-200 transition-colors">
                                        <button
                                            onClick={() => copyToClipboard(getGASHtml(), 'html')}
                                            className="w-full bg-white border-2 border-emerald-500 text-emerald-600 py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                                        >
                                            {copiedHtml ? <Check className="text-emerald-400" /> : <Layers size={18} />}
                                            {copiedHtml ? 'KOD DISALIN!' : 'SALIN KOD INDEX.HTML'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Auth */}
                            <div className="flex flex-col md:flex-row gap-8 items-start relative before:absolute before:left-6 before:-top-8 before:w-px before:h-8 before:bg-slate-200">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-200">3</div>
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold">Aktifkan Menu Sync</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed italic">"Simpan fail dahulu (Ctrl+S), kemudian ikuti langkah ini untuk memberi kebenaran kepada Google."</p>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl space-y-6 border-l-4 border-l-amber-500">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Cara Authorize:</p>
                                                <ul className="text-xs text-amber-900/70 space-y-2 ml-4 list-decimal">
                                                    <li>Klik butang <b className="text-amber-900">Run</b> di menu atas.</li>
                                                    <li>Klik <b className="text-amber-900">Review Permissions</b>.</li>
                                                    <li>Pilih akaun Google anda.</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Penting (Advanced):</p>
                                                <p className="text-[10px] text-amber-900/60 leading-relaxed">
                                                    Jika Google kata <i>"Google hasn't verified this app"</i>, klik <b className="text-amber-900">Advanced</b> &gt; <b className="text-amber-900">Go to iSantuni (unsafe)</b> &gt; kemudian klik <b className="text-amber-900">Allow</b>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500 p-4 rounded-2xl flex items-center justify-between text-white shadow-lg shadow-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-2 rounded-lg"><Check /></div>
                                            <p className="text-sm font-bold">Siap! Refresh Google Sheet dan nikmati automasi anda.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-emerald-600 p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-200 mt-12">
                <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-xl font-black">Adakah anda seorang admin?</h3>
                    <p className="text-emerald-100 text-sm opacity-90">Jangan lupa untuk menjalankan SQL di Supabase untuk membolehkan senarai jadual dinamik.</p>
                </div>
                <a
                    href="https://supabase.com/dashboard/project/utddacblhitaoyaneyyk/sql/new"
                    target="_blank"
                    className="bg-white text-emerald-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-50 transition-colors shrink-0"
                >
                    <ExternalLink size={20} />
                    BUKA SQL EDITOR
                </a>
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs font-medium pb-8">
                <p>&copy; 2026 iSantuni Data System • Hidayah Centre Foundation</p>
                <p className="mt-1">Google Sheets Integration Tool v2.0</p>
            </footer>

            <style jsx global>{`
                @keyframes in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in {
                    animation: in 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
