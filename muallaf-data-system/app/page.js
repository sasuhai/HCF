'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
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
  X,
  List,
  Calendar,
  Activity,
  BarChart2,
  Settings,
  User,
  Clock,
  Tag
} from 'lucide-react';

export default function LandingPage() {
  const { user, role, loading, isRecovery } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [upcomingPrograms, setUpcomingPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Fetch upcoming programs for the hero section
  useEffect(() => {
    async function fetchUpcomingPrograms() {
      if (!user) {
        setLoadingPrograms(false);
        return;
      }
      try {
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        const localDate = new Date(today.getTime() - offset);
        const todayStr = localDate.toISOString().split('T')[0];

        localDate.setDate(localDate.getDate() + 14); // 14 days just in case to show more upcoming
        const nextWeekStr = localDate.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .gte('tarikh_mula', todayStr)
          .lte('tarikh_mula', nextWeekStr)
          .order('tarikh_mula', { ascending: true });

        if (!error && data) {
          setUpcomingPrograms(data);
        }
      } catch (err) {
        console.error("Error fetching upcoming programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    }
    fetchUpcomingPrograms();
  }, [user]);

  // Handle Password Recovery Redirect
  useEffect(() => {
    if (isRecovery) {
      console.log("LandingPage: Password recovery detected, redirecting to login/reset...");
      router.push('/login');
    }
  }, [isRecovery, router]);

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
      title: "Pengurusan Mualaf",
      description: "Pendaftaran, pangkalan data, dan pengurusan kelas.",
      items: [
        {
          title: "Pendaftaran Mualaf",
          description: "Borang pendaftaran mualaf baru.",
          icon: <FileText className="w-6 h-6" />,
          color: "text-blue-500",
          href: "/borang"
        },
        {
          title: "Data Mualaf",
          description: "Cari dan urus pangkalan data mualaf.",
          icon: <List className="w-6 h-6" />,
          color: "text-amber-500",
          href: "/senarai"
        },
        {
          title: "Rekod Kehadiran",
          description: "Kemaskini kehadiran kelas mingguan.",
          icon: <Calendar className="w-6 h-6" />,
          color: "text-emerald-500",
          href: "/kehadiran"
        },
        {
          title: "Kelas & Lokasi",
          description: "Senarai lokasi fizikal dan online.",
          icon: <MapPin className="w-6 h-6" />,
          color: "text-rose-500",
          href: "/kelas"
        },
        {
          title: "Petugas & Guru",
          description: "Direktori tenaga pengajar.",
          icon: <Users className="w-6 h-6" />,
          color: "text-purple-500",
          href: "/pekerja"
        }
      ]
    },
    {
      title: "KPI & Program",
      description: "Pengurusan program, takwim, dan sasaran KPI.",
      items: [
        {
          title: "Senarai Program",
          description: "Pengurusan kertas kerja dan laporan program.",
          icon: <List className="w-6 h-6" />,
          color: "text-blue-400",
          href: "/program"
        },
        {
          title: "Kalendar Aktiviti",
          description: "Takwim tahunan dan perancangan aktiviti.",
          icon: <Calendar className="w-6 h-6" />,
          color: "text-amber-400",
          href: "/program/kalendar"
        },
        {
          title: "Mualaf & Outreach",
          description: "Sasaran KPI Mualaf & Outreach.",
          icon: <Activity className="w-6 h-6" />,
          color: "text-emerald-500",
          href: "/otherKPI"
        },
        {
          title: "Du'at & Sukarelawan",
          description: "Sasaran KPI Du'at & Rakan Hidayah.",
          icon: <Activity className="w-6 h-6" />,
          color: "text-emerald-500",
          href: "/kpi-rh"
        },
        {
          title: "KPI Pengislaman",
          description: "Pemantauan statistik pengislaman bulanan.",
          icon: <Activity className="w-6 h-6" />,
          color: "text-slate-400",
          href: "/pengislaman-kpi"
        }
      ]
    },
    {
      title: "Analisis & Tetapan",
      description: "Paparan visual dan laporan prestasi keseluruhan.",
      items: [
        {
          title: "Dashboard Utama",
          description: "Ringkasan eksekutif data pergerakan.",
          icon: <BarChart2 className="w-6 h-6" />,
          color: "text-indigo-500",
          href: "/dashboard"
        },
        {
          title: "Scoreboard KPI",
          description: "Metrik pemantauan prestasi KPI semasa.",
          icon: <Activity className="w-6 h-6" />,
          color: "text-emerald-500",
          href: "/dashboard/scoreboard"
        },
        {
          title: "Peta Taburan",
          description: "Pemetaan demografi melalui peta geografi.",
          icon: <MapPin className="w-6 h-6" />,
          color: "text-rose-500",
          href: "/map-intelligence"
        },
        {
          title: "Analisis & Laporan",
          description: "Penjanaan laporan dan statistik bulanan.",
          icon: <FileText className="w-6 h-6" />,
          color: "text-emerald-500",
          href: "/mualaf/dashboard"
        }
      ]
    }
  ];

  // Admin Extras
  if (role === 'admin') {
    const adminGroup = {
      title: "Pentadbir",
      description: "Tetapan konfigurasi sistem keseluruhan.",
      items: [
        {
          title: "Pengguna Sistem",
          description: "Pengurusan akaun dan peranan pengguna.",
          icon: <User className="w-6 h-6" />,
          color: "text-slate-400",
          href: "/pengguna"
        },
        {
          title: "Tetapan Metadata",
          description: "Konfigurasi tetapan asas, negeri dan cawangan.",
          icon: <Settings className="w-6 h-6" />,
          color: "text-slate-400",
          href: "/pengurusan/metadata"
        },
        {
          title: "Kadar Elaun",
          description: "Penetapan pembayaran elaun mengikut kelas.",
          icon: <DollarSign className="w-6 h-6" />,
          color: "text-slate-400",
          href: "/kadar-elaun"
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
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl h-[450px] flex flex-col">
                <div className="flex items-center space-x-4 mb-6 shrink-0">
                  <div className="bg-white p-3 rounded-xl shadow-lg">
                    <img src="https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png" alt="HCF" className="h-8 w-auto" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-md">Program Akan Datang</h3>
                    <p className="text-xs text-yellow-300 font-medium">Takwim Terkini</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {!user ? (
                    <div className="flex flex-col items-center text-center p-8 bg-black/20 rounded-xl border border-white/10 h-full justify-center">
                      <ShieldCheck className="w-12 h-12 text-yellow-400 mb-4 opacity-80" />
                      <h4 className="text-white font-bold mb-2">Maklumat Terlindung</h4>
                      <p className="text-white/70 text-sm mb-6">Sila log masuk untuk melihat senarai program dan takwim yang akan datang.</p>
                      <Link href="/login">
                        <button className="px-6 py-2 bg-yellow-500 text-slate-900 rounded-lg text-sm font-bold shadow-lg transition-transform hover:-translate-y-0.5 flex items-center mx-auto">
                          <LogIn className="w-4 h-4 mr-2" /> Log Masuk
                        </button>
                      </Link>
                    </div>
                  ) : loadingPrograms ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-black/20 rounded-xl border border-white/5 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-white/50 shrink-0">
                          <CalendarCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full bg-white/40 rounded mb-2"></div>
                          <div className="h-2 w-2/3 bg-white/20 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : upcomingPrograms.length === 0 ? (
                    <div className="flex flex-col items-center text-center p-8 bg-black/20 rounded-xl border border-white/10 h-full justify-center">
                      <Calendar className="w-10 h-10 text-white/40 mb-3" />
                      <p className="text-white/70 text-sm">Tiada program akan datang pada masa ini.</p>
                    </div>
                  ) : (
                    upcomingPrograms.map((prog) => {
                      let subKategoriList = [];
                      if (Array.isArray(prog.sub_kategori)) {
                        subKategoriList = prog.sub_kategori;
                      } else if (typeof prog.sub_kategori === 'string') {
                        subKategoriList = prog.sub_kategori.split(',').map(s => s.trim()).filter(Boolean);
                      }
                      subKategoriList = subKategoriList.filter(s => s !== prog.kategori_utama);

                      return (
                        <div key={prog.id} className="group p-4 bg-black/20 hover:bg-black/30 rounded-xl border border-white/10 transition-all transform hover:-translate-y-0.5 cursor-pointer">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex flex-col flex-1 min-w-0">
                              <h4 className="text-white font-bold text-sm leading-snug mb-2 group-hover:text-yellow-300 transition-colors line-clamp-2">
                                {prog.nama_program || 'Tiada Nama'}
                              </h4>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                                  <div className="flex items-center text-[11px] text-white/80 shrink-0">
                                    <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
                                    {prog.tarikh_mula}
                                  </div>
                                  {(prog.masa_mula || prog.masa_tamat) && (
                                    <div className="flex items-center text-[11px] text-white/80 shrink-0 border-l border-white/20 pl-3">
                                      <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                                      {prog.masa_mula || '?'} {prog.masa_tamat ? `- ${prog.masa_tamat}` : ''}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                                  {(prog.tempat || prog.negeri) && (
                                    <div className="flex items-center text-[11px] text-white/80">
                                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />
                                      <span className="truncate">{[prog.tempat, prog.negeri].filter(Boolean).join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Badges Right Aligned */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0 mt-0.5 ml-2">
                              {prog.kategori_utama && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 whitespace-nowrap">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {prog.kategori_utama}
                                </span>
                              )}
                              {subKategoriList.map((sub, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-200 border border-purple-500/30 whitespace-nowrap">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-white/60 text-sm shrink-0">
                  <Link href="/program/kalendar" className="hover:text-white transition-colors flex items-center">
                    <span className="border-b border-transparent hover:border-white">Lihat Kalendar Penuh</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
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

      {/* Main Menu Grid with Dark Premium Gold Aesthetic */}
      <section id="menu-section" className="py-24 bg-zinc-950 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Akses Modul Sistem</h2>
            <p className="text-gray-400 text-lg">Pilih modul di bawah untuk memulakan urusan. Navigasi pantas direka khas untuk produktiviti.</p>
          </div>

          <div className="space-y-16">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="relative">
                <div className="flex items-center mb-8">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full mr-4 shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-wide">{group.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{group.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((item, idx) => (
                    <Link href={user ? item.href : '/login'} key={idx} className="group outline-none">
                      <div className="relative h-full bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all duration-500 flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-500/10">
                        {/* Animated gradient border top */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/0 to-transparent group-hover:via-yellow-400/80 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>

                        {/* Glowing Background Glow Effect */}
                        <div className="absolute -inset-2 bg-gradient-to-br from-yellow-500/5 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="p-6 flex-1 flex flex-col relative z-10 space-y-4">
                          {/* Icon Container */}
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-zinc-800 border border-white/10 ${item.color} group-hover:bg-yellow-500/10 group-hover:text-yellow-400 group-hover:border-yellow-500/30 transition-colors duration-500 shadow-inner`}>
                            {item.icon}
                          </div>

                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                              {item.title}
                            </h4>
                            <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                              {item.description}
                            </p>
                          </div>

                          <div className="pt-4 flex items-center text-sm font-semibold text-zinc-500 group-hover:text-yellow-500 transition-colors duration-300 mt-auto">
                            <span>Akses Modul</span>
                            <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-2 transition-transform duration-300" />
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
            <p>Idiahus &copy; {new Date().getFullYear()} Hidayah Centre Foundation. Hak Cipta Terpelihara.</p>
            <p className="mt-2 md:mt-0">Dibangunkan dengan ❤️ untuk Ummah.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
