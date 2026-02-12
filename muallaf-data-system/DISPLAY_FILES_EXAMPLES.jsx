/**
 * Example: How to Display Base64 Files
 * 
 * Use this code in your detail/list pages to show uploaded files
 */

// ============================================
// 1. DISPLAY IMAGE FROM BASE64
// ============================================

// Simple image display
function ImageDisplay({ fileData }) {
    if (!fileData || !fileData.data) return null;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
                {fileData.name}
            </label>
            <img
                src={fileData.data}
                alt={fileData.name}
                className="max-w-md rounded-lg shadow-md border"
            />
            <p className="text-xs text-gray-500">
                Uploaded: {new Date(fileData.uploadedAt).toLocaleDateString()}
            </p>
        </div>
    );
}

// Usage:
// <ImageDisplay fileData={submission.gambarIC} />


// ============================================
// 2. DOWNLOAD FILE BUTTON
// ============================================

import { downloadBase64File } from '@/lib/firebase/storage';
import { Download } from 'lucide-react';

function DownloadButton({ fileData }) {
    if (!fileData || !fileData.data) return null;

    return (
        <button
            onClick={() => downloadBase64File(fileData.data, fileData.name)}
            className="btn-secondary flex items-center space-x-2"
        >
            <Download className="h-4 w-4" />
            <span>Download {fileData.name}</span>
        </button>
    );
}

// Usage:
// <DownloadButton fileData={submission.gambarSijilPengislaman} />


// ============================================
// 3. FILE GRID DISPLAY (All Files)
// ============================================

function FileGrid({ submission }) {
    const fileFields = [
        { key: 'gambarIC', label: 'IC/Passport' },
        { key: 'gambarKadIslam', label: 'Kad Islam' },
        { key: 'gambarSijilPengislaman', label: 'Sijil Pengislaman' },
        { key: 'dokumenLain1', label: 'Dokumen 1' },
        { key: 'dokumenLain2', label: 'Dokumen 2' },
        { key: 'dokumenLain3', label: 'Dokumen 3' }
    ];

    const files = fileFields
        .filter(field => submission[field.key]?.data)
        .map(field => ({
            ...field,
            data: submission[field.key]
        }));

    if (files.length === 0) {
        return <p className="text-gray-500">Tiada fail dimuat naik</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(file => (
                <div key={file.key} className="card p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{file.label}</h4>

                    {/* Image Preview or PDF Icon */}
                    {file.data.type.startsWith('image/') ? (
                        <img
                            src={file.data.data}
                            alt={file.label}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                    ) : (
                        <div className="w-full h-48 bg-red-50 rounded-lg mb-3 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl mb-2">📄</div>
                                <p className="text-sm text-gray-600">PDF Document</p>
                            </div>
                        </div>
                    )}

                    {/* File Info */}
                    <div className="text-xs text-gray-600 space-y-1 mb-3">
                        <p>📝 {file.data.name}</p>
                        <p>📊 {formatFileSize(file.data.size)}</p>
                        <p>📅 {new Date(file.data.uploadedAt).toLocaleDateString('ms-MY')}</p>
                    </div>

                    {/* Download Button */}
                    <button
                        onClick={() => downloadBase64File(file.data.data, file.data.name)}
                        className="w-full btn-primary flex items-center justify-center space-x-2 text-sm"
                    >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                    </button>
                </div>
            ))}
        </div>
    );
}

// Helper function
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Usage in detail page:
// <FileGrid submission={submission} />


// ============================================
// 4. COMPACT LIST VIEW (For Tables)
// ============================================

function FileIndicator({ submission }) {
    const fileFields = [
        'gambarIC', 'gambarKadIslam', 'gambarSijilPengislaman',
        'dokumenLain1', 'dokumenLain2', 'dokumenLain3'
    ];

    const fileCount = fileFields.filter(field => submission[field]?.data).length;

    if (fileCount === 0) {
        return <span className="text-gray-400 text-sm">-</span>;
    }

    return (
        <div className="flex items-center space-x-1 text-sm">
            <span className="text-emerald-600 font-medium">{fileCount}</span>
            <span className="text-gray-600">fail</span>
        </div>
    );
}

// Usage in table:
// <FileIndicator submission={row} />


// ============================================
// 5. LIGHTBOX/MODAL VIEW (Click to Enlarge)
// ============================================

import { useState } from 'react';
import { X } from 'lucide-react';

function ImageWithLightbox({ fileData }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!fileData || !fileData.data || !fileData.type.startsWith('image/')) {
        return null;
    }

    return (
        <>
            {/* Thumbnail */}
            <img
                src={fileData.data}
                alt={fileData.name}
                className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                onClick={() => setIsOpen(true)}
            />

            {/* Lightbox Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={fileData.data}
                        alt={fileData.name}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

// Usage:
// <ImageWithLightbox fileData={submission.gambarIC} />


// ============================================
// 6. COMPLETE DETAIL PAGE SECTION
// ============================================

function DocumentsSection({ submission }) {
    return (
        <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Dokumen & Gambar
            </h2>

            {/* Bank Details */}
            {submission.bank && (
                <div className="mb-6 pb-6 border-b">
                    <h3 className="font-medium text-gray-900 mb-3">Maklumat Bank</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-gray-600">Bank</label>
                            <p className="font-medium">{submission.bank}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">No Akaun</label>
                            <p className="font-medium">{submission.noAkaun}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Nama di Bank</label>
                            <p className="font-medium">{submission.namaDiBank}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Files */}
            <FileGrid submission={submission} />

            {/* Notes */}
            {submission.catatan && (
                <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-2">Catatan</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{submission.catatan}</p>
                </div>
            )}
        </div>
    );
}

// Full usage in detail page:
// <DocumentsSection submission={submission} />
