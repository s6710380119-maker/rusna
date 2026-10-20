import React, { useState } from 'react';
import { 
  X, 
  Flag, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Resource, ReportReason } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  resource
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนส่งรายงานเนื้อหา');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const now = new Date().toISOString();
      const reportData = {
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: user.uid,
        reporterEmail: user.email || 'anonymous',
        reason,
        details: details.trim(),
        status: 'pending' as const,
        createdAt: now
      };

      await addDoc(collection(db, 'reports'), reportData);

      // Increment resource reportCount
      try {
        await updateDoc(doc(db, 'resources', resource.id), {
          reportCount: increment(1)
        });
      } catch {
        // ignore increment error
      }

      showToast('ส่งรายงานไปยังผู้ดูแลระบบเรียบร้อยแล้ว ขอบคุณที่ร่วมดูแลชุมชน', 'success');
      onClose();
      setDetails('');
    } catch (err) {
      console.error('Report error:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'reports');
      } catch {
        setErrorMsg('ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const reasonOptions: { id: ReportReason; label: string; desc: string }[] = [
    { id: 'broken_link', label: 'ลิงก์เสีย / เปิดสื่อไม่ได้', desc: 'ไฟล์ถูกลบ ลิงก์เข้าไม่ได้ หรือเปิดวิดีโอไม่ขึ้น' },
    { id: 'copyright', label: 'ละเมิดลิขสิทธิ์', desc: 'นำผลงานของผู้อื่นมาเผยแพร่โดยไม่ได้รับอนุญาต' },
    { id: 'inappropriate', label: 'เนื้อหาไม่เหมาะสม / หยาบคาย', desc: 'มีเนื้อหารุนแรง ลามก หรือไม่เหมาะกับการศึกษา' },
    { id: 'spam', label: 'ข้อมูลเท็จ / สแปม / โฆษณา', desc: 'เนื้อหาหลอกลวง โฆษณาเว็บพนัน หรือเนื้อหาซ้ำซาก' },
    { id: 'other', label: 'อื่นๆ', desc: 'เหตุผลอื่นๆ โปรดระบุเพิ่มเติม' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">รายงานเนื้อหาที่ไม่เหมาะสม</h3>
              <p className="text-xs text-rose-100 truncate max-w-xs sm:max-w-sm">
                สื่อ: {resource.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              โปรดระบุสาเหตุที่รายงาน <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {reasonOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    reason === opt.id
                      ? 'bg-rose-50/50 border-rose-500 text-rose-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === opt.id}
                    onChange={() => setReason(opt.id)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุข้อมูลเพิ่มเติมเพื่อช่วยให้ผู้ดูแลตรวจสอบได้รวดเร็วขึ้น..."
              maxLength={1000}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>ยืนยันส่งรายงาน</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
