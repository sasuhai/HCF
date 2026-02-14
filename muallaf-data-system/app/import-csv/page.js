'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { createSubmission } from '@/lib/supabase/database';

export default function ImportPage() {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);

    const loadData = async () => {
        setStatus('loading');
        setLogs(prev => ['Fetching data from API...', ...prev]);
        try {
            const res = await fetch('/api/read-csv');
            const json = await res.json();

            if (json.error) throw new Error(json.error);

            setData(json.data);
            setStatus('loaded');
            setLogs(prev => [`Loaded ${json.data.length} records. Ready to import.`, ...prev]);
        } catch (e) {
            setStatus('error');
            setLogs(prev => [`Error loading data: ${e.message}`, ...prev]);
        }
    };

    const processDate = (dateStr) => {
        if (!dateStr) return '';
        const cleanStr = dateStr.trim();

        // 1. Try ISO YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;

        // 2. Try Manual parse for dd/MM/yyyy (e.g. 23/12/2020) FIRST because native fails sometimes or assumes MM/DD/YYYY
        // Check for DD/MM/YYYY or D/M/YYYY
        const dmyMatch = cleanStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (dmyMatch) {
            const day = dmyMatch[1].padStart(2, '0');
            const month = dmyMatch[2].padStart(2, '0');
            const year = dmyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // 3. Try simple JS Date (Handles 13-Apr-2018 well)
        // 13-Apr-2018 -> Works.
        const d = new Date(cleanStr);
        if (!isNaN(d.getTime())) {
            const iso = d.toISOString().split('T')[0];
            if (iso.startsWith('19') || iso.startsWith('20')) return iso;
        }

        return cleanStr; // Return original if all fail
    };

    const runImport = async () => {
        if (!user) {
            alert('User not authenticated');
            return;
        }
        setStatus('importing');
        let successCount = 0;
        let failCount = 0;

        const total = data.length;

        for (let i = 0; i < total; i++) {
            const row = data[i];

            // Format Data
            const submissionData = {
                ...row,
                tarikhPengislaman: processDate(row.tarikhPengislaman),
                pendapatanBulanan: row.pendapatanBulanan ? row.pendapatanBulanan.toString() : '',
                status: 'active'
            };

            try {
                const { id, error } = await createSubmission(submissionData, user.id);

                if (error) {
                    setLogs(prev => [`[${i + 1}/${total}] Failed: ${row.namaIslam || 'Record'} - ${error}`, ...prev]);
                    failCount++;
                } else {
                    if (i % 10 === 0) {
                        setLogs(prev => [`[${i + 1}/${total}] Imported: ${row.namaIslam || row.namaAsal}`, ...prev]);
                    }
                    successCount++;
                }
            } catch (err) {
                setLogs(prev => [`[${i + 1}/${total}] Error: ${err.message}`, ...prev]);
                failCount++;
            }

            if (i % 20 === 0) await new Promise(r => setTimeout(r, 10));
        }
        setStatus('done');
        setLogs(prev => [`FINISHED. Success: ${successCount}, Failed: ${failCount}`, ...prev]);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-6xl mx-auto p-8">
                    <h1 className="text-2xl font-bold mb-4 text-gray-800">CSV Import Utility</h1>
                    <p className="mb-4 text-gray-600">Reads local file: <code className="bg-gray-200 px-1 rounded">/Users/sasuhai/Desktop/HCFBTR/SPO2025.csv</code></p>

                    <div className="space-x-4 mb-6">
                        <button
                            onClick={loadData}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow disabled:opacity-50"
                            disabled={status === 'importing' || status === 'loading'}
                        >
                            {status === 'loading' ? 'Loading...' : '1. Load CSV Data'}
                        </button>

                        <button
                            onClick={runImport}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={status !== 'loaded'}
                        >
                            2. Start Import ({data.length} Records)
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Import Log</h3>
                            <div className="bg-black text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-xs border border-gray-800 shadow-inner">
                                {logs.length === 0 && <span className="text-gray-500">Waiting to start...</span>}
                                {logs.map((L, i) => <div key={i} className="mb-1">{L}</div>)}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Data Preview (First 3)</h3>
                            {data.length > 0 ? (
                                <div className="bg-white p-4 rounded h-96 overflow-y-auto border border-gray-200 text-xs shadow-sm">
                                    <pre>{JSON.stringify(data.slice(0, 3), null, 2)}</pre>
                                </div>
                            ) : (
                                <div className="bg-gray-100 p-4 rounded h-96 flex items-center justify-center text-gray-400 text-sm">
                                    No Data Loaded
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
