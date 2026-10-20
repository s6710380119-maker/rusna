import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Edit3, 
  Video, 
  FileText, 
  Globe, 
  BookOpen, 
  Presentation, 
  File, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  Link as LinkIcon
} from 'lucide-react';
import { Resource, MediaType, ResourceStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingResource?: Resource | null;
  onSuccess: () => void;
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  editingResource,
  onSuccess
}) => {
  const { user, profile, isSuspended } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('website');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ResourceStatus>('published');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingResource) {
      setTitle(editingResource.title || '');
      setDescription(editingResource.description || '');
      setCategory(editingResource.category || settings.categories[0] || '');
      setEducationLevel(editingResource.educationLevel || settings.educationLevels[0] || '');
      setMediaType(editingResource.mediaType || 'website');
      setUrl(editingResource.url || '');
      setStatus(editingResource.status || 'published');
    } else {
      setTitle('');
      setDescription('');
      setCategory(settings.categories[0] || 'วิทยาการคำนวณและไอที');
      setEducationLevel(settings.educationLevels[0] || 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)');
      setMediaType('website');
      setUrl('');
      setStatus('published');
    }
    setErrorMsg('');
  }, [editingResource, settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนทำการโพสต์สื่อการเรียนรู้');
      return;
    }

    if (isSuspended) {
      setErrorMsg('บัญชีของคุณถูกระงับการโพสต์สื่อชั่วคราว โปรดติดต่อผู้ดูแลระบบ');
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      setErrorMsg('ชื่อสื่อการเรียนรู้ต้องมีความยาวระหว่าง 3 ถึง 200 ตัวอักษร');
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorMsg('กรุณากรอกลิงก์ของสื่อการเรียนรู้ (เช่น YouTube, Google Drive, หรือ URL เว็บไซต์)');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setErrorMsg('ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://');
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();

      if (editingResource) {
        // Update existing resource
        const resRef = doc(db, 'resources', editingResource.id);
        const updatePayload: Partial<Resource> = {
          title: trimmedTitle,
          description: description.trim(),
          category,
          educationLevel,
          mediaType,
          url: trimmedUrl,
          status,
          updatedAt: now
        };
        await updateDoc(resRef, updatePayload);
        showToast('แก้ไขข้อมูลสื่อการเรียนรู้สำเร็จ', 'success');
      } else {
        // Create new resource
        const newResource: Omit<Resource, 'id'> = {
          title: trimmedTitle,
          description: description.trim(),
          category: category || (settings.categories[0] || 'ทั่วไป'),
          educationLevel: educationLevel || (settings.educationLevels[0] || 'ทุกระดับชั้น'),
          mediaType,
          url: trimmedUrl,
          authorId: user.uid,
          authorName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'สมาชิก',
          authorEmail: user.email || '',
          status,
          viewCount: 0,
          favoriteCount: 0,
          reportCount: 0,
          createdAt: now,
          updatedAt: now
        };

        await addDoc(collection(db, 'resources'), newResource);
        showToast('แบ่งปันสื่อการเรียนรู้ลงคลังปัญญาสำเร็จ!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Save resource error:', err);
      try {
        handleFirestoreError(
          err, 
          editingResource ? OperationType.UPDATE : OperationType.CREATE, 
          editingResource ? `resources/${editingResource.id}` : 'resources'
        );
      } catch (e: any) {
        setErrorMsg('ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบสิทธิ์และการเชื่อมต่อฐานข้อมูล');
      }
    } finally {
      setLoading(false);
    }
  };

  const mediaTypesList: { id: MediaType; label: string; icon: React.ReactNode }[] = [
    { id: 'video', label: 'วิดีโอ / YouTube', icon: <Video className="w-4 h-4" /> },
    { id: 'pdf', label: 'ไฟล์ PDF / สรุป', icon: <FileText className="w-4 h-4" /> },
    { id: 'website', label: 'เว็บไซต์ / ลิงก์', icon: <Globe className="w-4 h-4" /> },
    { id: 'document', label: 'ใบงาน / Word', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'slide', label: 'สไลด์ / พรีเซนต์', icon: <Presentation className="w-4 h-4" /> },
    { id: 'other', label: 'อื่นๆ', icon: <File className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              {editingResource ? <Edit3 className="w-5 h-5 text-white" /> : <PlusCircle className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingResource ? 'แก้ไขสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
              </h2>
              <p className="text-xs text-blue-100">
                ร่วมแบ่งปันใบงาน วิดีโอ หรือลิงก์ความรู้เพื่อเป็นประโยชน์ต่อนักเรียนและครู
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อสื่อ / หัวข้อการเรียนรู้ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรตรีโกณมิติ ม.5 หรือ ใบงานวิทยาการคำนวณ เรื่อง อัลกอริทึม"
              required
              minLength={3}
              maxLength={200}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
            />
            <div className="text-[11px] text-slate-400 text-right mt-1">
              {title.length}/200 ตัวอักษร
            </div>
          </div>

          {/* Media Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              ประเภทของสื่อ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mediaTypesList.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setMediaType(type.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                    mediaType === type.id
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={mediaType === type.id ? 'text-blue-600' : 'text-slate-400'}>
                    {type.icon}
                  </span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category & Education Level Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
              >
                {settings.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระดับชั้นเป้าหมาย <span className="text-rose-500">*</span>
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
              >
                {settings.educationLevels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* URL / Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ลิงก์สื่อการสอน (URL) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... หรือลิงก์ Google Drive, Canva, PDF"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              />
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              รองรับลิงก์ YouTube (จะแสดงวิดีโอตัวอย่างอัตโนมัติ), Google Drive (แชร์เป็นสาธารณะ), ลิงก์เอกสาร PDF หรือเว็บไซต์
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              คำอธิบายรายละเอียด หรือจุดประสงค์การเรียนรู้
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายเนื้อหาโดยสังเขป เหมาะสำหรับนำไปสอนหรือทบทวนอย่างไร..."
              maxLength={2000}
              className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition resize-none"
            />
          </div>

          {/* Visibility Status */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">สถานะการเผยแพร่</div>
              <div className="text-[11px] text-slate-500">
                {status === 'published' ? 'เผยแพร่สู่สาธารณะ ทุกคนสามารถค้นหาและเปิดดูได้' : 'ซ่อนไว้ (บันทึกเป็นฉบับร่างเฉพาะคุณ)'}
              </div>
            </div>
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  status === 'published' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                เผยแพร่
              </button>
              <button
                type="button"
                onClick={() => setStatus('hidden')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  status === 'hidden' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                ซ่อนไว้
              </button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingResource ? 'บันทึกการแก้ไข' : 'ยืนยันการแบ่งปันสื่อ'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
