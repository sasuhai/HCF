'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// We dynamically import the ENTIRE map logic to ensure no SSR issues
const MapImplementation = dynamic(() => import('./MapImplementation'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center font-bold text-slate-400">Loading Map...</div>
});

export default function MalaysiaMap(props) {
    return <MapImplementation {...props} />;
}
