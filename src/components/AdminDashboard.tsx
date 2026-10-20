import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Flag, 
  Users, 
  Settings, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Save, 
  Clock, 
  ExternalLink,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';
import { Report, UserProfile, Resource, ModerationLog } from '../types';
import { formatDateThai } from '../utils/media';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface AdminDashboardProps {
  onSelectResourceForPreview: (resource: Resource) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectResourceForPreview
}) => {
  const { user } = useAuth();
  const { settings, updateSettings, addCategory, removeCategory } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'settings' | 'logs'>('reports');

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Users state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Logs state
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Site Settings form state
  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [newCatInput, setNewCatInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string; reportId?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSiteName(settings.siteName);
    setSiteDescription(settings.siteDescription);
    setAnnouncement(settings.announcement);
  }, [settings]);

  // Realtime subscription for Reports
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Report[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];
        setReports(list);
        setLoadingReports(false);
      },
      (error) => {
        console.warn('Reports snapshot error:', error);
        setLoadingReports(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      setUsersList(list);
    } catch (err) {
      console.warn('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // Realtime subscription for Moderation Logs
  useEffect(() => {
    if (activeTab === 'logs') {
      const q = query(collection(db, 'moderationLogs'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: ModerationLog[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ModerationLog[];
          setLogs(list);
          setLoadingLogs(false);
        },
        (error) => {
          console.warn('Logs error:', error);
          setLoadingLogs(false);
        }
      );
      return () => unsubscribe();
    }
  }, [activeTab]);

  // Helper to record an audit action
  const logAudit = async (action: string, notes: string, targetResourceId?: string, targetUserId?: string) => {
    try {
      await addDoc(collection(db, 'moderationLogs'), {
        action,
        targetResourceId: targetResourceId || '',
        targetUserId: targetUserId || '',
        performedByUid: user?.uid || 'admin',
        performedByEmail: user?.email || 'admin@edushare.th',
        notes,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Audit log write error:', e);
    }
  };

  // Moderation: Hide or Unhide Resource
  const handleToggleResourceVisibility = async (resourceId: string, currentStatus: string, reportId?: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
      await updateDoc(doc(db, 'resources', resourceId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      if (reportId) {
        await updateDoc(doc(db, 'reports', reportId), {
          status: 'resolved'
        });
      }

      await logAudit(
        newStatus === 'hidden' ? 'hide_resource' : 'unhide_resource',
        `เปลี่ยนสถานะสื่อเป็น ${newStatus}`,
        resourceId
      );

      showToast(`เปลี่ยนสถานะสื่อเป็น ${newStatus === 'hidden' ? 'ซ่อนไว้' : 'เผยแพร่'} สำเร็จ`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะสื่อ', 'error');
    }
  };

  // Moderation: Resolve / Dismiss Report
  const handleUpdateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      await logAudit(
        `report_${status}`,
        `ปรับสถานะรายงานเป็น ${status}`,
        undefined,
        undefined
      );
      showToast(status === 'resolved' ? 'ทำเครื่องหมายว่าจัดการแล้ว' : 'ยกเลิกรายงานแล้ว', 'info');
    } catch (err) {
      showToast('ไม่สามารถอัปเดตสถานะรายงานได้', 'error');
    }
  };

  // Moderation: Confirm Delete Resource
  const handleDeleteResourceConfirmed = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'resources', itemToDelete.id));

      if (itemToDelete.reportId) {
        await updateDoc(doc(db, 'reports', itemToDelete.reportId), {
          status: 'resolved'
        });
      }

      await logAudit('delete_resource', `ลบสื่อ ${itemToDelete.title} ออกจากระบบถาวร`, itemToDelete.id);
      showToast('ลบสื่อการเรียนรู้ออกจากฐานข้อมูลสำเร็จ', 'success');
      setItemToDelete(null);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบสื่อ', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Inspect resource from report
  const handleInspectResource = async (resourceId: string) => {
    try {
      const snap = await getDoc(doc(db, 'resources', resourceId));
      if (snap.exists()) {
        const resData = { id: snap.id, ...snap.data() } as Resource;
        onSelectResourceForPreview(resData);
      } else {
        showToast('ไม่พบสื่อนี้ในระบบ (อาจถูกลบไปแล้ว)', 'warning');
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลสื่อได้', 'error');
    }
  };

  // User Management: Toggle Status (active <-> suspended)
  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        status: newStatus
      });
      setUsersList(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, status: newStatus } : u));
      await logAudit(
        newStatus === 'suspended' ? 'suspend_user' : 'activate_user',
        `เปลี่ยนสถานะผู้ใช้ ${targetUser.email} เป็น ${newStatus}`,
        undefined,
        targetUser.uid
      );
      showToast(`เปลี่ยนสถานะบัญชีเป็น ${newStatus === 'suspended' ? 'ระงับการใช้งาน' : 'ใช้งานปกติ'} แล้ว`, 'success');
    } catch (err) {
      showToast('ไม่สามารถปรับสถานะผู้ใช้ได้', 'error');
    }
  };

  // User Management: Change Role (member <-> admin)
  const handleToggleUserRole = async (targetUser: UserProfile) => {
    if (targetUser.email === 's6710380119@pkru.ac.th') {
      showToast('ไม่สามารถเปลี่ยนบทบาทของ Super Admin หลักได้', 'warning');
      return;
    }
    const newRole = targetUser.role === 'admin' ? 'member' : 'admin';
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        role: newRole
      });
      setUsersList(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: newRole } : u));
      await logAudit(
        'change_user_role',
        `เปลี่ยนสิทธิ์ผู้ใช้ ${targetUser.email} เป็น ${newRole}`,
        undefined,
        targetUser.uid
      );
      showToast(`ปรับสิทธิ์เป็น ${newRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกทั่วไป (Member)'} แล้ว`, 'success');
    } catch (err) {
      showToast('ไม่สามารถเปลี่ยนบทบาทได้', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateSettings({
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim(),
        announcement: announcement.trim()
      }, user?.email || 'admin');

      await logAudit('update_settings', 'อัปเดตข้อมูลและประกาศของเว็บไซต์');
      showToast('บันทึกการตั้งค่าเว็บไซต์สำเร็จ', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add Category
  const handleAddCategory = async () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    try {
      await addCategory(trimmed, user?.email || 'admin');
      setNewCatInput('');
      await logAudit('add_category', `เพิ่มหมวดหมู่วิชา: ${trimmed}`);
      showToast(`เพิ่มหมวดหมู่ "${trimmed}" สำเร็จ`, 'success');
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้', 'error');
    }
  };

  // Remove Category
  const handleRemoveCategory = async (cat: string) => {
    try {
      await removeCategory(cat, user?.email || 'admin');
      await logAudit('remove_category', `ลบหมวดหมู่วิชา: ${cat}`);
      showToast(`ลบหมวดหมู่ "${cat}" เรียบร้อยแล้ว`, 'info');
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถลบหมวดหมู่ได้', 'error');
    }
  };

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* Admin Title & Overview Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>ศูนย์ควบคุมผู้ดูแลระบบ (Admin Console)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            การจัดการคลังความรู้และสมาชิก
          </h1>
          <p className="text-sm text-indigo-200 mt-2 max-w-2xl leading-relaxed">
            ตรวจสอบรายงานเนื้อหาไม่เหมาะสม สื่อลิงก์เสีย จัดการสถานะสมาชิก และปรับแต่งหมวดหมู่วิชาของระบบได้แบบเรียลไทม์
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-indigo-800/60 relative z-10">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'reports'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-indigo-950/60 text-indigo-200 hover:bg-indigo-800/60'
            }`}
          >
            <Flag className="w-4 h-4 text-rose-400" />
            <span>รายงานเนื้อหา</span>
            {pendingReportsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'users'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-indigo-950/60 text-indigo-200 hover:bg-indigo-800/60'
            }`}
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>จัดการสมาชิก</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-indigo-950/60 text-indigo-200 hover:bg-indigo-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>ตั้งค่าระบบ & หมวดหมู่</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'logs'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'bg-indigo-950/60 text-indigo-200 hover:bg-indigo-800/60'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>บันทึกการตรวจสอบ (Logs)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Reports Management */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-600" />
                <span>รายการรายงานเนื้อหาและข้อร้องเรียน ({reports.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                ตรวจสอบสื่อที่มีการแจ้งว่าลิงก์เสีย ละเมิดลิขสิทธิ์ หรือเนื้อหาไม่เหมาะสม
              </p>
            </div>
          </div>

          {loadingReports ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs">กำลังโหลดรายการรายงาน...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="font-semibold text-slate-700 text-sm">ไม่มีรายงานที่รอการตรวจสอบ</div>
              <p className="text-xs text-slate-400 mt-1">คลังความรู้สะอาดและเป็นไปตามระเบียบชุมชนเรียบร้อย</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const reasonLabels: Record<string, { label: string; color: string }> = {
                  broken_link: { label: 'ลิงก์เสีย / เปิดไม่ได้', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                  copyright: { label: 'ละเมิดลิขสิทธิ์', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                  inappropriate: { label: 'เนื้อหาไม่เหมาะสม', color: 'bg-rose-100 text-rose-800 border-rose-200' },
                  spam: { label: 'สแปม / ข้อมูลเท็จ', color: 'bg-red-100 text-red-800 border-red-200' },
                  other: { label: 'อื่นๆ', color: 'bg-slate-100 text-slate-800 border-slate-200' },
                };

                const badge = reasonLabels[report.reason] || { label: report.reason, color: 'bg-slate-100 text-slate-700' };

                return (
                  <div
                    key={report.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      report.status === 'pending'
                        ? 'bg-white border-rose-200 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            report.status === 'pending' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : report.status === 'resolved' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            สถานะ: {report.status === 'pending' ? 'รอตรวจสอบ' : report.status === 'resolved' ? 'แก้ไขแล้ว' : 'ยกเลิก'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateThai(report.createdAt)}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm">
                          สื่อที่รายงาน: <span className="text-blue-700">{report.resourceTitle || report.resourceId}</span>
                        </h4>

                        {report.details && (
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 mt-1.5 italic">
                            &quot;{report.details}&quot;
                          </p>
                        )}

                        <div className="text-[11px] text-slate-400">
                          ผู้รายงาน: {report.reporterEmail}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                        <button
                          onClick={() => handleInspectResource(report.resourceId)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูสื่อ</span>
                        </button>

                        <button
                          onClick={() => handleToggleResourceVisibility(report.resourceId, 'published', report.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1"
                          title="ซ่อนสื่อนี้ไม่ให้แสดงในหน้าแรก"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>ซ่อนสื่อ</span>
                        </button>

                        <button
                          onClick={() => setItemToDelete({
                            id: report.resourceId,
                            title: report.resourceTitle || 'สื่อการเรียนรู้นี้',
                            reportId: report.id
                          })}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1"
                          title="ลบสื่อนี้ออกจากฐานข้อมูลจริง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบสื่อ</span>
                        </button>

                        {report.status === 'pending' ? (
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ปิดงาน</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                            title="ยกเลิกรายงาน"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>จัดการข้อมูลและสิทธิ์สมาชิก</span>
              </h2>
              <p className="text-xs text-slate-500">
                ค้นหาสมาชิก ปรับเปลี่ยนบทบาท (Member/Admin) หรือระงับบัญชีที่ทำผิดกฎ
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อหรืออีเมล..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={fetchUsers}
                className="p-1.5 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs">กำลังโหลดรายชื่อสมาชิก...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">สมาชิก</th>
                    <th className="py-3 px-4">อีเมล</th>
                    <th className="py-3 px-4">บทบาท (Role)</th>
                    <th className="py-3 px-4">สถานะบัญชี</th>
                    <th className="py-3 px-4">วันที่สมัคร</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList
                    .filter(u => 
                      !userSearchQuery.trim() ||
                      u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                    )
                    .map(u => (
                      <tr key={u.uid} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(u.displayName || 'U')[0].toUpperCase()}
                          </div>
                          <span>{u.displayName || 'ไม่ระบุชื่อ'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'admin' 
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {u.role === 'admin' ? '🛡️ ผู้ดูแลระบบ' : '🎓 สมาชิก'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {u.status === 'active' ? 'ปกติ' : '⚠️ ระงับการใช้งาน'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {formatDateThai(u.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Toggle role button */}
                          <button
                            onClick={() => handleToggleUserRole(u)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="สลับบทบาท สมาชิก <-> ผู้ดูแลระบบ"
                          >
                            {u.role === 'admin' ? 'ลดเป็นสมาชิก' : 'ตั้งเป็น Admin'}
                          </button>

                          {/* Toggle status button */}
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              u.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={u.status === 'active' ? 'ระงับบัญชีชั่วคราว' : 'ปลดการระงับ'}
                          >
                            {u.status === 'active' ? 'ระงับบัญชี' : 'ปลดระงับ'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Site & Category Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* General Site Metadata & Announcement */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>ข้อมูลเว็บไซต์และคำประกาศทั่วไป</span>
            </h3>
            <p className="text-xs text-slate-500">
              แก้ไขชื่อเว็บไซต์ คำอธิบาย และข้อความประกาศด้านบนของหน้าเว็บโดยไม่ต้องแก้โค้ด
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อเว็บไซต์ (Site Name)
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบายเว็บไซต์ (Site Description)
                </label>
                <textarea
                  rows={3}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความประกาศแถบด้านบน (Announcement Banner)
                </label>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="เช่น ยินดีต้อนรับสู่เปิดเทอมใหม่ ร่วมแชร์สื่อการสอนฟรีได้แล้ววันนี้"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-2 ml-auto disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>บันทึกการตั้งค่าลง Firestore</span>
                </button>
              </div>
            </form>
          </div>

          {/* Dynamic Category Management */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>จัดการหมวดหมู่วิชาความรู้</span>
            </h3>
            <p className="text-xs text-slate-500">
              เพิ่มหรือลบหมวดหมู่ความรู้ในระบบ หมวดหมู่ใหม่จะแสดงในตัวกรองและฟอร์มโพสต์ทันที
            </p>

            {/* Add Category Form */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="ชื่อหมวดหมู่ใหม่ เช่น ดาราศาสตร์และอวกาศ..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>
            </div>

            {/* List of current categories */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {settings.categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  <span className="font-medium">{cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                    title={`ลบหมวดหมู่ ${cat}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Audit / Moderation Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>ประวัติการทำงานของผู้ดูแลระบบ (Audit Trail)</span>
            </h2>
            <p className="text-xs text-slate-500">
              เก็บบันทึกการดำเนินการสำคัญเพื่อความโปร่งใสและตรวจสอบได้
            </p>
          </div>

          {loadingLogs ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs">กำลังโหลดบันทึกการตรวจสอบ...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs">ยังไม่มีประวัติการดำเนินการของผู้ดูแลระบบ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {log.action} : {log.notes}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ดำเนินการโดย: <span className="text-slate-600">{log.performedByEmail}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0">
                    {formatDateThai(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Resource Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบสื่อออกจากระบบถาวร?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณกำลังจะลบสื่อ &quot;{itemToDelete.title}&quot; ข้อมูลจะถูกลบออกจากฐานข้อมูล Firestore จริงและไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteResourceConfirmed}
                disabled={deleting}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-500/20"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>ลบสื่อจริง</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
