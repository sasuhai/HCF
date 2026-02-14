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
  DollarSign,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const { user, role, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Grouped Menu Items matching Navbar sequence
  const menuGroups = [
    {
      title: "Data Mualaf",
      description: "Pengurusan pangkalan data dan pendaftaran.",
      items: [
        {
          title: "Senarai Rekod",
          description: "Cari dan urus pangkalan data mualaf.",
          icon: <Database className="w-5 h-5" />,
          color: "bg-blue-500",
          href: "/senarai",
          img: "https://placehold.co/600x400/3b82f6/ffffff?text=Data+Mualaf"
        },
        {
          title: "Pendaftaran Baru",
          description: "Borang pendaftaran mualaf baru.",
          icon: <FileText className="w-5 h-5" />,
          color: "bg-cyan-500",
          href: "/borang",
          img: "https://placehold.co/600x400/06b6d4/ffffff?text=Borang+Baru"
        }
      ]
    },
    {
      title: "Kelas Bimbingan Mualaf (KBM)",
      description: "Pengurusan kelas, kehadiran, dan tenaga pengajar.",
      items: [
        {
          title: "Rekod Kehadiran",
          description: "Kemaskini kehadiran kelas mingguan.",
          icon: <CalendarCheck className="w-5 h-5" />,
          color: "bg-purple-500",
          href: "/kehadiran",
          img: "https://placehold.co/600x400/a855f7/ffffff?text=Rekod+Kehadiran"
        },
        {
          title: "Kelas & Lokasi",
          description: "Senarai lokasi fizikal dan online.",
          icon: <MapPin className="w-5 h-5" />,
          color: "bg-orange-500",
          href: "/kelas",
          img: "https://placehold.co/600x400/f97316/ffffff?text=Kelas+dan+Lokasi"
        },
        {
          title: "Petugas & Guru",
          description: "Direktori tenaga pengajar.",
          icon: <Users className="w-5 h-5" />,
          color: "bg-pink-500",
          href: "/pekerja",
          img: "https://placehold.co/600x400/ec4899/ffffff?text=Petugas+dan+Guru"
        }
      ]
    },
    {
      title: "Pengurusan & Laporan",
      description: "Analisis data dan papan pemuka utama.",
      items: [
        {
          title: "Analisis & Laporan",
          description: "Statistik prestasi dan kewangan.",
          icon: <BarChart3 className="w-5 h-5" />,
          color: "bg-indigo-500",
          href: "/mualaf/dashboard",
          img: "https://placehold.co/600x400/6366f1/ffffff?text=Analisis+Laporan"
        },
        {
          title: "Dashboard Utama",
          description: "Ringkasan eksekutif data.",
          icon: <LayoutDashboard className="w-5 h-5" />,
          color: "bg-slate-600",
          href: "/dashboard",
          img: "https://placehold.co/600x400/475569/ffffff?text=Dashboard+Utama"
        }
      ]
    }
  ];

  // Admin Extras
  if (role === 'admin') {
    const adminGroup = {
      title: "Pentadbiran Sistem",
      description: "Tetapan khas untuk pentadbir.",
      items: [
        {
          title: "Kadar Elaun",
          description: "Tetapan kadar elaun.",
          icon: <DollarSign className="w-5 h-5" />,
          color: "bg-yellow-500",
          href: "/kadar-elaun",
          img: "https://placehold.co/600x400/eab308/ffffff?text=Kadar+Elaun"
        },
        {
          title: "Pengguna Sistem",
          description: "Akses dan peranan pengguna.",
          icon: <ShieldCheck className="w-5 h-5" />,
          color: "bg-red-600",
          href: "/pengguna",
          img: "https://placehold.co/600x400/dc2626/ffffff?text=Pengguna+Sistem"
        }
      ]
    };
    menuGroups.push(adminGroup);
  }

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-100 selection:text-yellow-900">

      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`transition-all duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`}>
              <img
                src="https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png"
                alt="Hidayah Centre Foundation"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className={`h-8 w-px bg-gray-300 mx-2 ${scrolled ? 'block' : 'hidden md:block bg-white/30'}`}></div>
            <span className={`text-xl font-bold tracking-tight ${scrolled ? 'text-gray-900' : 'text-white drop-shadow-md'}`}>
              iSantuni
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${scrolled ? 'text-gray-600' : 'text-white/90'}`}>
                  {user.email}
                </span>
                <button
                  onClick={scrollToMenu}
                  className="group flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg hover:shadow-yellow-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Menu Utama</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className={`group flex items-center space-x-2 px-6 py-2 rounded-full font-medium transition-all shadow-lg hover:-translate-y-0.5 ${scrolled ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-yellow-900 hover:bg-gray-50'}`}>
                  <LogIn className="w-4 h-4" />
                  <span>Log Masuk</span>
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 rounded-md ${scrolled ? 'text-gray-800' : 'text-white'}`}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Realistic Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1564959130747-897fb406b9dc?auto=format&fit=crop&q=80&w=2000"
            alt="Islamic Architecture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 shadow-xl">
                <span className="flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                <span className="text-sm font-medium text-yellow-50 tracking-wide">Sistem Pengurusan Digital v2.0</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
                  HCF <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">iSantuni</span>
                </h1>
                <p className="text-2xl md:text-3xl font-light text-gray-200">
                  Memperkasakan Dakwah,<br />Menyantuni Mualaf.
                </p>
              </div>

              <p className="text-lg text-gray-300 max-w-xl leading-relaxed">
                Platform berpusat untuk pengurusan data, kehadiran kelas, dan pelaporan aktiviti Hidayah Centre Foundation secara sistematik dan efisien.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {user ? (
                  <button
                    onClick={scrollToMenu}
                    className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-xl font-bold shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <span>Teruskan ke Aplikasi</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <Link href="/login">
                    <button className="px-8 py-4 bg-white hover:bg-gray-50 text-slate-900 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-2">
                      <LogIn className="w-5 h-5" />
                      <span>Log Masuk Staf</span>
                    </button>
                  </Link>
                )}
                <a href="https://hidayahcentre.org.my" target="_blank" rel="noopener noreferrer">
                  <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/20 hover:bg-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center">
                    Laman Rasmi HCF
                  </button>
                </a>
              </div>
            </div>

            {/* Right Side Visual Element - Glass Card */}
            <div className="hidden lg:block relative animate-fade-in-up delay-200">
              <div className="absolute -inset-4 bg-yellow-500/30 rounded-[2rem] blur-2xl"></div>
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-white p-3 rounded-xl shadow-lg">
                    <img src="https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png" alt="HCF" className="h-8 w-auto" />
                  </div>
                  <div>
                    <div className="h-2 w-32 bg-white/50 rounded mb-2"></div>
                    <div className="h-2 w-20 bg-white/30 rounded"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-black/20 rounded-xl border border-white/5">
                      <div className="h-10 w-10 rounded-full bg-yellow-500/50 flex items-center justify-center text-white">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full bg-white/40 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-white/20 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-white/60 text-sm">
                  <span>Data Terkini</span>
                  <div className="flex items-center text-yellow-300">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                    Online
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <div className="bg-slate-900 border-y border-slate-800 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800/50">
            {[
              { label: "Cawangan Aktif", val: "15+", icon: MapPin },
              { label: "Mualaf Disantuni", val: "5,000+", icon: Users },
              { label: "Kelas Pengajian", val: "150+", icon: CalendarCheck },
              { label: "Kadar Kepuasan", val: "98%", icon: ShieldCheck },
            ].map((stat, idx) => (
              <div key={idx} className="py-6 md:py-8 flex flex-col items-center justify-center text-center group cursor-default">
                <stat.icon className="w-8 h-8 text-yellow-400 mb-2 opacity-70 group-hover:scale-110 transition-transform" />
                <span className="text-3xl font-black text-white tracking-tight">{stat.val}</span>
                <span className="text-xs font-bold text-yellow-200 uppercase tracking-widest mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Menu Grid */}
      <section id="menu-section" className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Akses Modul Sistem</h2>
            <p className="text-gray-600 text-lg">Pilih modul di bawah untuk memulakan urusan. Akses bergantung kepada peranan akaun anda.</p>
          </div>

          <div className="space-y-16">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="relative">
                <div className="flex items-center mb-8">
                  <div className="h-8 w-1 bg-yellow-500 rounded-full mr-4"></div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{group.title}</h3>
                    <p className="text-gray-500">{group.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.items.map((item, idx) => (
                    <Link href={user ? item.href : '/login'} key={idx} className="group h-full">
                      <div className="relative h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                        {/* Card Image Header */}
                        <div className="h-32 w-full overflow-hidden relative">
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                          <img src={item.img} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-4 left-4 z-20">
                            <div className={`p-2 rounded-lg ${item.color} text-white shadow-lg`}>
                              {item.icon}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                          <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">{item.title}</h4>
                          <p className="text-gray-500 text-sm mb-6 flex-1">{item.description}</p>

                          <div className="flex items-center text-yellow-600 font-semibold text-sm">
                            <span>Akses</span>
                            <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-16">
            <div className="mb-8 md:mb-0 max-w-sm">
              <img
                src="https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png"
                alt="HCF Logo"
                className="h-12 w-auto mb-6 brightness-0 invert opacity-80"
              />
              <p className="text-slate-400 leading-relaxed text-sm">
                Hidayah Centre Foundation adalah sebuah organisasi yang berdedikasi untuk menyantuni mualaf dan menyampaikan mesej Islam yang sebenar kepada masyarakat majmuk.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 sm:gap-24">
              <div>
                <h5 className="font-bold text-lg mb-6 text-white">Pautan Pantas</h5>
                <ul className="space-y-4 text-slate-400  text-sm">
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">Utama</a></li>
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">Tentang Kami</a></li>
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">Hubungi</a></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-lg mb-6 text-white">Sokongan</h5>
                <ul className="space-y-4 text-slate-400 text-sm">
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">Bantuan Teknikal</a></li>
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">Dasar Privasi</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>&copy; 2026 Hidayah Centre Foundation. Hak Cipta Terpelihara.</p>
            <p className="mt-2 md:mt-0">Dibangunkan dengan ❤️ untuk Ummah.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
