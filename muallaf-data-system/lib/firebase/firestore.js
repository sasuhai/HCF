import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    setDoc
} from 'firebase/firestore';
import { db } from './config';

// Create Submission
export const createSubmission = async (data, userId) => {
    try {
        const submissionData = {
            ...data,
            createdAt: Timestamp.now(),
            createdBy: userId,
            updatedAt: Timestamp.now(),
            updatedBy: userId,
            status: 'active'
        };

        const docRef = await addDoc(collection(db, 'submissions'), submissionData);
        return { id: docRef.id, error: null };
    } catch (error) {
        return { id: null, error: error.message };
    }
};

// Update Submission
export const updateSubmission = async (id, data, userId) => {
    try {
        const submissionRef = doc(db, 'submissions', id);
        await updateDoc(submissionRef, {
            ...data,
            updatedAt: Timestamp.now(),
            updatedBy: userId
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Delete Submission (Admin only)
export const deleteSubmission = async (id) => {
    try {
        const submissionRef = doc(db, 'submissions', id);
        await updateDoc(submissionRef, {
            status: 'deleted',
            deletedAt: Timestamp.now()
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Get Single Submission
export const getSubmission = async (id) => {
    try {
        const docRef = doc(db, 'submissions', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
        } else {
            return { data: null, error: 'Rekod tidak dijumpai' };
        }
    } catch (error) {
        return { data: null, error: error.message };
    }
};

// Get All Submissions with filters
export const getSubmissions = async (filters = {}) => {
    try {
        let q = query(collection(db, 'submissions'), where('status', '==', 'active'));

        // Add filters
        if (filters.category) {
            q = query(q, where('kategori', '==', filters.category));
        }

        if (filters.state) {
            q = query(q, where('negeriCawangan', '==', filters.state));
        }

        if (filters.startDate && filters.endDate) {
            q = query(
                q,
                where('tarikhPengislaman', '>=', filters.startDate),
                where('tarikhPengislaman', '<=', filters.endDate)
            );
        }

        // Order by date
        q = query(q, orderBy('createdAt', 'desc'));

        // Pagination
        if (filters.pageSize) {
            q = query(q, limit(filters.pageSize));
        }

        if (filters.lastDoc) {
            q = query(q, startAfter(filters.lastDoc));
        }

        const querySnapshot = await getDocs(q);
        const submissions = [];
        querySnapshot.forEach((doc) => {
            submissions.push({ id: doc.id, ...doc.data() });
        });

        return { data: submissions, error: null, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
    } catch (error) {
        return { data: [], error: error.message, lastDoc: null };
    }
};

// Get Statistics
// Get Statistics (Legacy / Simple stats)
export const getStatistics = async () => {
    try {
        const q = query(collection(db, 'submissions'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalRecords = 0;
        let todayRecords = 0;
        let monthRecords = 0;

        querySnapshot.forEach((doc) => {
            totalRecords++;
            const data = doc.data();
            const createdAt = data.createdAt.toDate();

            if (createdAt >= todayStart) {
                todayRecords++;
            }

            if (createdAt >= monthStart) {
                monthRecords++;
            }
        });

        return {
            data: {
                total: totalRecords,
                today: todayRecords,
                thisMonth: monthRecords
            },
            error: null
        };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

// Get Overall Dashboard Stats (Mualaf, Classes, Workers, Attendance)
export const getOverallDashboardStats = async () => {
    try {
        const stats = {
            mualaf: { total: 0, byState: {}, trend: [], recent: [] },
            classes: { total: 0, byState: {} },
            workers: { total: 0, byRole: {} },
            attendance: { trend: [] }
        };

        // 1. Fetch Mualaf (Submissions)
        const mualafQuery = query(collection(db, 'submissions'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
        const mualafSnap = await getDocs(mualafQuery);

        stats.mualaf.total = mualafSnap.size;

        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const mualafTrendMap = {};
        const attendanceTrendMap = {};

        const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const key = getMonthKey(d);
            mualafTrendMap[key] = 0;
            attendanceTrendMap[key] = {
                month: key,
                totalMualafVisits: 0,
                totalWorkerVisits: 0,
                uniqueMualaf: new Set(),
                uniqueWorkers: new Set()
            };
        }

        mualafSnap.docs.forEach((doc, index) => {
            const data = doc.data();
            const state = data.negeriCawangan || 'Lain-lain';
            stats.mualaf.byState[state] = (stats.mualaf.byState[state] || 0) + 1;

            if (data.createdAt) {
                const date = data.createdAt.toDate();
                if (date >= sixMonthsAgo) {
                    const key = getMonthKey(date);
                    if (mualafTrendMap[key] !== undefined) {
                        mualafTrendMap[key]++;
                    }
                }
            }

            if (index < 5) {
                // Ensure name is present, check possible fields
                const name = data.namaPenuh || data.nama || data.namaAsal || 'Tiada Nama';
                stats.mualaf.recent.push({
                    id: doc.id,
                    ...data,
                    displayName: name, // Helper field
                    createdAt: data.createdAt
                });
            }
        });

        // 2. Fetch Classes (All)
        const classesSnap = await getDocs(collection(db, 'classes'));
        stats.classes.total = classesSnap.size;

        classesSnap.forEach(doc => {
            const data = doc.data();
            const state = data.negeri || 'Lain-lain';
            stats.classes.byState[state] = (stats.classes.byState[state] || 0) + 1;
        });


        // 3. Fetch Workers (From 'workers' collection)
        const workersSnap = await getDocs(collection(db, 'workers'));
        stats.workers.total = workersSnap.size;

        workersSnap.forEach(doc => {
            const data = doc.data();
            const role = data.peranan || 'Sukarelawan';
            stats.workers.byRole[role] = (stats.workers.byRole[role] || 0) + 1;
        });

        // 4. Attendance Trends
        const attendanceSnap = await getDocs(collection(db, 'attendance_records'));

        attendanceSnap.forEach(doc => {
            const data = doc.data();
            let year = data.year;
            let month = data.month;

            if (!year || !month) {
                const parts = doc.id.split('_');
                const datePart = parts[parts.length - 1];
                if (datePart && datePart.includes('-')) {
                    [year, month] = datePart.split('-');
                }
            }

            if (year && month) {
                // Handle single digit month from split
                const key = `${year}-${parseInt(month).toString().padStart(2, '0')}`;

                if (attendanceTrendMap[key]) {
                    const students = data.students || [];
                    const workers = data.workers || [];

                    let mualafVisits = 0;
                    students.forEach(s => {
                        if (s.attendance && Array.isArray(s.attendance)) mualafVisits += s.attendance.length;
                        attendanceTrendMap[key].uniqueMualaf.add(s.id);
                    });

                    let workerVisits = 0;
                    workers.forEach(w => {
                        if (w.attendance && Array.isArray(w.attendance)) workerVisits += w.attendance.length;
                        attendanceTrendMap[key].uniqueWorkers.add(w.id);
                    });

                    attendanceTrendMap[key].totalMualafVisits += mualafVisits;
                    attendanceTrendMap[key].totalWorkerVisits += workerVisits;
                }
            }
        });

        const monthNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

        stats.mualaf.trend = Object.entries(mualafTrendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => {
                const [year, month] = date.split('-');
                const monthIdx = parseInt(month, 10) - 1;
                return { name: monthNames[monthIdx], count };
            });

        stats.attendance.trend = Object.entries(attendanceTrendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, data]) => {
                const [year, month] = date.split('-');
                const monthIdx = parseInt(month, 10) - 1;
                return {
                    name: monthNames[monthIdx],
                    mualafCount: data.uniqueMualaf.size,
                    workerCount: data.uniqueWorkers.size,
                    mualafVisits: data.totalMualafVisits,
                    workerVisits: data.totalWorkerVisits
                };
            });

        return { data: stats, error: null };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return { data: null, error: error.message };
    }
};

// ============================================
// RATE CATEGORIES MANAGEMENT
// ============================================

// Get All Rate Categories
export const getRateCategories = async () => {
    try {
        const q = query(collection(db, 'rateCategories'), orderBy('kategori'));
        const querySnapshot = await getDocs(q);
        const rates = [];
        querySnapshot.forEach((doc) => {
            rates.push({ id: doc.id, ...doc.data() });
        });
        return { data: rates, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

// Get Rate Categories by Type (mualaf or petugas)
export const getRateCategoriesByType = async (jenis) => {
    try {
        const q = query(
            collection(db, 'rateCategories'),
            where('jenis', '==', jenis),
            orderBy('kategori')
        );
        const querySnapshot = await getDocs(q);
        const rates = [];
        querySnapshot.forEach((doc) => {
            rates.push({ id: doc.id, ...doc.data() });
        });
        return { data: rates, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

// Create Rate Category
export const createRateCategory = async (data, userId) => {
    try {
        const rateData = {
            ...data,
            createdAt: Timestamp.now(),
            createdBy: userId,
            updatedAt: Timestamp.now(),
            updatedBy: userId
        };

        const docRef = await addDoc(collection(db, 'rateCategories'), rateData);
        return { id: docRef.id, error: null };
    } catch (error) {
        return { id: null, error: error.message };
    }
};

// Update Rate Category
export const updateRateCategory = async (id, data, userId) => {
    try {
        const rateRef = doc(db, 'rateCategories', id);
        await updateDoc(rateRef, {
            ...data,
            updatedAt: Timestamp.now(),
            updatedBy: userId
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Delete Rate Category
export const deleteRateCategory = async (id) => {
    try {
        const rateRef = doc(db, 'rateCategories', id);
        await deleteDoc(rateRef);
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Initialize Default Rate Categories
export const initializeDefaultRates = async (defaultRates, userId) => {
    try {
        const batch = [];
        for (const rate of defaultRates) {
            const rateData = {
                ...rate,
                createdAt: Timestamp.now(),
                createdBy: userId,
                updatedAt: Timestamp.now(),
                updatedBy: userId
            };
            batch.push(addDoc(collection(db, 'rateCategories'), rateData));
        }
        await Promise.all(batch);
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Get Rate for a specific category
export const getRateByCategory = async (kategori) => {
    try {
        const q = query(
            collection(db, 'rateCategories'),
            where('kategori', '==', kategori)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { data: { id: doc.id, ...doc.data() }, error: null };
        }
        return { data: null, error: 'Kategori tidak dijumpai' };
    } catch (error) {
        return { data: null, error: error.message };
    }
};

// Get list of distinct locations from classes
export const getLocations = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'classes'));
        const locations = new Set(querySnapshot.docs.map(doc => doc.data().lokasi).filter(Boolean));
        return { data: Array.from(locations).sort(), error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};
