'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Modal from '@/components/Modal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        confirmText: 'OK',
        cancelText: 'Batal'
    });

    const showModal = useCallback(({ title, message, type = 'info', onConfirm, confirmText, cancelText }) => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                message,
                type,
                confirmText: confirmText || (type === 'confirm' ? 'Ya, Teruskan' : 'OK'),
                cancelText: cancelText || 'Batal',
                onConfirm: async () => {
                    if (onConfirm) await onConfirm();
                    resolve(true);
                },
                onClose: () => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    const hideModal = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showAlert = (title, message, type = 'info') => showModal({ title, message, type });
    const showInfo = (title, message) => showModal({ title, message, type: 'info' });
    const showSuccess = (title, message) => showModal({ title, message, type: 'success' });
    const showError = (title, message) => showModal({ title, message, type: 'error' });
    const showWarning = (title, message) => showModal({ title, message, type: 'warning' });
    const showConfirm = (title, message, onConfirm) => showModal({ title, message, type: 'confirm', onConfirm });
    const showDestructiveConfirm = (title, message, onConfirm) => showModal({ title, message, type: 'error', onConfirm, confirmText: 'Ya, Padam' });

    return (
        <ModalContext.Provider value={{ showAlert, showInfo, showSuccess, showError, showWarning, showConfirm, showDestructiveConfirm, hideModal }}>
            {children}
            <Modal
                {...modalConfig}
                onClose={modalConfig.onClose || hideModal}
            />
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
