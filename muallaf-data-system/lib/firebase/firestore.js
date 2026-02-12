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
    Timestamp
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
