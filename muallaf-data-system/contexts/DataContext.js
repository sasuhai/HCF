'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
    const [submissions, setSubmissions] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [needsRefresh, setNeedsRefresh] = useState({
        submissions: true, // Initial fetch needed
        workers: true,
        classes: true
    });

    const markAsDirty = useCallback((type) => {
        setNeedsRefresh(prev => ({
            ...prev,
            [type]: true
        }));
    }, []);

    const markAsClean = useCallback((type) => {
        setNeedsRefresh(prev => ({
            ...prev,
            [type]: false
        }));
    }, []);

    const value = {
        submissions,
        setSubmissions,
        workers,
        setWorkers,
        classes,
        setClasses,
        needsRefresh,
        markAsDirty,
        markAsClean
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
