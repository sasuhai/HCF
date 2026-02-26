'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useModal } from '@/contexts/ModalContext';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DebugAttendancePage() {
    const { showAlert, showSuccess, showError, showConfirm } = useModal();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixing, setFixing] = useState(false);

    useEffect(() => {
        scanRecords();
    }, []);

    const scanRecords = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('attendance_records').select('*');

            if (error) throw error;

            const found = [];

            data.forEach(record => {
                const invalidDays = [];
                let hasInvalidMonth = false;

                // Check Month validity
                if (record.month === '34' || parseInt(record.month) > 12) {
                    hasInvalidMonth = true;
                }

                if (hasInvalidMonth) {
                    found.push({
                        id: record.id,
                        type: 'Invalid Record',
                        description: `Invalid Month: ${record.month}`,
                        action: 'DELETE_DOC',
                        data: record
                    });
                    return; // Skip checking days if doc is invalid
                }

                // Check Days in students and workers
                let hasBadDays = false;
                const peopleTypes = ['students', 'workers'];

                peopleTypes.forEach(type => {
                    if (Array.isArray(record[type])) {
                        record[type].forEach(p => {
                            if (Array.isArray(p.attendance)) {
                                p.attendance.forEach(d => {
                                    const val = parseInt(d, 10);
                                    // Check if day is > 31 or invalid
                                    if (isNaN(val) || val < 1 || val > 31) {
                                        invalidDays.push(`${type === 'students' ? 'Pelajar' : 'Petugas'} ${p.nama || p.id}: Day ${d}`);
                                        hasBadDays = true;
                                    }
                                });
                            }
                        });
                    }
                });

                if (hasBadDays) {
                    found.push({
                        id: record.id,
                        type: 'Corrupt Data',
                        description: `Found ${invalidDays.length} invalid attendance entries (e.g. Day 34).`,
                        details: invalidDays,
                        action: 'CLEAN_DATA',
                        data: record
                    });
                }
            });

            setIssues(found);
        } catch (err) {
            console.error(err);
            showError('Ralat Imbasan', 'Ralat mengimbas: ' + err.message);
        }
        setLoading(false);
    };

    const fixIssue = async (issue) => {
        setFixing(true);
        try {
            if (issue.action === 'DELETE_DOC') {
                const { error } = await supabase.from('attendance_records').delete().eq('id', issue.id);
                if (error) throw error;
            } else if (issue.action === 'CLEAN_DATA') {
                const data = issue.data;
                const updates = {};

                if (Array.isArray(data.students)) {
                    updates.students = data.students.map(p => ({
                        ...p,
                        attendance: (p.attendance || []).filter(d => {
                            const val = parseInt(d, 10);
                            return !isNaN(val) && val >= 1 && val <= 31;
                        })
                    }));
                }

                if (Array.isArray(data.workers)) {
                    updates.workers = data.workers.map(p => ({
                        ...p,
                        attendance: (p.attendance || []).filter(d => {
                            const val = parseInt(d, 10);
                            return !isNaN(val) && val >= 1 && val <= 31;
                        })
                    }));
                }

                const { error } = await supabase.from('attendance_records').update(updates).eq('id', issue.id);
                if (error) throw error;
            }
            // Remove fixed issue from list
            setIssues(prev => prev.filter(i => i.id !== issue.id));
        } catch (err) {
            showError('Ralat Baik Pulih', 'Gagal membaiki: ' + err.message);
        }
        setFixing(false);
    };

    const fixAll = async () => {
        showConfirm('Sahkan Semua', 'Adakah anda pasti mahu membaiki semua isu?', async () => {
            setFixing(true);
            // Process sequentially to be safe
            for (const issue of issues) {
                await fixIssue(issue);
            }
            // Rescan to confirm
            await scanRecords();
            setFixing(false);
            showSuccess('Berjaya', 'Semua isu telah dibaiki.');
        });
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 pb-12 pt-16">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-red-500 pl-4">
                                Debug: Corrupt Attendance Records
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 pl-4">
                                Use this tool to identify and remove invalid data causing dashboard errors (e.g. Day 34).
                            </p>
                        </div>
                        <div className="space-x-4">
                            <button
                                onClick={scanRecords}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                disabled={loading || fixing}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Rescan
                            </button>
                            {issues.length > 0 && (
                                <button
                                    onClick={fixAll}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700"
                                    disabled={loading || fixing}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Fix All ({issues.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                            <p className="mt-2 text-gray-500">Scanning database records...</p>
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                            <h3 className="text-lg font-medium text-green-800">No Issues Found</h3>
                            <p className="text-green-600">All attendance records appear valid.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {issues.map(issue => (
                                <div key={issue.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                                {issue.type}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1 font-mono bg-gray-100 inline-block px-1 rounded">ID: {issue.id}</p>
                                            <p className="text-red-700 mt-2 font-medium">{issue.description}</p>
                                            {issue.details && (
                                                <ul className="mt-2 text-xs text-gray-500 list-disc list-inside max-h-32 overflow-y-auto bg-gray-50 p-2 rounded border">
                                                    {issue.details.map((d, i) => (
                                                        <li key={i}>{d}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                onClick={() => fixIssue(issue)}
                                                disabled={fixing}
                                                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                {issue.action === 'DELETE_DOC' ? 'Delete Record' : 'Clean Data'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
