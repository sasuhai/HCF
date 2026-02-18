'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Loader2, RefreshCw, Database, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const NEGERI_OPTIONS = ['SEMUA', 'SELANGOR', 'KUALA LUMPUR', 'JOHOR', 'PULAU PINANG', 'PERAK', 'NEGERI SEMBILAN', 'MELAKA', 'PAHANG', 'TERENGGANU', 'KELANTAN', 'KEDAH', 'PERLIS', 'SABAH', 'SARAWAK', 'LABUAN'];

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

function GoogleSheetsContent() {
    const { user, role, loading: authLoading, signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState({ type: '', message: '' });

    const [selectedTable, setSelectedTable] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('gs_table') || 'submissions';
        return 'submissions';
    });

    const [selectedState, setSelectedState] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('gs_state') || 'SEMUA';
        return 'SEMUA';
    });

    useEffect(() => {
        localStorage.setItem('gs_table', selectedTable);
        localStorage.setItem('gs_state', selectedState);
    }, [selectedTable, selectedState]);

    const getPersistentFingerprints = () => {
        try {
            const data = sessionStorage.getItem(`sync_v33_${selectedTable}`);
            return data ? JSON.parse(data) : {};
        } catch (e) { return {}; }
    };

    const savePersistentFingerprints = (allData) => {
        const fps = {};
        allData.forEach(item => { fps[item.id] = getFingerprint(item); });
        try {
            sessionStorage.setItem(`sync_v33_${selectedTable}`, JSON.stringify(fps));
        } catch (e) { }
    };

    const runGAS = (functionName, ...args) => {
        return new Promise((resolve, reject) => {
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
            setTimeout(() => { window.removeEventListener('message', listener); reject('Timeout'); }, 300000);
        });
    };

    const loadDataToSheets = async () => {
        setLoading(true);
        setProgress(0);
        setStatus({ type: 'info', message: 'Tarik data...' });
        try {
            let allData = [];
            let page = 0, size = 1000, hasMore = true;
            while (hasMore) {
                let q = supabase.from(selectedTable).select('*', { count: 'exact' });
                if (selectedTable === 'submissions') {
                    q = q.eq('status', 'active');
                    if (selectedState !== 'SEMUA') q = q.ilike('negeriCawangan', selectedState);
                }
                const { data, error, count } = await q.range(page * size, (page * size) + size - 1).order('createdAt', { ascending: false });
                if (error) throw error;
                allData = [...allData, ...data];
                setProgress(Math.round((allData.length / count) * 40));
                if (data.length < size) hasMore = false; else page++;
            }

            if (allData.length === 0) throw "Tiada data dikesan.";

            savePersistentFingerprints(allData);

            const headers = Object.keys(allData[0]);
            const finalHeaders = await runGAS('prepareSheet', selectedTable, headers);

            const chunkSize = 2000;
            const totalChunks = Math.ceil(allData.length / chunkSize);
            for (let i = 0; i < totalChunks; i++) {
                const chunk = allData.slice(i * chunkSize, (i + 1) * chunkSize);
                setStatus({ type: 'info', message: `Batch ${i + 1}/${totalChunks}...` });
                const rows = chunk.map(item => finalHeaders.map(h => {
                    const val = item[h];
                    if (val === null || val === undefined) return '';
                    return typeof val === 'object' ? JSON.stringify(val) : val;
                }));
                await runGAS('appendDataToSheet', selectedTable, rows);
                setProgress(40 + Math.round(((i + 1) / totalChunks) * 60));
            }
            setStatus({ type: 'success', message: `${allData.length} rekod dimuatkan.` });
        } catch (err) {
            setStatus({ type: 'error', message: 'Ralat: ' + err });
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        setStatus({ type: 'info', message: 'Membaca Sheet...' });
        try {
            const sheetData = await runGAS('readDataFromSheet', selectedTable);

            // Clean empty rows locally to be safe
            const cleanData = (sheetData || []).filter(row =>
                row && row.some(cell => cell && cell.toString().trim() !== "")
            );

            if (cleanData.length < 2) {
                throw `Sheet '${selectedTable}' nampak kosong. Sila pastikan data anda ada di bawah header.`;
            }

            const headers = cleanData[0];
            const rows = cleanData.slice(1);
            const idIdx = headers.indexOf('id');
            if (idIdx === -1) throw "Lajur 'id' tiada! Klik 'Tarik Data' semula.";

            const fingerprints = getPersistentFingerprints();
            if (Object.keys(fingerprints).length === 0) {
                throw "Sesi Sync tamat. Sila klik 'Tarik Data' sekali lagi sebelum Sync.";
            }

            const toUpdate = [];
            rows.forEach(row => {
                const id = row[idIdx];
                if (!id) return;
                const cur = {};
                headers.forEach((h, j) => {
                    let v = row[j];
                    if (v === "") v = null;
                    cur[h] = v;
                });
                if (fingerprints[id] !== getFingerprint(cur)) toUpdate.push({ id, data: cur });
            });

            if (toUpdate.length === 0) {
                setStatus({ type: 'success', message: 'Tiada perubahan dikesan.' });
                setLoading(false);
                return;
            }

            setStatus({ type: 'info', message: `Menyimpan ${toUpdate.length} rekod...` });
            let success = 0, fail = 0;
            for (let i = 0; i < toUpdate.length; i++) {
                const { id, data } = toUpdate[i];
                const p = {};
                headers.forEach(h => { if (!['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'].includes(h)) p[h] = data[h]; });
                const { error } = await supabase.from(selectedTable).update({ ...p, updatedAt: new Date().toISOString(), updatedBy: user.id }).eq('id', id);
                if (error) fail++; else success++;
                setProgress(Math.round(((i + 1) / toUpdate.length) * 100));
            }
            setStatus({ type: fail > 0 ? 'error' : 'success', message: `Selesai: ${success} berjaya, ${fail} gagal.` });
        } catch (err) {
            setStatus({ type: 'error', message: 'Ralat Sync: ' + err });
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-600 w-8 h-8" /></div>;
    if (!user) return <div className="p-10 text-center font-bold text-gray-400">Log Masuk iSantuni diperlukan.</div>;

    return (
        <div className="p-6 bg-white min-h-screen">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b">
                <Database className="text-emerald-700" />
                <h1 className="text-xl font-bold text-gray-800">iSantuni v3.3</h1>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Jadual</label>
                    <select className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold bg-gray-50 text-sm" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
                        <option value="submissions">Submissions</option>
                        <option value="attendance_records">Attendance</option>
                    </select>
                </div>

                <div className="bg-emerald-50 p-5 rounded-3xl border-2 border-emerald-100">
                    <label className="text-[10px] font-black text-emerald-800 uppercase block mb-3 opacity-60">Negeri</label>
                    <select className="w-full p-3 border-0 rounded-xl font-bold bg-white" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
                        {NEGERI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <button onClick={loadDataToSheets} disabled={loading} className="w-full bg-white border-4 border-emerald-600 text-emerald-600 py-4 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={18} /> TARIK DATA
                    </button>
                    <button onClick={handleSync} disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                        <Save size={18} /> SIMPAN / SYNC
                    </button>
                </div>

                {loading && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-emerald-700 uppercase"><span>{status.message}</span><span>{progress}%</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
                    </div>
                )}

                {status.message && !loading && (
                    <div className={`p-4 rounded-2xl border-2 text-xs font-bold leading-relaxed shadow-sm ${status.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GoogleSheetsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <GoogleSheetsContent />;
}
