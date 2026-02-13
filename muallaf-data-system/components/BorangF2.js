import React from 'react';

const BorangF2 = ({ classData, month, year, index }) => {
    // classData contains:
    // namaKelas, lokasi, negeri
    // participants: [] (with extended details: bank, noAkaun, noIc, etc.)
    // totalAllowance

    // Group participants? Or just list them? 
    // The report seems to list "NAMA PENERIMA".
    // We should list all Petugas and Pelajar who have allowance > 0? Or all attendies?
    // Usually bulk payment is for those receiving money. So allowance > 0.

    // Sort participants by Name
    const recipients = classData.participants
        .filter(p => p.allowance > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

    const totalAmount = recipients.reduce((sum, p) => sum + p.allowance, 0);

    return (
        <div className="p-8 bg-white text-black text-sm font-sans max-w-5xl mx-auto mb-8 print:p-0 print:m-0 print:w-full print:max-w-none print:break-after-page">
            {/* Header */}
            <div className="border border-black mb-4">
                <div className="bg-black text-white text-center font-bold py-2 text-lg uppercase">
                    BORANG F2 - PERMOHONAN PEMBAYARAN BULK PAYMENT ELAUN KELAS BIMBINGAN MUALAF {year}
                </div>

                <div className="grid grid-cols-2 p-4 gap-4">
                    {/* Left Details */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-bold">KELAS:</span>
                            <span className="col-span-2 border-b border-gray-400">{classData.namaKelas}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-bold">BULAN:</span>
                            <span className="col-span-2 border-b border-gray-400 uppercase">{month} {year}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-bold">NEGERI / LOKASI:</span>
                            <span className="col-span-2 border-b border-gray-400">{classData.negeri} - {classData.lokasi}</span>
                        </div>
                    </div>

                    {/* Right Totals */}
                    <div className="border border-black p-2 bg-gray-50 flex flex-col justify-center items-center">
                        <div className="text-center mb-2">
                            <div className="font-bold">JUMLAH PEMBAYARAN</div>
                            <div className="text-xl font-bold">RM {totalAmount.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold">BILANGAN AKAUN</div>
                            <div className="text-lg">{recipients.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Header (Class Info) */}
            <div className="bg-orange-100 border border-black border-b-0 p-2 font-bold mb-0">
                INFO KELAS & PENERIMA
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black text-xs">
                <thead className="bg-yellow-200">
                    <tr>
                        <th className="border border-black p-2 w-10">BIL</th>
                        <th className="border border-black p-2">NAMA</th>
                        <th className="border border-black p-2 w-24">NO KP</th>
                        <th className="border border-black p-2 w-32">BANK</th>
                        <th className="border border-black p-2 w-32">NO AKAUN</th>
                        <th className="border border-black p-2">NAMA DI BANK</th>
                        <th className="border border-black p-2 w-20">KAT. ELAUN</th>
                        <th className="border border-black p-2 w-16">HADIR</th>
                        <th className="border border-black p-2 w-24 text-right">ELAUN (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    {recipients.map((p, idx) => (
                        <tr key={p.id}>
                            <td className="border border-black p-2 text-center">{idx + 1}</td>
                            <td className="border border-black p-2 font-medium uppercase">{p.name}</td>
                            <td className="border border-black p-2 text-center">{p.noIc || '-'}</td>
                            <td className="border border-black p-2 text-center uppercase">{p.bank || '-'}</td>
                            <td className="border border-black p-2 text-center font-mono">{p.noAkaun || '-'}</td>
                            <td className="border border-black p-2 uppercase">{p.namaDiBank || '-'}</td>
                            <td className="border border-black p-2 text-center">{p.category}</td>
                            <td className="border border-black p-2 text-center">{p.sessions} / {p.totalSessionsInMonth}</td>
                            <td className="border border-black p-2 text-right font-bold">{p.allowance.toFixed(2)}</td>
                        </tr>
                    ))}
                    {recipients.length === 0 && (
                        <tr>
                            <td colSpan="9" className="border border-black p-4 text-center italic">Tiada penerima elaun yang layak untuk bulan ini.</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan="8" className="border border-black p-2 text-right">JUMLAH BESAR:</td>
                        <td className="border border-black p-2 text-right">RM {totalAmount.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="mt-2 text-xs text-gray-500 italic">
                * Senarai ini dijana secara automatik oleh sistem HCF E-System pada {new Date().toLocaleDateString('ms-MY')}.
            </div>

            {/* Signatures Area */}
            <div className="mt-8 grid grid-cols-3 gap-8 text-center break-inside-avoid">
                <div>
                    <div className="h-20 border-b border-black"></div>
                    <div className="mt-2 font-bold">Disediakan Oleh</div>
                    <div className="text-xs">(Guru / Penyelaras)</div>
                </div>
                <div>
                    <div className="h-20 border-b border-black"></div>
                    <div className="mt-2 font-bold">Disemak Oleh</div>
                    <div className="text-xs">(Pegawai HCF)</div>
                </div>
                <div>
                    <div className="h-20 border-b border-black"></div>
                    <div className="mt-2 font-bold">Diluluskan Oleh</div>
                    <div className="text-xs">(Kewangan)</div>
                </div>
            </div>
        </div>
    );
};

export default BorangF2;
