'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubmissions } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { Loader2, RefreshCw, Send, Table as TableIcon, LogIn, AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet, Info } from 'lucide-react';

function GoogleSheetsContent() {
    const { user, role, loading: authLoading, signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedTable, setSelectedTable] = useState('submissions');

    // Bridge to communicate with Google Apps Script
    const runGAS = (functionName, ...args) => {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);

            const listener = (event) => {
                // Ignore messages not from our parent or not intended for us
                if (event.data?.type === 'GS_RESPONSE' && event.data?.callId === id) {
                    window.removeEventListener('message', listener);
                    if (event.data.error) reject(event.data.error);
                    else resolve(event.data.result);
                }
            };

            window.addEventListener('message', listener);

            // Send request to parent (the GAS Sidebar)
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'GS_REQUEST',
                    callId: id,
                    functionName,
                    args
                }, '*');
            } else {
                window.removeEventListener('message', listener);
                reject('Tool ini mesti dijalankan dari dalam Google Sheets (Sidebar).');
            }

            // Timeout after 45 seconds (increased for large datasets)
            setTimeout(() => {
                window.removeEventListener('message', listener);
                reject('GAS Call Timeout. Sila pastikan anda telah memberikan kebenaran (Authorization) kepada script Google.');
            }, 45000);
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const result = await signIn(email, password);
            if (result.error) throw result.error;
            setStatus({ type: 'success', message: 'Log masuk berjaya!' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const loadDataToSheets = async () => {
        setLoading(true);
        setStatus({ type: 'info', message: `Sedang menarik data ${selectedTable}...` });

        try {
            let data = [];
            if (selectedTable === 'submissions') {
                const res = await getSubmissions({ pageSize: 1500 });
                data = res.data;
            } else if (selectedTable === 'attendance_records') {
                const { data: attData, error } = await supabase.from('attendance_records').select('*').limit(1000);
                if (error) throw error;
                data = attData.map(r => ({
                    id: r.id,
                    classId: r.classId,
                    year: r.year,
                    month: r.month,
                    status: r.status,
                    updatedAt: r.updatedAt
                }));
            }

            if (!data || data.length === 0) {
                setStatus({ type: 'info', message: 'Tiada data dijumpai.' });
                setLoading(false);
                return;
            }

            const headers = Object.keys(data[0]);
            const rows = data.map(item => headers.map(h => {
                const val = item[h];
                if (val === null || val === undefined) return '';
                if (typeof val === 'object') return JSON.stringify(val);
                return val;
            }));

            await runGAS('writeDataToSheet', selectedTable, [headers, ...rows]);

            setStatus({ type: 'success', message: `Berjaya memuatkan ${data.length} rekod ke Google Sheets.` });
        } catch (err) {
            setStatus({ type: 'error', message: 'Gagal: ' + err });
        } finally {
            setLoading(false);
        }
    };

    const syncChangesFromSheets = async () => {
        if (role !== 'admin' && role !== 'editor') {
            setStatus({ type: 'error', message: 'Akses dinafikan. Anda perlu peranan Admin atau Editor.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Sedang membaca data dari Sheets...' });

        try {
            const sheetData = await runGAS('readDataFromSheet', selectedTable);

            if (!sheetData || sheetData.length < 2) {
                setStatus({ type: 'error', message: 'Format data tidak sah atau jadual kosong.' });
                setLoading(false);
                return;
            }

            const headers = sheetData[0];
            const rows = sheetData.slice(1);
            const idIndex = headers.indexOf('id');

            if (idIndex === -1) {
                throw new Error("Lajur 'id' tidak dijumpai.");
            }

            let successCount = 0;
            let errorCount = 0;

            for (const row of rows) {
                const id = row[idIndex];
                if (!id) continue;

                const updateData = {};
                headers.forEach((h, i) => {
                    if (h !== 'id' && h !== 'createdAt' && h !== 'createdBy' && h !== 'updatedAt' && h !== 'updatedBy') {
                        let val = row[i];
                        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                            try { val = JSON.parse(val); } catch (e) { }
                        }
                        updateData[h] = val;
                    }
                });

                const { error } = await supabase
                    .from(selectedTable)
                    .update({
                        ...updateData,
                        updatedAt: new Date().toISOString(),
                        updatedBy: user.id
                    })
                    .eq('id', id);

                if (error) {
                    errorCount++;
                } else {
                    successCount++;
                }
            }

            setStatus({
                type: 'success',
                message: `Sync Selesai: ${successCount} dikemaskini, ${errorCount} gagal.`
            });
        } catch (err) {
            setStatus({ type: 'error', message: 'Gagal Sync: ' + err });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-screen bg-white">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                <p className="text-gray-500">Menyemak akses...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-6 bg-white min-h-screen flex flex-col">
                <div className="flex items-center gap-3 mb-8 border-b pb-4">
                    <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center shadow-lg text-white">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-none">Sheets Connector</h1>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">HCF iSantuni Database</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                    <div className="flex gap-3 text-amber-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                            Sila log masuk menggunakan akaun iSantuni anda.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Emel Kakitangan</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-black transition-all"
                            placeholder="nama@hcf.org.my"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Kata Laluan</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-black transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                        Log Masuk
                    </button>
                    {status.message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {status.message}
                        </div>
                    )}
                </form>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white min-h-screen flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center shadow-lg text-white">
                    <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-none">Sheets Tool</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">User: {role || 'Editor'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Pilih Jadual Data</label>
                    <div className="relative">
                        <select
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-black bg-white appearance-none transition-all shadow-sm"
                            value={selectedTable}
                            onChange={(e) => setSelectedTable(e.target.value)}
                        >
                            <option value="submissions">Submissions (Mualaf)</option>
                            <option value="attendance_records">Attendance (Kehadiran)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={loadDataToSheets}
                        disabled={loading}
                        className="w-full bg-white border-2 border-emerald-600 text-emerald-600 py-3.5 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Tarik ke Google Sheets
                    </button>

                    <button
                        onClick={syncChangesFromSheets}
                        disabled={loading || (role !== 'admin' && role !== 'editor')}
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Hantar Perubahan (Sync)
                    </button>
                </div>

                {status.message && (
                    <div className={`p-4 rounded-xl border flex gap-3 ${status.type === 'error'
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : status.type === 'info'
                                ? 'bg-blue-50 border-blue-100 text-blue-700'
                                : 'bg-green-50 border-green-100 text-green-700'
                        }`}>
                        <p className="text-sm font-medium leading-tight">{status.message}</p>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg flex gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700">
                        <strong>Timeout?</strong> Jika ini kali pertama, pastikan anda telah "Review Permissions" dalam Apps Script editor dan klik "Allow".
                    </p>
                </div>
                <div className="text-[9px] text-gray-400 italic text-center">
                    Mempunyai sambungan selamat ke Google Apps Script.
                </div>
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
