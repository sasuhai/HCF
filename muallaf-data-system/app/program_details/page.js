import React, { Suspense } from 'react';
import ProgramDetailsClient from './ProgramDetailsClient';

export default function ProgramDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16 font-sans">Memuatkan...</div>}>
            <ProgramDetailsClient />
        </Suspense>
    );
}
