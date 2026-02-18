'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubmissions } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { Loader2, RefreshCw, Send, Table as TableIcon, LogIn, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

// Sub-component to hold all the logic, isolated from initial mount if needed
function ExcelTaskPaneContent() {
    const { user, role, loading: authLoading, signIn } = useAuth();
    const [officeReady, setOfficeReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedTable, setSelectedTable] = useState('submissions');

    useEffect(() => {
        let mounted = true;

        // Initialize Office.js
        if (typeof window !== 'undefined' && window.Office) {
            window.Office.onReady((info) => {
                if (mounted && info.host === window.Office.HostType.Excel) {
                    setOfficeReady(true);
                    console.log('Office Ready in Excel');
                }
            });
        }

        return () => { mounted = false; };
    }, []);

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

    const loadDataToExcel = async () => {
        if (!officeReady) {
            setStatus({ type: 'error', message: 'Office.js tidak dijumpai. Adakah anda membuka ini dalam Excel?' });
            return;
        }

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

            await window.Excel.run(async (context) => {
                const sheet = context.workbook.worksheets.getActiveWorksheet();
                sheet.activate();
                sheet.getUsedRange().clear();

                const headers = Object.keys(data[0]);
                const values = [headers, ...data.map(item => headers.map(h => {
                    const val = item[h];
                    if (val === null || val === undefined) return '';
                    if (typeof val === 'object') return JSON.stringify(val);
                    return val;
                }))];

                const range = sheet.getRangeByIndexes(0, 0, values.length, headers.length);
                range.values = values;

                const table = sheet.tables.add(range, true);
                table.name = selectedTable + "_Table";
                table.getRange().format.autofitColumns();

                await context.sync();
                setStatus({ type: 'success', message: `Berjaya memuatkan ${data.length} rekod.` });
            });
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const syncChangesFromExcel = async () => {
        if (!officeReady) return;
        if (role !== 'admin' && role !== 'editor') {
            setStatus({ type: 'error', message: 'Akses dinafikan. Anda perlu peranan Admin atau Editor.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Sedang menghantar perubahan...' });

        try {
            await window.Excel.run(async (context) => {
                const sheet = context.workbook.worksheets.getActiveWorksheet();
                const table = sheet.tables.getItem(selectedTable + "_Table");
                const tableRange = table.getDataBodyRange().load("values");
                const headerRange = table.getHeaderRowRange().load("values");

                await context.sync();

                const headers = headerRange.values[0];
                const rows = tableRange.values;
                const idIndex = headers.indexOf('id');

                if (idIndex === -1) {
                    throw new Error("Lajur 'id' tidak dijumpai. Gagal untuk membuat padanan.");
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
                    message: `Selesai: ${successCount} dikemaskini, ${errorCount} gagal.`
                });
            });
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
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
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg text-white">
                        <TableIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-none">Excel Connector</h1>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">HCF iSantuni Database</p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <div className="flex gap-3 text-blue-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                            Sila log masuk menggunakan akaun iSantuni anda untuk mengakses data.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Emel Kakitangan</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-black transition-all"
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
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-black transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                        Log Masuk
                    </button>
                    {status.message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
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
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg text-white">
                    <TableIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-none">Database Tool</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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
                            <option value="submissions">Submissions (Kemasukan Mualaf)</option>
                            <option value="attendance_records">Attendance (Kehadiran Kelas)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={loadDataToExcel}
                        disabled={loading || !officeReady}
                        className="w-full bg-white border-2 border-emerald-600 text-emerald-600 py-3.5 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Tarik Data ke Excel
                    </button>

                    <button
                        onClick={syncChangesFromExcel}
                        disabled={loading || !officeReady || (role !== 'admin' && role !== 'editor')}
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Hantar Perubahan ke DB
                    </button>
                </div>

                {status.message && (
                    <div className={`p-4 rounded-xl border flex gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'error'
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : status.type === 'info'
                                ? 'bg-blue-50 border-blue-100 text-blue-700'
                                : 'bg-green-50 border-green-100 text-green-700'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        <p className="text-sm font-medium leading-tight">{status.message}</p>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 bg-gray-50/50 -mx-6 px-6 pb-6">
                    <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Panduan Ringkas</h2>
                    <ul className="text-xs text-gray-500 space-y-3">
                        <li className="flex gap-2">
                            <span className="font-bold text-emerald-600">1.</span>
                            <span>Klik <strong>Tarik Data</strong> untuk memuatkan rekod.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-emerald-600">2.</span>
                            <span>Lakukan pembersihan data di dalam jadual Excel.</span>
                        </li>
                        <li className="flex gap-2 text-red-600 font-medium">
                            <span className="font-bold">3.</span>
                            <span><strong>JANGAN PADAM</strong> lajur 'id' semasa pembersihan.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-emerald-600">4.</span>
                            <span>Klik <strong>Hantar Perubahan</strong> untuk simpan ke pangkalan data.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="mt-auto pt-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full">
                    <div className={`w-1.5 h-1.5 rounded-full ${officeReady ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                        Office Connection: {officeReady ? 'Live' : 'Connect to Excel'}
                    </span>
                </div>
                <p className="text-[8px] text-gray-300 mt-2 uppercase tracking-wide italic">iSantuni Admin v1.1 • HCF</p>
            </div>
        </div>
    );
}

// Default export with mount guard to prevent SSR/Hydration race conditions
export default function ExcelTaskPane() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-screen bg-white">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Menghubungkan...</p>
            </div>
        );
    }

    return <ExcelTaskPaneContent />;
}

