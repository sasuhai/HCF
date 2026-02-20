import React, { Suspense } from 'react';
import EditProgramClient from './EditProgramClient';

export default function EditProgramPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16 font-sans">Memuatkan...</div>}>
            <EditProgramClient />
        </Suspense>
    );
}
