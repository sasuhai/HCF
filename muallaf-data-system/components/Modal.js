'use client';

import { X, AlertCircle, CheckCircle2, Info, AlertTriangle, HelpCircle } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Batal',
    loading = false
}) {
    if (!isOpen) return null;

    const icons = {
        info: <Info className="h-6 w-6 text-blue-500" />,
        success: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
        warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
        error: <AlertCircle className="h-6 w-6 text-red-500" />,
        confirm: <HelpCircle className="h-6 w-6 text-emerald-500" />
    };

    const colors = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        confirm: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    };

    const buttonColors = {
        info: 'bg-blue-600 hover:bg-blue-700',
        success: 'bg-emerald-600 hover:bg-emerald-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        error: 'bg-red-600 hover:bg-red-700',
        confirm: 'bg-emerald-600 hover:bg-emerald-700'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl border ${colors[type]}`}>
                            {icons[type]}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-600 leading-relaxed">{message}</p>
                </div>

                <div className="bg-slate-50 p-4 px-6 flex flex-col sm:flex-row-reverse gap-2">
                    <button
                        onClick={async () => {
                            if (onConfirm) {
                                await onConfirm();
                            }
                            onClose();
                        }}
                        disabled={loading}
                        className={`inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-200/50 transition-all active:scale-95 disabled:opacity-50 ${buttonColors[type]}`}
                    >
                        {loading && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {confirmText}
                    </button>

                    {type === 'confirm' && (
                        <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
