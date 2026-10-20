import React from 'react';
import { 
  Video, 
  FileText, 
  Globe, 
  BookOpen, 
  Presentation, 
  File, 
  Bookmark, 
  Eye, 
  ExternalLink,
  User as UserIcon,
  Calendar,
  Lock
} from 'lucide-react';
import { Resource } from '../types';
import { formatDateThai } from '../utils/media';

interface ResourceCardProps {
  resource: Resource;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelect: (resource: Resource) => void;
  isAuthorOrAdmin: boolean;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorited,
  onToggleFavorite,
  onSelect,
  isAuthorOrAdmin,
  onEdit,
  onDelete
}) => {
  const getMediaBadge = () => {
    switch (resource.mediaType) {
      case 'video':
        return {
          icon: <Video className="w-3.5 h-3.5" />,
          label: 'วิดีโอ',
          color: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      case 'pdf':
        return {
          icon: <FileText className="w-3.5 h-3.5" />,
          label: 'PDF',
          color: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'website':
        return {
          icon: <Globe className="w-3.5 h-3.5" />,
          label: 'เว็บไซต์',
          color: 'bg-sky-50 text-sky-700 border-sky-200'
        };
      case 'document':
        return {
          icon: <BookOpen className="w-3.5 h-3.5" />,
          label: 'ใบงาน/เอกสาร',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'slide':
        return {
          icon: <Presentation className="w-3.5 h-3.5" />,
          label: 'สไลด์การสอน',
          color: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      default:
        return {
          icon: <File className="w-3.5 h-3.5" />,
          label: 'สื่อการเรียนรู้',
          color: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  const badge = getMediaBadge();
  const isHidden = resource.status === 'hidden';

  return (
    <div 
      onClick={() => onSelect(resource)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer transform hover:-translate-y-1"
    >
      {/* Hidden banner indicator if author/admin is previewing hidden resource */}
      {isHidden && (
        <div className="bg-amber-500 text-white text-[11px] font-semibold py-1 px-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            สถานะ: ซ่อนจากบุคคลทั่วไป (Draft / Hidden)
          </span>
        </div>
      )}

      {/* Top Media Bar */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${badge.color}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </span>

            <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100 truncate max-w-[130px]">
              {resource.category}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={(e) => onToggleFavorite(e, resource.id)}
            className={`p-2 rounded-xl transition border ${
              isFavorited
                ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100'
                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 border-transparent'
            }`}
            title={isFavorited ? 'ลบออกจากรายการโปรด' : 'บันทึกลงรายการโปรด'}
          >
            <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-lg text-slate-800 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {resource.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
        </p>
      </div>

      {/* Tags / Level Badge */}
      <div className="px-5 py-1">
        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
          ระดับ: {resource.educationLevel || 'ทุกระดับชั้น'}
        </span>
      </div>

      <div className="flex-1"></div>

      {/* Author and stats footer */}
      <div className="p-5 pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div className="flex items-center gap-1.5 truncate max-w-[150px]">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
            {(resource.authorName || 'U')[0].toUpperCase()}
          </div>
          <span className="truncate font-medium text-slate-700">{resource.authorName || 'ผู้แบ่งปัน'}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-slate-400">
          <span className="flex items-center gap-1" title="จำนวนครั้งที่เข้าชม">
            <Eye className="w-3.5 h-3.5" />
            <span>{resource.viewCount || 0}</span>
          </span>
          <span className="flex items-center gap-1" title="วันที่เผยแพร่">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDateThai(resource.createdAt)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
