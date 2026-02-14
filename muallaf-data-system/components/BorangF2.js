import React from 'react';

const BorangF2 = ({ classData, month, year, index }) => {
    const recipients = classData.participants
        .filter(p => p.allowance > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

    const totalAmount = recipients.reduce((sum, p) => sum + p.allowance, 0);

    return (
        <div className="p-10 bg-white text-slate-800 font-sans max-w-5xl mx-auto mb-10 shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:break-after-page">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                <div className="flex items-center space-x-4">
                    <div className="relative group">
                        <img
                            src="https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png"
                            alt="Hidayah Centre Foundation"
                            className="h-20 w-auto object-contain"
                            onError={(e) => {
                                const fallbacks = [
                                    "https://hidayahcentre.org.my/wp-content/uploads/2021/04/hcf-logo.png",
                                    "https://hidayahcentre.org.my/wp-content/uploads/2021/04/HCF-Logo-1.png"
                                ];
                                const currentIdx = fallbacks.indexOf(e.target.src);
                                if (currentIdx < fallbacks.length - 1) {
                                    e.target.src = fallbacks[currentIdx + 1];
                                } else if (e.target.src === "https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png") {
                                    e.target.src = fallbacks[0];
                                } else {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }
                            }}
                        />
                        <div className="hidden h-16 w-16 bg-emerald-600 rounded-lg flex items-center justify-center shadow-inner">
                            <span className="text-white font-black text-xl">Hi</span>
                        </div>
                    </div>
                    <div className="border-l-2 border-slate-300 pl-4 h-16 flex flex-col justify-center">
                        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1">BORANG F2</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-Sistem Pengurusan Kelas Bimbingan</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-bl-xl inline-block -mr-10 print:mr-0">
                        <p className="text-xs font-bold uppercase tracking-tighter">Permohonan Pembayaran Bulk Payment</p>
                        <p className="text-[10px] text-slate-400">Elaun Kelas Bimbingan Mualaf {year}</p>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500 italic uppercase">ID Laporan: HCF/F2/{year}/{month.slice(0, 3).toUpperCase()}/{index.toString().padStart(3, '0')}</p>
                </div>
            </div>

            {/* Main Information Grid */}
            <div className="grid grid-cols-12 gap-6 mb-8">
                <div className="col-span-8 space-y-4">
                    <div className="grid grid-cols-4 gap-4 items-end">
                        <div className="col-span-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kumpulan / Kelas</span>
                            <span className="text-sm font-bold text-slate-900 border-b border-slate-200 block pb-1 truncate">{classData.namaKelas}</span>
                        </div>
                        <div className="col-span-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tempoh Laporan</span>
                            <span className="text-sm font-bold text-slate-900 border-b border-slate-200 block pb-1">{month} {year}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Negeri & Lokasi</span>
                            <span className="text-sm font-bold text-slate-900 border-b border-slate-200 block pb-1 truncate">{classData.negeri} - {classData.lokasi}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-4">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block leading-tight">Bahasa Pengantar</span>
                            <span className="text-xs font-semibold text-slate-800 uppercase leading-none">{classData.bahasa || '-'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block leading-tight">Jadual Berkala</span>
                            <span className="text-xs font-semibold text-slate-800 uppercase leading-none">{classData.hariMasa || '-'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block leading-tight">Kekerapan</span>
                            <span className="text-xs font-semibold text-slate-800 uppercase leading-none">{classData.kekerapan || '-'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block leading-tight">Penaja Utama</span>
                            <span className="text-xs font-semibold text-slate-800 uppercase leading-none">{classData.penaja || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 mr-2 mb-2"></div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Jumlah Keseluruhan</span>
                        <div className="flex items-baseline">
                            <span className="text-lg font-medium mr-1">RM</span>
                            <span className="text-4xl font-black tracking-tighter">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Bil. Penerima</span>
                            <span className="text-lg font-black leading-none">{recipients.length}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Status</span>
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Automasi</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm mb-8">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-3 py-3 w-10 text-center">No.</th>
                            <th className="px-4 py-3">Nama Lengkap Penerima</th>
                            <th className="px-3 py-3 w-28 text-center">No. Kad Pengenalan</th>
                            <th className="px-3 py-3">Maklumat Perbankan</th>
                            <th className="px-3 py-3 w-16 text-center">Kehadiran</th>
                            <th className="px-4 py-3 w-28 text-right">Jumlah (RM)</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] divide-y divide-slate-100">
                        {recipients.map((p, idx) => (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                <td className="px-4 py-3">
                                    <div className="font-bold text-slate-900 uppercase leading-none">{p.name}</div>
                                    <div className="text-[9px] text-slate-500 mt-1 uppercase opacity-75">{p.category}</div>
                                </td>
                                <td className="px-3 py-3 text-center font-mono opacity-80">{p.noIc || '-'}</td>
                                <td className="px-3 py-3">
                                    <div className="font-bold text-slate-800 uppercase leading-none truncate max-w-[150px]">{p.bank || 'TIADA BANK'}</div>
                                    <div className="text-[10px] font-mono text-slate-500 mt-1">{p.noAkaun || '-'}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 uppercase italic">{p.namaDiBank}</div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="bg-slate-100 text-slate-900 px-2 py-1 rounded-md font-black">{p.sessions}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="font-black text-slate-900">{p.allowance.toFixed(2)}</span>
                                </td>
                            </tr>
                        ))}
                        {recipients.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-4 py-12 text-center text-slate-400 italic">Tiada transaksi pembayaran dikesan bagi kriteria terpilih.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr className="font-bold">
                            <td colSpan="5" className="px-4 py-4 text-right text-xs text-slate-500 uppercase tracking-widest">Jumlah Kumulatif Penerimaan:</td>
                            <td className="px-4 py-4 text-right text-base text-slate-900 font-black">RM {totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer / Signatures Section */}
            <div className="mt-12">
                <div className="grid grid-cols-3 gap-12 text-center break-inside-avoid">
                    <div className="space-y-16">
                        <div className="border-b-2 border-slate-200 h-24 flex items-end justify-center pb-2 italic text-slate-300 text-xs text-slate-900">
                            {/* Signature Placeholder */}
                        </div>
                        <div>
                            <p className="font-black text-xs text-slate-900 uppercase">Disediakan Oleh</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Guru / Penyelaras Kelas</p>
                            <p className="text-[8px] text-slate-300 mt-4 italic font-bold">Tarikh: ____/____/2026</p>
                        </div>
                    </div>
                    <div className="space-y-16">
                        <div className="border-b-2 border-slate-200 h-24 flex items-end justify-center pb-2 italic text-slate-300 text-xs">
                        </div>
                        <div>
                            <p className="font-black text-xs text-slate-900 uppercase">Disemak & Disahkan</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pengurus / Pegawai Cawangan</p>
                            <p className="text-[8px] text-slate-300 mt-4 italic font-bold">Tarikh: ____/____/2026</p>
                        </div>
                    </div>
                    <div className="space-y-16">
                        <div className="border-b-2 border-slate-200 h-24 flex items-end justify-center pb-2 italic text-slate-300 text-xs">
                        </div>
                        <div>
                            <p className="font-black text-xs text-slate-900 uppercase">Kelulusan Kewangan</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ibu Pejabat (HQ)</p>
                            <p className="text-[8px] text-slate-300 mt-4 italic font-bold">Tarikh: ____/____/2026</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>Generated via iSantuni Cloud • Hidayah Centre Foundation</span>
                    <span className="italic opacity-50">Halaman {index} • Mukasurat Tunggal</span>
                    <span>Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
            </div>
        </div>
    );
};

export default BorangF2;
