import React, { useEffect, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Bookmark, 
  Flag, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar, 
  User as UserIcon, 
  Share2, 
  Check, 
  Video, 
  FileText, 
  Globe, 
  BookOpen, 
  Presentation, 
  File,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { Resource } from '../types';
import { formatDateThai, getYouTubeEmbedUrl } from '../utils/media';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenReport: (resource: Resource) => void;
  onOpenEdit: (resource: Resource) => void;
  onDeleteResource: (resource: Resource) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  isFavorited,
  onToggleFavorite,
  onOpenReport,
  onOpenEdit,
  onDeleteResource
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Increment view count when modal opens
  useEffect(() => {
    if (isOpen && resource?.id) {
      const resDocRef = doc(db, 'resources', resource.id);
      updateDoc(resDocRef, {
        viewCount: increment(1)
      }).catch(() => {
        // silently ignore increment error if offline or limited
      });
    }
  }, [isOpen, resource?.id]);

  if (!isOpen || !resource) return null;

  const isAuthor = Boolean(user && resource.authorId === user.uid);
  const canManage = isAuthor || isAdmin;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(resource.url);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(resource.url || window.location.href);
      setCopied(true);
      showToast('คัดลอกลิงก์สื่อการเรียนรู้แล้ว', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {resource.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
              {resource.educationLevel || 'ทุกระดับชั้น'}
            </span>
            {resource.status === 'hidden' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Lock className="w-3 h-3" />
                ซ่อนไว้ (Hidden)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl border border-slate-200 transition"
              title="แชร์ลิงก์สื่อนี้"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl border border-slate-200 transition"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {resource.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                {resource.authorName || 'สมาชิกทั่วไป'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateThai(resource.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                เข้าชม {resource.viewCount || 0} ครั้ง
              </span>
            </div>
          </div>

          {/* Media Player / Interactive Preview */}
          {youtubeEmbedUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={youtubeEmbedUrl}
                title={resource.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  {resource.mediaType === 'pdf' && <FileText className="w-6 h-6" />}
                  {resource.mediaType === 'website' && <Globe className="w-6 h-6" />}
                  {resource.mediaType === 'document' && <BookOpen className="w-6 h-6" />}
                  {resource.mediaType === 'slide' && <Presentation className="w-6 h-6" />}
                  {resource.mediaType === 'video' && <Video className="w-6 h-6" />}
                  {resource.mediaType === 'other' && <File className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">
                    ประเภทสื่อ: {resource.mediaType.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                    {resource.url}
                  </div>
                </div>
              </div>

              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition transform active:scale-95 shrink-0"
              >
                <span>เปิดสื่อต้นฉบับ</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Description */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              คำอธิบายและรายละเอียดสื่อการเรียนรู้
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {resource.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับสื่อนี้'}
            </p>
          </div>

          {/* Direct link fallback */}
          {youtubeEmbedUrl && (
            <div className="text-right">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                <span>เปิดดูบน YouTube โดยตรง</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>คุณแน่ใจหรือไม่ว่าต้องการลบสื่อนี้ออกจากระบบอย่างถาวร?</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteResource(resource);
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-xs"
              >
                ยืนยันการลบจริง
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {/* Toggle Favorite */}
            <button
              onClick={() => onToggleFavorite(resource.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                isFavorited
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isFavorited ? 'บันทึกแล้ว' : 'บันทึกรายการโปรด'}</span>
            </button>

            {/* Report Content */}
            <button
              onClick={() => onOpenReport(resource)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="รายงานเนื้อหาไม่เหมาะสมหรือลิงก์เสีย"
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">รายงานสื่อนี้</span>
            </button>
          </div>

          {/* Manage Actions (Author or Admin) */}
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenEdit(resource)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>แก้ไขข้อมูล</span>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบสื่อ</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
