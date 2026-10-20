export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
}

export function formatDateThai(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function getMediaTypeBadge(type: string): { label: string; color: string; iconName: string } {
  switch (type) {
    case 'video':
      return { label: 'วิดีโอ', color: 'bg-rose-50 text-rose-700 border-rose-200', iconName: 'Video' };
    case 'pdf':
      return { label: 'PDF / เอกสาร', color: 'bg-red-50 text-red-700 border-red-200', iconName: 'FileText' };
    case 'website':
      return { label: 'เว็บไซต์ / ลิงก์', color: 'bg-blue-50 text-blue-700 border-blue-200', iconName: 'Globe' };
    case 'document':
      return { label: 'ใบงาน / แบบฝึกหัด', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconName: 'BookOpen' };
    case 'slide':
      return { label: 'สไลด์การสอน', color: 'bg-amber-50 text-amber-700 border-amber-200', iconName: 'Presentation' };
    default:
      return { label: 'แหล่งเรียนรู้', color: 'bg-slate-50 text-slate-700 border-slate-200', iconName: 'File' };
  }
}
