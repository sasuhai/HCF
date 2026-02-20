import { supabase } from './client';

// Helper to format response
const formatResponse = (data, error, total = 0) => {
    if (error) {
        return { data: null, error: error.message };
    }
    return { data, error: null, total };
};

// Internal helper to fetch ALL records from a query by handling Supabase's 1000-record limit
const fetchAll = async (queryBuilder) => {
    let allData = [];
    let page = 0;
    const size = 1000;
    let hasMore = true;
    let totalCount = 0;

    while (hasMore) {
        const from = page * size;
        const to = from + size - 1;

        // Use range on a COPY of the query to avoid mutation issues if any
        // In current supabase-js, .range() returns a new builder instance.
        const { data, error, count } = await queryBuilder.range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
            allData = allData.concat(data);
            totalCount = count;
            if (data.length < size) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }

    return { data: allData, count: totalCount };
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
            .from('mualaf')
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
            .from('mualaf')
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
            .from('mualaf')
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
            .from('mualaf')
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
// Get All Submissions with filters
export const getSubmissions = async (filters = {}) => {
    try {
        let query = supabase
            .from('mualaf')
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
            const { data, error, count } = await query.range(from, to);
            if (error) throw error;
            return { data, error: null, total: count };
        } else {
            // Fetch ALL records using the helper
            const { data, count } = await fetchAll(query);
            return { data, error: null, total: count };
        }

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
        const totalPromise = supabase.from('mualaf').select('id', { count: 'exact', head: true }).eq('status', 'active');
        const todayPromise = supabase.from('mualaf').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('createdAt', todayStart);
        const monthPromise = supabase.from('mualaf').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('createdAt', monthStart);

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
            mualaf: { total: 0, byState: [], byStateCounts: {}, stateTrends: {}, trend: [], recent: [] },
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

        let mualafQuery = supabase.from('mualaf').select('id, negeriCawangan, createdAt, lokasi, namaPenuh, namaAsal, status, bangsa, tarikhPengislaman, kategori').eq('status', 'active').order('createdAt', { ascending: false });

        if (isRestricted && allowedLocations.length > 0) {
            mualafQuery = mualafQuery.in('lokasi', allowedLocations);
        }

        const { data: mualafData } = await fetchAll(mualafQuery);

        // Process Mualaf logic
        const now = new Date();
        const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Find the absolute minimum year in data
        let absMinYear = 2012; // Default floor
        mualafData.forEach(item => {
            if (item.createdAt) {
                const y = new Date(item.createdAt).getFullYear();
                if (y < absMinYear && y > 1900) absMinYear = y;
            }
            if (item.tarikhPengislaman) {
                const y = new Date(item.tarikhPengislaman).getFullYear();
                if (y < absMinYear && y > 1900) absMinYear = y;
            }
        });

        const minYear = absMinYear;
        const currentYear = now.getFullYear();
        stats.mualaf.availableYears = Array.from({ length: currentYear - minYear + 1 }, (_, i) => minYear + i);

        stats.mualaf.rawData = mualafData; // Pass raw data for client-side aggregation
        const yearlyTrendMap = {};
        for (let y = minYear; y <= currentYear; y++) {
            yearlyTrendMap[y] = { registrations: 0, conversions: 0 };
        }


        // Prepare Monthly Trend Map (All months from 2012)
        const monthlyTrendMap = {};
        let tempDate = new Date(minYear, 0, 1);
        while (tempDate <= now) {
            const key = getMonthKey(tempDate);
            monthlyTrendMap[key] = { registrations: 0, conversions: 0 };
            tempDate.setMonth(tempDate.getMonth() + 1);
        }

        const mualafByLocation = {}; // { locationName: count }
        const locationTrendMap = {}; // { locationName: { monthKey: { registrations, conversions } } }
        const stateTrendMap = {};    // { stateName: { monthKey: { registrations, conversions } } }

        stats.mualaf.total = mualafData.length;

        mualafData.forEach(item => {
            const state = item.negeriCawangan || 'Lain-lain';
            stats.mualaf.byStateCounts[state] = (stats.mualaf.byStateCounts[state] || 0) + 1;

            const loc = item.lokasi || 'Tiada Lokasi';
            mualafByLocation[loc] = (mualafByLocation[loc] || 0) + 1;

            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const year = date.getFullYear();
                const monKey = getMonthKey(date);

                if (yearlyTrendMap[year]) yearlyTrendMap[year].registrations++;
                if (monthlyTrendMap[monKey]) monthlyTrendMap[monKey].registrations++;

                // Per location trend
                if (monthlyTrendMap[monKey]) {
                    if (!locationTrendMap[loc]) locationTrendMap[loc] = {};
                    if (!locationTrendMap[loc][monKey]) locationTrendMap[loc][monKey] = { registrations: 0, conversions: 0 };
                    locationTrendMap[loc][monKey].registrations++;

                    if (!stateTrendMap[state]) stateTrendMap[state] = {};
                    if (!stateTrendMap[state][monKey]) stateTrendMap[state][monKey] = { registrations: 0, conversions: 0 };
                    stateTrendMap[state][monKey].registrations++;
                }
            }

            if (item.kategori === 'Pengislaman') {
                const convDateStr = item.tarikhPengislaman || item.createdAt;
                if (convDateStr) {
                    const date = new Date(convDateStr);
                    const year = date.getFullYear();
                    const monKey = getMonthKey(date);

                    if (yearlyTrendMap[year]) yearlyTrendMap[year].conversions++;
                    if (monthlyTrendMap[monKey]) monthlyTrendMap[monKey].conversions++;

                    // Per location/state trend
                    if (monthlyTrendMap[monKey]) {
                        if (!locationTrendMap[loc]) locationTrendMap[loc] = {};
                        if (!locationTrendMap[loc][monKey]) locationTrendMap[loc][monKey] = { registrations: 0, conversions: 0 };
                        locationTrendMap[loc][monKey].conversions++;

                        if (!stateTrendMap[state]) stateTrendMap[state] = {};
                        if (!stateTrendMap[state][monKey]) stateTrendMap[state][monKey] = { registrations: 0, conversions: 0 };
                        stateTrendMap[state][monKey].conversions++;
                    }
                }
            }
        });

        // Recent 5
        stats.mualaf.recent = mualafData.slice(0, 5).map(item => ({
            ...item,
            displayName: item.namaPenuh || item.namaAsal || 'Tiada Nama'
        }));

        const monthNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

        // Format state data
        stats.mualaf.byState = Object.entries(stats.mualaf.byStateCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }));

        // Format location data
        stats.mualaf.byLocation = Object.entries(mualafByLocation)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }));

        // Format location trends
        stats.mualaf.locationTrends = {};
        Object.entries(locationTrendMap).forEach(([loc, months]) => {
            stats.mualaf.locationTrends[loc] = Object.entries(monthlyTrendMap)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([key]) => {
                    const [year, mon] = key.split('-');
                    const data = months[key] || { registrations: 0, conversions: 0 };
                    return {
                        key,
                        name: `${monthNames[parseInt(mon) - 1]} ${year.substring(2)}`,
                        registrations: data.registrations,
                        conversions: data.conversions
                    };
                });
        });

        // Format state trends
        stats.mualaf.stateTrends = {};
        stats.mualaf.stateStats = {};
        Object.entries(stateTrendMap).forEach(([state, months]) => {
            let regTotal = 0;
            let convTotal = 0;

            stats.mualaf.stateTrends[state] = Object.entries(monthlyTrendMap)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([key]) => {
                    const [year, mon] = key.split('-');
                    const data = months[key] || { registrations: 0, conversions: 0 };
                    regTotal += data.registrations;
                    convTotal += data.conversions;
                    return {
                        key,
                        name: `${monthNames[parseInt(mon) - 1]} ${year.substring(2)}`,
                        registrations: data.registrations,
                        conversions: data.conversions
                    };
                });

            stats.mualaf.stateStats[state] = { registrations: regTotal, conversions: convTotal };
        });

        // Add location stats aggregation
        stats.mualaf.locationStats = {};
        Object.entries(locationTrendMap).forEach(([loc, months]) => {
            let regTotal = 0;
            let convTotal = 0;
            Object.values(months).forEach(m => {
                regTotal += m.registrations;
                convTotal += m.conversions;
            });
            stats.mualaf.locationStats[loc] = { registrations: regTotal, conversions: convTotal };
        });

        stats.mualaf.trend = Object.entries(yearlyTrendMap)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([year, data]) => ({
                name: year,
                registrations: data.registrations,
                conversions: data.conversions
            }));

        stats.mualaf.monthlyTrend = Object.entries(monthlyTrendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, data]) => {
                const [year, mon] = key.split('-');
                return {
                    key: key, // Keep YYYY-MM for sorting/filtering
                    name: `${monthNames[parseInt(mon) - 1]} ${year.substring(2)}`,
                    registrations: data.registrations,
                    conversions: data.conversions
                };
            });

        // 2. Classes
        let classQuery = supabase.from('classes').select('*');
        if (isRestricted && allowedLocations.length > 0) {
            classQuery = classQuery.in('lokasi', allowedLocations);
        }
        const { data: classData } = await fetchAll(classQuery);

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
        const { data: workerData } = await fetchAll(workerQuery);

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

        const { data: attendanceData } = await fetchAll(attendanceQuery);

        const attendanceTrendMap = {};
        // Initialize map similar to mualaf? 
        // Logic in original code iterates over all records.
        // We need to group by month

        let attDate = new Date(minYear, 0, 1);
        while (attDate <= now) {
            const key = getMonthKey(attDate);
            attendanceTrendMap[key] = {
                month: key,
                totalMualafVisits: 0,
                totalWorkerVisits: 0,
                uniqueMualaf: new Set(),
                uniqueWorkers: new Set()
            };
            attDate.setMonth(attDate.getMonth() + 1);
        }

        attendanceData.forEach(record => {
            let { year, month } = record;

            // Handle ID parsing if fields are missing (ID format: classId_YYYY-MM)
            if ((!year || !month) && record.id) {
                const parts = record.id.split('_');
                const datePart = parts[parts.length - 1]; // Get the YYYY-MM part
                if (datePart && datePart.includes('-')) {
                    const [y, m] = datePart.split('-');
                    year = y;
                    month = m;
                }
            }

            if (year && month) {
                // Ensure month is just the 1-12 numeric part (some records have YYYY-MM in the month field)
                let monthNum = String(month);
                if (monthNum.includes('-')) {
                    monthNum = monthNum.split('-').pop(); // Get the "MM" part
                }

                const key = `${year}-${String(parseInt(monthNum)).padStart(2, '0')}`;
                if (attendanceTrendMap[key]) {
                    const students = record.students || [];
                    const workers = record.workers || [];

                    // students is jsonb array
                    if (Array.isArray(students)) {
                        students.forEach(s => {
                            // Only count if they have at least one attendance day recorded
                            if (s.attendance && Array.isArray(s.attendance) && s.attendance.length > 0) {
                                attendanceTrendMap[key].uniqueMualaf.add(s.id);
                                attendanceTrendMap[key].totalMualafVisits += s.attendance.length;
                            }
                        });
                    }

                    if (Array.isArray(workers)) {
                        workers.forEach(w => {
                            if (w.attendance && Array.isArray(w.attendance) && w.attendance.length > 0) {
                                attendanceTrendMap[key].uniqueWorkers.add(w.id);
                                attendanceTrendMap[key].totalWorkerVisits += w.attendance.length;
                            }
                        });
                    }
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
                    key: date, // Keep YYYY-MM for filtering
                    name: `${monthNames[monthIdx]} ${year.substring(2)}`,
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
export const getLookupData = async (table, orderFields = ['name']) => {
    try {
        let query = supabase.from(table).select('*');
        if (orderFields && orderFields.length > 0) {
            orderFields.forEach(field => {
                query = query.order(field);
            });
        }
        const { data, error } = await query;
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
