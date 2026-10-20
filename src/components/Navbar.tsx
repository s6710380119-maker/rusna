import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  PlusCircle, 
  Bookmark, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  HelpCircle, 
  Megaphone, 
  X,
  Menu,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface NavbarProps {
  currentTab: 'browse' | 'favorites' | 'admin';
  setCurrentTab: (tab: 'browse' | 'favorites' | 'admin') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenCreate: () => void;
  onOpenGuide: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenCreate,
  onOpenGuide,
  searchQuery,
  setSearchQuery
}) => {
  const { user, profile, isAdmin, isMember, isSuspended, logout, favorites } = useAuth();
  const { settings } = useSettings();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Announcement Banner */}
      {showAnnouncement && settings.announcement && (
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 text-white text-xs sm:text-sm py-2 px-4 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium truncate">
              <Megaphone className="w-4 h-4 shrink-0 animate-pulse text-amber-300" />
              <span className="truncate">{settings.announcement}</span>
            </div>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="text-white/80 hover:text-white p-1 rounded-full transition"
              title="ปิดประกาศ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentTab('browse');
                setSearchQuery('');
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-sky-600 bg-clip-text text-transparent block leading-tight">
                  EduShare TH
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                  คลังปัญญา & สื่อการเรียนรู้
                </span>
              </div>
            </button>

            {/* Role indicator badge */}
            <div className="hidden lg:flex items-center ml-2">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  ผู้ดูแลระบบ (Admin)
                </span>
              ) : isMember ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  สมาชิกทั่วไป
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  บุคคลทั่วไป (Guest)
                </span>
              )}
            </div>
          </div>

          {/* Quick Search bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาวิชา, ใบงาน, วิดีโอ, หัวข้อ..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links & Action Buttons */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCurrentTab('browse')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                currentTab === 'browse'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              คลังสื่อทั้งหมด
            </button>

            {/* Favorite tab */}
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth('login');
                } else {
                  setCurrentTab('favorites');
                }
              }}
              className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'favorites'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-4 h-4 text-amber-500" />
              <span>รายการโปรด</span>
              {favorites.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Post Resource button */}
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth('login');
                } else {
                  onOpenCreate();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>แบ่งปันสื่อใหม่</span>
            </button>

            {/* Admin Dashboard button */}
            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  currentTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>แผงควบคุมแอดมิน</span>
              </button>
            )}

            {/* System Guide / Help */}
            <button
              onClick={onOpenGuide}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
              title="คู่มือระบบ & การเชื่อมต่อ Firebase"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Account / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={profile?.displayName || 'User'}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {(profile?.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-semibold text-sm text-slate-800 truncate">
                        {profile?.displayName || 'สมาชิก'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isAdmin 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isAdmin ? '🛡️ ผู้ดูแลระบบ' : '🎓 สมาชิกทั่วไป'}
                        </span>
                        {user.emailVerified ? (
                          <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-md">
                            ✓ ยืนยันอีเมลแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">
                            รอตรวจสอบอีเมล
                          </span>
                        )}
                      </div>
                      {isSuspended && (
                        <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-1.5 rounded-md">
                          ⚠️ บัญชีถูกระงับการโพสต์ชั่วคราว
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('favorites');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                        สื่อที่บันทึกไว้ ({favorites.length})
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setCurrentTab('admin');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          แดชบอร์ดผู้ดูแลระบบ
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenGuide}
              className="p-2 text-slate-500 hover:text-blue-600 rounded-lg"
              title="คู่มือระบบ"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-3 animate-in slide-in-from-top-2">
            {/* Mobile Search */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาวิชา, ใบงาน, วิดีโอ..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 rounded-xl border border-slate-200"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setCurrentTab('browse');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 px-3 rounded-xl text-sm font-medium text-center ${
                  currentTab === 'browse' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700'
                }`}
              >
                คลังสื่อทั้งหมด
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    onOpenAuth('login');
                  } else {
                    setCurrentTab('favorites');
                  }
                  setMobileMenuOpen(false);
                }}
                className={`py-2 px-3 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-1.5 ${
                  currentTab === 'favorites' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span>รายการโปรด ({favorites.length})</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth('login');
                } else {
                  onOpenCreate();
                }
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>แบ่งปันสื่อการเรียนรู้ใหม่</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setCurrentTab('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-medium text-sm border border-indigo-200"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>แผงควบคุมผู้ดูแลระบบ (Admin)</span>
              </button>
            )}

            <div className="border-t border-slate-100 pt-3">
              {user ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{profile?.displayName}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-1 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2 text-center text-sm font-medium bg-blue-50 text-blue-700 rounded-xl"
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth('register');
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2 text-center text-sm font-medium bg-slate-900 text-white rounded-xl"
                  >
                    สมัครสมาชิก
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
