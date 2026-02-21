'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Users, FileText, Calendar, Settings, MapPin, User, LogOut, Menu, X, ChevronDown, List, DollarSign, BarChart2, Activity } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, role, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (!user) return null;

    const isActive = (path) => pathname === path || pathname.startsWith(path + '/');
    const toggleDropdown = (name) => setActiveDropdown(activeDropdown === name ? null : name);

    return (
        <nav className="bg-white shadow-sm fixed top-0 left-0 w-full z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center space-x-2">
                            <img
                                src="https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png"
                                alt="Hidayah Centre Foundation"
                                className="h-8 w-auto object-contain"
                            />
                            <span className="text-xl font-bold text-slate-800">
                                iSantuni
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:ml-8 md:flex md:space-x-4">

                            {/* Dropdown: Pengurusan Mualaf */}
                            <div className="relative group">
                                <button className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${isActive('/borang') || isActive('/senarai') || isActive('/kehadiran') || isActive('/kelas') || isActive('/pekerja') ? 'border-emerald-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    <Users className="w-4 h-4 mr-1.5" /> Pengurusan Mualaf <ChevronDown className="w-3 h-3 ml-1" />
                                </button>
                                <div className="absolute left-0 mt-0 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block transition-all transform origin-top-left">
                                    <div className="py-1">
                                        <Link href="/borang" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-blue-500" /> Pendaftaran Mualaf
                                        </Link>
                                        <Link href="/senarai" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <List className="w-4 h-4 mr-2 text-amber-500" /> Data Mualaf
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Kelas Bimbingan (KBM)</div>
                                        <Link href="/kehadiran" className="block px-6 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center">
                                            <Calendar className="w-3.5 h-3.5 mr-2" /> Rekod Kehadiran
                                        </Link>
                                        <Link href="/kelas" className="block px-6 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center">
                                            <MapPin className="w-3.5 h-3.5 mr-2" /> Kelas & Lokasi
                                        </Link>
                                        <Link href="/pekerja" className="block px-6 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center">
                                            <Users className="w-3.5 h-3.5 mr-2" /> Petugas & Guru
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown: KPI & Program */}
                            <div className="relative group">
                                <button className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${isActive('/program') || isActive('/otherKPI') || isActive('/kpi-rh') || isActive('/pengislaman-kpi') ? 'border-emerald-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    <Activity className="w-4 h-4 mr-1.5" /> KPI & Program <ChevronDown className="w-3 h-3 ml-1" />
                                </button>
                                <div className="absolute left-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block transition-all transform origin-top-left">
                                    <div className="py-1">
                                        <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Program & Takwim</div>
                                        <Link href="/program" className="block px-6 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center">
                                            <List className="w-3.5 h-3.5 mr-2" /> Senarai Program
                                        </Link>
                                        <Link href="/program/kalendar" className="block px-6 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center">
                                            <Calendar className="w-3.5 h-3.5 mr-2" /> Kalendar Aktiviti
                                        </Link>

                                        <div className="border-t border-gray-100 my-1"></div>
                                        <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Sasaran KPI</div>
                                        <Link href="/otherKPI" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <Activity className="w-4 h-4 mr-2 text-emerald-500" /> Mualaf & Outreach
                                        </Link>
                                        <Link href="/kpi-rh" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <Activity className="w-4 h-4 mr-2 text-emerald-500" /> Du'at & Sukarelawan
                                        </Link>
                                        <Link href="/pengislaman-kpi" className="block px-4 py-2 text-sm text-gray-600 opacity-70 hover:opacity-100 hover:bg-gray-100 flex items-center">
                                            <Activity className="w-4 h-4 mr-2" /> KPI Pengislaman
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown: Analisis & Tetapan */}
                            <div className="relative group">
                                <button className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${isActive('/dashboard') || isActive('/map-intelligence') || isActive('/mualaf/dashboard') || isActive('/pengurusan/metadata') || isActive('/pengguna') || isActive('/kadar-elaun') ? 'border-emerald-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    <Settings className="w-4 h-4 mr-1.5" /> Analisis & Tetapan <ChevronDown className="w-3 h-3 ml-1" />
                                </button>
                                <div className="absolute left-0 mt-0 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block transition-all transform origin-top-left">
                                    <div className="py-1">
                                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <BarChart2 className="w-4 h-4 mr-2 text-indigo-500" /> Dashboard Utama
                                        </Link>
                                        <Link href="/dashboard/scoreboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <Activity className="w-4 h-4 mr-2 text-emerald-500" /> Scoreboard KPI
                                        </Link>
                                        <Link href="/map-intelligence" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-rose-500" /> Peta Taburan
                                        </Link>
                                        <Link href="/mualaf/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-emerald-500" /> Analisis & Laporan
                                        </Link>

                                        {(role === 'admin') && (
                                            <>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Pentadbir</div>
                                                <Link href="/pengguna" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-slate-500" /> Pengguna Sistem
                                                </Link>
                                                <Link href="/pengurusan/metadata" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                                    <Settings className="w-4 h-4 mr-2 text-slate-500" /> Tetapan Metadata
                                                </Link>
                                                <Link href="/kadar-elaun" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                                    <DollarSign className="w-4 h-4 mr-2 text-slate-500" /> Kadar Elaun
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side & Mobile Toggle */}
                    <div className="flex items-center">
                        <div className="hidden md:flex items-center ml-4 space-x-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                                    {role === 'admin' ? 'Admin' : 'Editor'}
                                </span>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                            >
                                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t">
                    <div className="pt-2 pb-3 space-y-1">
                        <div className="pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500">
                            {user?.email} <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-2">{role}</span>
                        </div>

                        <div className="pl-3 pr-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pengurusan Mualaf</div>
                        <Link href="/borang" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Pendaftaran Mualaf</Link>
                        <Link href="/senarai" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Data Mualaf</Link>
                        <Link href="/kehadiran" className="block pl-8 py-2 text-xs text-gray-500 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>• Rekod Kehadiran</Link>
                        <Link href="/kelas" className="block pl-8 py-2 text-xs text-gray-500 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>• Kelas & Lokasi</Link>
                        <Link href="/pekerja" className="block pl-8 py-2 text-xs text-gray-500 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>• Petugas & Guru</Link>

                        <div className="pl-3 pr-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">KPI & Program</div>
                        <Link href="/program" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Program & Takwim</Link>
                        <Link href="/otherKPI" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Mualaf & Outreach (KPI)</Link>
                        <Link href="/kpi-rh" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Du'at & Sukarelawan (KPI)</Link>
                        <Link href="/pengislaman-kpi" className="block pl-6 py-2 text-sm text-gray-600 opacity-60 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>KPI Pengislaman</Link>

                        <div className="pl-3 pr-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Analisis & Tetapan</div>
                        <Link href="/dashboard" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Dashboard Utama</Link>
                        <Link href="/dashboard/scoreboard" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Scoreboard KPI</Link>
                        <Link href="/map-intelligence" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Peta Taburan</Link>
                        <Link href="/mualaf/dashboard" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Analisis & Laporan</Link>

                        {role === 'admin' && (
                            <>
                                <div className="pl-3 pr-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2 border-t border-gray-50">Pentadbir</div>
                                <Link href="/pengguna" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Pengguna Sistem</Link>
                                <Link href="/pengurusan/metadata" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Tetapan Metadata</Link>
                                <Link href="/kadar-elaun" className="block pl-6 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Kadar Elaun</Link>
                            </>
                        )}

                        <button
                            onClick={handleSignOut}
                            className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-500 mt-4"
                        >
                            Log Keluar
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
