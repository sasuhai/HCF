import { supabase } from './client';

// Helper to format response
const formatResponse = (data, error, total = 0) => {
    if (error) {
        return { data: null, error: error.message };
    }
    return { data, error: null, total };
};

// Create Submission
export const createSubmission = async (data, userId) => {
    try {
        const submissionData = {
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: userId,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
            status: 'active'
        };

        const { data: newRecord, error } = await supabase
            .from('submissions')
            .insert(submissionData)
            .select()
            .single();

        if (error) throw error;
        return { id: newRecord.id, error: null };
    } catch (error) {
        return { id: null, error: error.message };
    }
};

// Update Submission
export const updateSubmission = async (id, data, userId) => {
    try {
        const { error } = await supabase
            .from('submissions')
            .update({
                ...data,
                updatedAt: new Date().toISOString(),
                updatedBy: userId
            })
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Delete Submission (Admin only - Soft Delete)
export const deleteSubmission = async (id) => {
    try {
        const { error } = await supabase
            .from('submissions')
            .update({
                status: 'deleted',
                deletedAt: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Get Single Submission
export const getSubmission = async (id) => {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

// Get All Submissions with filters
export const getSubmissions = async (filters = {}) => {
    try {
        let query = supabase
            .from('submissions')
            .select('*', { count: 'exact' })
            .eq('status', 'active');

        // Add filters
        if (filters.category) {
            query = query.eq('kategori', filters.category);
        }

        if (filters.state) {
            query = query.eq('negeriCawangan', filters.state);
        }

        if (filters.startDate && filters.endDate) {
            query = query
                .gte('tarikhPengislaman', filters.startDate)
                .lte('tarikhPengislaman', filters.endDate);
        }

        // Order by date
        query = query.order('createdAt', { ascending: false });

        // Pagination
        if (filters.pageSize) {
            const page = filters.page || 0;
            const from = page * filters.pageSize;
            const to = from + filters.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return { data, error: null, total: count };
    } catch (error) {
        return { data: [], error: error.message, total: 0 };
    }
};

// Get Statistics (Simple)
export const getStatistics = async () => {
    try {
        // This is expensive in Supabase if not using specific endpoints or RPC
        // But let's follow logic: total, today, thisMonth

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Separate queries for counts
        const totalPromise = supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'active');
        const todayPromise = supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('createdAt', todayStart);
        const monthPromise = supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('createdAt', monthStart);

        const [totalRes, todayRes, monthRes] = await Promise.all([totalPromise, todayPromise, monthPromise]);

        return {
            data: {
                total: totalRes.count || 0,
                today: todayRes.count || 0,
                thisMonth: monthRes.count || 0
            },
            error: null
        };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

// Get Overall Dashboard Stats
export const getOverallDashboardStats = async (role = 'admin', profile = {}) => {
    try {
        const stats = {
            mualaf: { total: 0, byState: {}, trend: [], recent: [] },
            classes: { total: 0, byState: {} },
            workers: { total: 0, byRole: {} },
            attendance: { trend: [] }
        };

        const isRestricted = role !== 'admin' && !profile?.assignedLocations?.includes('All');
        const allowedLocations = isRestricted ? (profile?.assignedLocations || []) : null;

        // 1. Fetch Mualaf (Submissions)
        // Note: For optimal performance, should use RPC or specialized views.
        // Fetching all data to client for stats is bad practice in SQL, but good for migration parity.
        // I will attempt to fetch needed fields only.

        let mualafQuery = supabase.from('submissions').select('id, negeriCawangan, createdAt, lokasi, namaPenuh, namaAsal, status, bangsa').eq('status', 'active').order('createdAt', { ascending: false });

        if (isRestricted && allowedLocations.length > 0) {
            mualafQuery = mualafQuery.in('lokasi', allowedLocations);
        }

        const { data: mualafData, error: mualafError } = await mualafQuery;

        if (mualafError) throw mualafError;

        // Process Mualaf logic
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const mualafTrendMap = {};
        const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Initialize Trend Map
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const key = getMonthKey(d);
            mualafTrendMap[key] = 0;
        }

        stats.mualaf.total = mualafData.length;

        mualafData.forEach(item => {
            const state = item.negeriCawangan || 'Lain-lain';
            stats.mualaf.byState[state] = (stats.mualaf.byState[state] || 0) + 1;

            if (item.createdAt) {
                const date = new Date(item.createdAt);
                if (date >= sixMonthsAgo) {
                    const key = getMonthKey(date);
                    if (mualafTrendMap[key] !== undefined) {
                        mualafTrendMap[key]++;
                    }
                }
            }
        });

        // Recent 5
        stats.mualaf.recent = mualafData.slice(0, 5).map(item => ({
            ...item,
            displayName: item.namaPenuh || item.namaAsal || 'Tiada Nama'
        }));

        stats.mualaf.trend = Object.entries(mualafTrendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => {
                const [year, month] = date.split('-');
                const monthNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
                const monthIdx = parseInt(month, 10) - 1;
                return { name: monthNames[monthIdx], count };
            });

        // 2. Classes
        let classQuery = supabase.from('classes').select('*');
        if (isRestricted && allowedLocations.length > 0) {
            classQuery = classQuery.in('lokasi', allowedLocations);
        }
        const { data: classData, error: classError } = await classQuery;
        if (classError) throw classError;

        const allowedClassIds = new Set(classData.map(c => c.id));
        stats.classes.total = classData.length;
        classData.forEach(c => {
            const state = c.negeri || 'Lain-lain';
            stats.classes.byState[state] = (stats.classes.byState[state] || 0) + 1;
        });

        // 3. Workers
        let workerQuery = supabase.from('workers').select('*');
        if (isRestricted && allowedLocations.length > 0) {
            workerQuery = workerQuery.in('lokasi', allowedLocations);
        }
        const { data: workerData, error: workerError } = await workerQuery;
        if (workerError) throw workerError;

        stats.workers.total = workerData.length;
        workerData.forEach(w => {
            const role = w.peranan || 'Sukarelawan';
            stats.workers.byRole[role] = (stats.workers.byRole[role] || 0) + 1;
        });

        // 4. Attendance
        // Fetch all attendance records? Or filter by classId?
        // If restricted, we should filter by classId

        let attendanceQuery = supabase.from('attendance_records').select('*');
        if (isRestricted) {
            // Can't do 'classId in allowedClassIds' efficiently if set is large, but usually it's small per user.
            attendanceQuery = attendanceQuery.in('classId', Array.from(allowedClassIds));
        }

        const { data: attendanceData, error: attendanceError } = await attendanceQuery;
        if (attendanceError) throw attendanceError;

        const attendanceTrendMap = {};
        // Initialize map similar to mualaf? 
        // Logic in original code iterates over all records.
        // We need to group by month

        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const key = getMonthKey(d);
            attendanceTrendMap[key] = {
                month: key,
                totalMualafVisits: 0,
                totalWorkerVisits: 0,
                uniqueMualaf: new Set(),
                uniqueWorkers: new Set()
            };
        }

        attendanceData.forEach(record => {
            let { year, month } = record;
            // Handle ID parsing if needed? Logic: "if (!year || !month) ..."
            if (!year || !month && record.id) {
                const part = record.id.split('_').pop();
                if (part && part.includes('-')) [year, month] = part.split('-');
            }

            if (year && month) {
                const key = `${year}-${parseInt(month).toString().padStart(2, '0')}`;
                if (attendanceTrendMap[key]) {
                    const students = record.students || [];
                    const workers = record.workers || [];

                    let mualafVisits = 0;
                    // students is jsonb array
                    if (Array.isArray(students)) {
                        students.forEach(s => {
                            if (s.attendance && Array.isArray(s.attendance)) mualafVisits += s.attendance.length;
                            attendanceTrendMap[key].uniqueMualaf.add(s.id);
                        });
                    }

                    let workerVisits = 0;
                    if (Array.isArray(workers)) {
                        workers.forEach(w => {
                            if (w.attendance && Array.isArray(w.attendance)) workerVisits += w.attendance.length;
                            attendanceTrendMap[key].uniqueWorkers.add(w.id);
                        });
                    }

                    attendanceTrendMap[key].totalMualafVisits += mualafVisits;
                    attendanceTrendMap[key].totalWorkerVisits += workerVisits;
                }
            }
        });

        stats.attendance.trend = Object.entries(attendanceTrendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, val]) => {
                const [year, month] = date.split('-');
                const monthNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
                const monthIdx = parseInt(month, 10) - 1;
                return {
                    name: monthNames[monthIdx],
                    mualafCount: val.uniqueMualaf.size,
                    workerCount: val.uniqueWorkers.size,
                    mualafVisits: val.totalMualafVisits,
                    workerVisits: val.totalWorkerVisits
                };
            });

        return { data: stats, error: null };

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return { data: null, error: error.message };
    }
};


// RATE CATEGORIES MANAGEMENT
export const getRateCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('rateCategories')
            .select('*')
            .order('kategori');

        return { data: data || [], error: error?.message || null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const getRateCategoriesByType = async (jenis) => {
    try {
        const { data, error } = await supabase
            .from('rateCategories')
            .select('*')
            .eq('jenis', jenis)
            .order('kategori');

        return { data: data || [], error: error?.message || null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

export const createRateCategory = async (data, userId) => {
    try {
        const rateData = {
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: userId,
            updatedAt: new Date().toISOString(),
            updatedBy: userId
        };

        const { data: record, error } = await supabase.from('rateCategories').insert(rateData).select().single();
        if (error) throw error;
        return { id: record.id, error: null };
    } catch (error) {
        return { id: null, error: error.message };
    }
};

export const updateRateCategory = async (id, data, userId) => {
    try {
        const { error } = await supabase
            .from('rateCategories')
            .update({
                ...data,
                updatedAt: new Date().toISOString(),
                updatedBy: userId
            })
            .eq('id', id);
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const deleteRateCategory = async (id) => {
    try {
        const { error } = await supabase.from('rateCategories').delete().eq('id', id);
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};


export const initializeDefaultRates = async (defaultRates, userId) => {
    try {
        const batch = defaultRates.map(rate => ({
            ...rate,
            createdAt: new Date().toISOString(),
            createdBy: userId,
            updatedAt: new Date().toISOString(),
            updatedBy: userId
        }));

        const { error } = await supabase.from('rateCategories').insert(batch);
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const getRateByCategory = async (kategori) => {
    try {
        const { data, error } = await supabase
            .from('rateCategories')
            .select('*')
            .eq('kategori', kategori)
            .single();

        if (error) return { data: null, error: 'Kategori tidak dijumpai' }; // or error.message
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const getLocations = async () => {
    try {
        const { data, error } = await supabase
            .from('locations')
            .select('name')
            .order('name');
        if (error) throw error;

        return { data: data.map(d => d.name), error: null };
    } catch (error) {
        console.error("Error fetching locations:", error);
        return { data: [], error: error.message };
    }
};

export const getStates = async () => {
    try {
        const { data, error } = await supabase
            .from('states')
            .select('*')
            .order('name');
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error fetching states:", error);
        return { data: [], error: error.message };
    }
};

// Generic Lookup Management
export const getLookupData = async (table) => {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('name');
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error(`Error fetching from ${table}:`, error);
        return { data: [], error: error.message };
    }
};

export const createLookupItem = async (table, name, extraData = {}) => {
    try {
        const { data, error } = await supabase
            .from(table)
            .insert({ name, ...extraData })
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

export const updateLookupItem = async (table, id, name, extraData = {}) => {
    try {
        const { error } = await supabase
            .from(table)
            .update({ name, ...extraData })
            .eq('id', id);
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

export const deleteLookupItem = async (table, id) => {
    try {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Specialized fetchers for convenience
export const getClassLevels = () => getLookupData('class_levels');
export const getClassTypes = () => getLookupData('class_types');
export const getLocationsTable = () => getLookupData('locations');
