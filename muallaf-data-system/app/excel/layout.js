import Script from 'next/script';

export default function ExcelLayout({ children }) {
    return (
        <div className="excel-addon-container min-h-screen bg-gray-50">
            <Script
                src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
                strategy="afterInteractive"
            />
            {children}
        </div>
    );
}
