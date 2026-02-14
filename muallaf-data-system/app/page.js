'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  MapPin,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  LogIn,
  Database,
  FileText,
  UserCheck,
  DollarSign
} from 'lucide-react';

export default function LandingPage() {
  const { user, role, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Define menu items/features with links
  const menuItems = [
    {
      title: "Pendaftaran Baru",
      description: "Borang pendaftaran mualaf baru ke dalam sistem.",
      icon: <FileText className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      href: "/borang"
    },
    {
      title: "Rekod Mualaf",
      description: "Cari dan urus pangkalan data mualaf secara terperinci.",
      icon: <Database className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-500",
      href: "/senarai"
    },
    {
      title: "Rekod Kehadiran",
      description: "Kemaskini kehadiran kelas dan aktiviti mingguan.",
      icon: <CalendarCheck className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      href: "/kehadiran"
    },
    {
      title: "Analisis & Laporan",
      description: "Lihat statistik dan laporan prestasi santunan.",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "from-indigo-500 to-blue-500",
      href: "/mualaf/dashboard"
    },
    {
      title: "Pengurusan Kelas",
      description: "Urus lokasi kelas dan jadual pengajian.",
      icon: <MapPin className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      href: "/kelas"
    },
    {
      title: "Petugas & Guru",
      description: "Senarai tenaga pengajar dan kakitangan.",
      icon: <Users className="w-6 h-6" />,
      color: "from-pink-500 to-rose-500",
      href: "/pekerja"
    },
  ];

  // Admin exclusive items
  if (role === 'admin') {
    menuItems.push({
      title: "Kadar Elaun",
      description: "Tetapan kadar elaun dan sumbangan.",
      icon: <DollarSign className="w-6 h-6" />,
      color: "from-yellow-500 to-orange-500",
      href: "/kadar-elaun"
    });
    menuItems.push({
      title: "Pengguna Sistem",
      description: "Urus akaun dan akses pengguna sistem.",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "from-gray-600 to-gray-800",
      href: "/pengguna"
    });
  }

  // Add Dashboard last
  menuItems.push({
    title: "Dashboard Utama",
    description: "Paparan ringkasan keseluruhan data (High Data Usage).",
    icon: <LayoutDashboard className="w-6 h-6" />,
    color: "from-slate-500 to-slate-700",
    href: "/dashboard"
  });

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
              <span className="text-white font-bold text-lg">Hi</span>
            </div>
            <span className={`text-xl font-bold tracking-tight ${scrolled ? 'text-gray-900' : 'text-gray-900'
              }`}>
              HCF <span className="text-emerald-600">iSantuni</span>
            </span>
          </div>

          <div>
            {user ? (
              <button
                onClick={scrollToMenu}
                className="group flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span>Menu Utama</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <Link href="/login">
                <button className="group flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 px-6 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md border border-gray-200">
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  <span>Log Masuk</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-8 animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-medium text-emerald-700">Sistem Pengurusan Digital Terkini</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8 animate-fade-in-up delay-100">
              Memperkasakan Pengurusan <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                Santunan & Dakwah
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              Satu platform integrasi untuk mengurus data mualaf, kehadiran kelas, dan kakitangan Hidayah Centre Foundation dengan efisien dan sistematik.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
              {user ? (
                <button
                  onClick={scrollToMenu}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full font-bold shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                >
                  <span>Akses Menu</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <Link href="/login">
                  <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full font-bold shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-2">
                    <span>Mula Sekarang</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Menu / Features Grid */}
      <section id="menu-section" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Menu Utama</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Akses pantas ke semua modul sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item, index) => (
              <Link href={user ? item.href : '/login'} key={index} className="block h-full">
                <div
                  className="group relative p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden h-full flex flex-col items-start cursor-pointer"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10 flex items-center justify-center mb-6 text-white shadow-lg`}>
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-gray-500 leading-relaxed text-sm mb-4">
                    {item.description}
                  </p>

                  <div className="mt-auto flex items-center text-emerald-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    <span>Buka Halaman</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-900">
          {/* Abstract Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { label: "Cawangan Aktif", value: "14+", sub: "Seluruh Negara" },
              { label: "Rekod Mualaf", value: "5000+", sub: "Disantuni" },
              { label: "Kelas Pengajian", value: "150+", sub: "Mingguan" }
            ].map((stat, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 transform hover:scale-105 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">{stat.value}</div>
                <div className="text-emerald-200 font-semibold text-lg">{stat.label}</div>
                <div className="text-emerald-400 text-sm mt-1">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm">Hi</div>
              <span className="font-bold text-gray-900">HCF iSantuni</span>
            </div>
            <div className="flex space-x-6 text-gray-500 text-sm">
              <a href="#" className="hover:text-emerald-600 transition-colors">Bantuan</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Privasi</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Terma</a>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm border-t border-gray-200 pt-8">
            &copy; 2026 Hidayah Centre Foundation. Hak Cipta Terpelihara.
          </div>
        </div>
      </footer>
    </div>
  );
}
