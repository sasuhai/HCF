/**
 * Calculates KPI metrics for a Mualaf record based on follow-up data and entry dates.
 * 
 * Criteria (25% each):
 * 1. Hubungi dlm tempoh 48 jam (BA)
 * 2. Daftar Pengislaman dlm tempoh 2 minggu (BB)
 * 3. Usaha aturkan kelas dalam tempoh 1 bulan (BC)
 * 4. Key-in data dalam 7 hari bekerja (AY/AZ)
 */
export const calculateKPI = (record, kpiData = {}) => {
    // 1. Key-in calculation (AY/AZ)
    // We use tarikhPengislaman (event date) vs createdAt (system entry date)
    const eventDate = record.tarikhPengislaman ? new Date(record.tarikhPengislaman) : null;
    const entryDate = record.createdAt ? new Date(record.createdAt) : new Date();

    let daysTaken = 0;
    let isKeyInOnTime = false;

    if (eventDate) {
        const diffTime = entryDate - eventDate;
        daysTaken = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        // Logic: Pass if within 7 days
        isKeyInOnTime = daysTaken <= 7;
    } else {
        // If no event date, we can't calculate delay, assume on time if just created
        isKeyInOnTime = true;
    }

    // 2. Score calculation (BG)
    const criteria = [
        !!kpiData.hubungi48j,
        !!kpiData.daftar2m,
        !!kpiData.kelas1b,
        isKeyInOnTime
    ];

    const completedCount = criteria.filter(val => val === true).length;
    const score = (completedCount / criteria.length) * 100;

    // 3. Status determination
    let status = 'Belum Disusuli';
    if (score === 100) {
        status = 'Selesai';
    } else if (score > 0) {
        status = 'Sedang Disusuli';
    }

    return {
        ...kpiData,
        metrics: {
            daysTakenToKeyIn: daysTaken,
            isKeyInOnTime,
            followUpScore: score,
            overallStatus: status,
            calculatedAt: new Date().toISOString()
        }
    };
};
