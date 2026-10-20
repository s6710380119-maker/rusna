import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Resource, MediaType } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { ResourceFormModal } from './components/ResourceFormModal';
import { ReportModal } from './components/ReportModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';
import { SampleDataLoader } from './components/SampleDataLoader';
import { 
  Search, 
  Filter, 
  Sparkles, 
  BookOpen, 
  Video, 
  FileText, 
  Globe, 
  Presentation, 
  Layers, 
  ChevronRight, 
  PlusCircle, 
  HelpCircle, 
  TrendingUp, 
  Bookmark, 
  X,
  Compass,
  GraduationCap
} from 'lucide-react';

function MainApp() {
  const { user, profile, isAdmin, favorites, toggleFavorite } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const { showToast } = useToast();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'browse' | 'favorites' | 'admin'>('browse');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'favorites'>('latest');

  // Firestore Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [reportTargetResource, setReportTargetResource] = useState<Resource | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Real-time listener for resources
  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Resource[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        setResources(list);
        setLoadingResources(false);
      },
      (error) => {
        console.warn('Resources fetch error:', error);
        setLoadingResources(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filtered and Sorted Resources
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      // Visibility rule: if hidden, only show to the author or admin
      if (res.status === 'hidden' && (!user || (res.authorId !== user.uid && !isAdmin))) {
        return false;
      }

      // Tab rule: favorites tab
      if (currentTab === 'favorites' && !favorites.includes(res.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && res.category !== selectedCategory) {
        return false;
      }

      // Education Level filter
      if (selectedEducationLevel !== 'all' && res.educationLevel !== selectedEducationLevel) {
        return false;
      }

      // Media Type filter
      if (selectedMediaType !== 'all' && res.mediaType !== selectedMediaType) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = res.title?.toLowerCase().includes(q);
        const inDesc = res.description?.toLowerCase().includes(q);
        const inCategory = res.category?.toLowerCase().includes(q);
        const inAuthor = res.authorName?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inCategory && !inAuthor) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'views') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortBy === 'favorites') {
        return (b.favoriteCount || 0) - (a.favoriteCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [resources, currentTab, favorites, selectedCategory, selectedEducationLevel, selectedMediaType, searchQuery, sortBy, user, isAdmin]);

  // Open Auth Modal
  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  // Toggle favorite with toast
  const handleToggleFavorite = async (resourceId: string) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    try {
      const added = await toggleFavorite(resourceId);
      showToast(
        added ? 'บันทึกสื่อลงในรายการโปรดแล้ว' : 'ลบสื่อออกจากรายการโปรดแล้ว',
        added ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถบันทึกรายการโปรดได้', 'error');
    }
  };

  // Delete Resource Handler
  const handleDeleteResource = async (res: Resource) => {
    try {
      await deleteDoc(doc(db, 'resources', res.id));
      showToast('ลบสื่อการเรียนรู้ออกจากฐานข้อมูลสำเร็จ', 'success');
      setSelectedResource(null);
    } catch (err) {
      showToast('ไม่สามารถลบสื่อได้ ตรวจสอบสิทธิ์ของคุณ', 'error');
    }
  };

  // Media Types for Filter
  const mediaFilterOptions: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'ทุกประเภทสื่อ', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'video', label: 'วิดีโอ', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'pdf', label: 'PDF', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'website', label: 'เว็บไซต์', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'document', label: 'ใบงาน', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'slide', label: 'สไลด์', icon: <Presentation className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif]">
      
      {/* Navbar Component */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onOpenCreate={() => {
          setEditingResource(null);
          setCreateModalOpen(true);
        }}
        onOpenGuide={() => setGuideModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <button 
            onClick={() => {
              setCurrentTab('browse');
              setSelectedCategory('all');
              setSelectedEducationLevel('all');
              setSelectedMediaType('all');
              setSearchQuery('');
            }}
            className="hover:text-blue-600 transition flex items-center gap-1 font-medium"
          >
            <span>หน้าแรก</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

          {currentTab === 'admin' ? (
            <span className="text-indigo-600 font-semibold">แผงควบคุมผู้ดูแลระบบ (Admin)</span>
          ) : currentTab === 'favorites' ? (
            <span className="text-amber-600 font-semibold">รายการโปรดที่บันทึกไว้</span>
          ) : (
            <>
              <span className="text-slate-700 font-medium">คลังสื่อความรู้</span>
              {selectedCategory !== 'all' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-blue-600 font-semibold">{selectedCategory}</span>
                </>
              )}
            </>
          )}
        </nav>

        {/* View Switch: If Admin Tab */}
        {currentTab === 'admin' && isAdmin ? (
          <AdminDashboard
            onSelectResourceForPreview={(res) => setSelectedResource(res)}
          />
        ) : (
          <>
            {/* Hero Section (Only in Browse Tab) */}
            {currentTab === 'browse' && (
              <section className="relative rounded-3xl bg-gradient-to-br from-blue-700 via-sky-600 to-indigo-800 p-6 sm:p-10 text-white shadow-xl overflow-hidden">
                <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-blue-100 border border-white/20">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>แพลตฟอร์มแบ่งปันสื่อการศึกษาฟรีสำหรับคนไทย</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    ค้นหาและแบ่งปัน <br />
                    <span className="bg-gradient-to-r from-amber-300 via-white to-sky-200 bg-clip-text text-transparent">
                      สื่อการเรียนรู้คุณภาพ
                    </span> เพื่อทุกคน
                  </h1>

                  <p className="text-sm sm:text-base text-blue-100 max-w-xl leading-relaxed">
                    รวมคลิปวิดีโอสอน ใบงาน แบบฝึกหัด สไลด์การสอน และแหล่งข้อมูลวิชาการสำหรับทุกระดับชั้น เข้าถึงฟรีตลอด 24 ชั่วโมง
                  </p>

                  {/* Prominent Search Bar */}
                  <div className="pt-2">
                    <div className="relative max-w-2xl bg-white rounded-2xl shadow-2xl p-1.5 flex items-center gap-2 border border-blue-200/50">
                      <div className="pl-3.5 text-slate-400">
                        <Search className="w-5 h-5 text-blue-600" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อวิชา เช่น Python, แคลคูลัส, ฟิสิกส์, วรรณคดี..."
                        className="flex-1 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {}}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition transform active:scale-95 shrink-0"
                      >
                        ค้นหา
                      </button>
                    </div>
                  </div>

                  {/* Quick stats counter */}
                  <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                      <span>สื่อทั้งหมดในระบบ: <strong>{resources.length} รายการ</strong></span>
                    </div>
                    <div>
                      หมวดหมู่วิชา: <strong>{settings.categories.length} หมวด</strong>
                    </div>
                    <div>
                      ฐานข้อมูล: <strong>Cloud Firestore (Realtime)</strong>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Favorites Tab Header Banner */}
            {currentTab === 'favorites' && (
              <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 p-6 sm:p-8 text-white shadow-lg flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-amber-100 mb-2">
                    <Bookmark className="w-3.5 h-3.5 fill-white" />
                    <span>รายการโปรดส่วนตัว</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    สื่อการเรียนรู้ที่คุณบันทึกไว้ ({favorites.length})
                  </h1>
                  <p className="text-xs sm:text-sm text-amber-100 mt-1">
                    ข้อมูลซิงค์ตรงกับบัญชีผู้ใช้ของคุณ สามารถเปิดดูทบทวนได้ทุกที่ ทุกเวลา
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-800 rounded-xl text-xs font-semibold shadow-xs hover:bg-amber-50 transition"
                >
                  <Compass className="w-4 h-4" />
                  <span>ค้นหาสื่อเพิ่มเติม</span>
                </button>
              </div>
            )}

            {/* Filter and Category Navigation Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              
              {/* Category Pills Slider / Wrap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>เลือกหมวดหมู่วิชา</span>
                  </span>
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      ล้างตัวกรองหมวดหมู่
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ทั้งหมด ({resources.length})
                  </button>

                  {settings.categories.map((cat) => {
                    const count = resources.filter(r => r.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Filters Bar: Education Level, Media Type, Sort By */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* Media type filter buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-semibold mr-1">รูปแบบสื่อ:</span>
                  {mediaFilterOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedMediaType(opt.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
                        selectedMediaType === opt.id
                          ? 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Level & Sort dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-semibold">ระดับชั้น:</span>
                    <select
                      value={selectedEducationLevel}
                      onChange={(e) => setSelectedEducationLevel(e.target.value)}
                      className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="all">ทุกระดับชั้น</option>
                      {settings.educationLevels.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-semibold">เรียงตาม:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="latest">ใหม่ล่าสุด</option>
                      <option value="views">เข้าชมมากที่สุด</option>
                      <option value="favorites">บันทึกมากที่สุด</option>
                    </select>
                  </div>
                </div>

              </div>

            </div>

            {/* Resources List / Grid */}
            <div className="space-y-4">
              
              {/* Header result stats */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  แสดงผลลัพธ์ <strong>{filteredResources.length}</strong> รายการ
                  {searchQuery && <span> จากการค้นหา &quot;{searchQuery}&quot;</span>}
                </span>

                {(selectedCategory !== 'all' || selectedEducationLevel !== 'all' || selectedMediaType !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedEducationLevel('all');
                      setSelectedMediaType('all');
                      setSearchQuery('');
                    }}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    ล้างการค้นหาทั้งหมด
                  </button>
                )}
              </div>

              {/* Loading State */}
              {loadingResources ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center animate-bounce mb-3 shadow-xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">กำลังเชื่อมต่อคลังความรู้ Cloud Firestore...</p>
                  <p className="text-xs text-slate-400 mt-1">กรุณารอสักครู่ ข้อมูลจะปรากฏขึ้นโดยอัตโนมัติ</p>
                </div>
              ) : filteredResources.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 opacity-60" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {currentTab === 'favorites' ? 'คุณยังไม่มีรายการโปรดที่บันทึกไว้' : 'ไม่พบสื่อการเรียนรู้ที่ตรงกับเงื่อนไข'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      {currentTab === 'favorites' 
                        ? 'กดปุ่มบุ๊กมาร์กบนการ์ดสื่อที่คุณชื่นชอบเพื่อเก็บไว้อ่านหรือทบทวนในหน้านี้'
                        : 'ลองปรับเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นพบเนื้อหาใหม่'}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    {currentTab === 'favorites' ? (
                      <button
                        onClick={() => setCurrentTab('browse')}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition"
                      >
                        สำรวจคลังสื่อทั้งหมด
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (!user) handleOpenAuth('login');
                            else {
                              setEditingResource(null);
                              setCreateModalOpen(true);
                            }
                          }}
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>เป็นคนแรกที่แบ่งปันสื่อในหมวดนี้</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* If entire DB is empty, offer seed helper */}
                  {resources.length === 0 && currentTab === 'browse' && (
                    <div className="pt-6 max-w-lg mx-auto">
                      <SampleDataLoader onLoaded={() => {}} />
                    </div>
                  )}
                </div>
              ) : (
                /* Resource Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      isFavorited={favorites.includes(resource.id)}
                      onToggleFavorite={(e, id) => {
                        e.stopPropagation();
                        handleToggleFavorite(id);
                      }}
                      onSelect={(res) => setSelectedResource(res)}
                      isAuthorOrAdmin={Boolean(user && (user.uid === resource.authorId || isAdmin))}
                      onEdit={(res) => {
                        setEditingResource(res);
                        setCreateModalOpen(true);
                      }}
                      onDelete={(res) => handleDeleteResource(res)}
                    />
                  ))}
                </div>
              )}

            </div>
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-800 text-sm">{settings.siteName}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <button
                onClick={() => setGuideModalOpen(true)}
                className="hover:text-blue-600 transition flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>คู่มือระบบ & Firebase Console</span>
              </button>
              <button
                onClick={() => {
                  if (isAdmin) setCurrentTab('admin');
                  else handleOpenAuth('login');
                }}
                className="hover:text-blue-600 transition"
              >
                เข้าสู่แผงควบคุมแอดมิน
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>© 2026 {settings.siteName}. เพื่อการศึกษาและการแบ่งปันความรู้โดยไม่แสวงหาผลกำไร</p>
            <p>Cloud Firestore & Firebase Authentication Active</p>
          </div>
        </div>
      </footer>

      {/* All Modal Components */}
      
      {/* 1. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
      />

      {/* 2. Create / Edit Resource Modal */}
      <ResourceFormModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingResource(null);
        }}
        editingResource={editingResource}
        onSuccess={() => {}}
      />

      {/* 3. Resource Detail Preview Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        isOpen={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        isFavorited={Boolean(selectedResource && favorites.includes(selectedResource.id))}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
        onOpenReport={(res) => setReportTargetResource(res)}
        onOpenEdit={(res) => {
          setSelectedResource(null);
          setEditingResource(res);
          setCreateModalOpen(true);
        }}
        onDeleteResource={(res) => handleDeleteResource(res)}
      />

      {/* 4. Report Content Modal */}
      <ReportModal
        isOpen={Boolean(reportTargetResource)}
        onClose={() => setReportTargetResource(null)}
        resource={reportTargetResource}
      />

      {/* 5. Firebase Setup Guide & Test Flow Modal */}
      <FirebaseGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <MainApp />
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
