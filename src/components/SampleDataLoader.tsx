import React, { useState } from 'react';
import { Sparkles, Loader2, Database, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Resource } from '../types';

interface SampleDataLoaderProps {
  onLoaded: () => void;
}

export const SampleDataLoader: React.FC<SampleDataLoaderProps> = ({ onLoaded }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const sampleResources: Omit<Resource, 'id'>[] = [
    {
      title: 'พื้นฐานการเขียนโปรแกรม Python สำหรับผู้เริ่มต้นและนักเรียน ม.ปลาย',
      description: 'บทเรียนปูพื้นฐานภาษา Python ตั้งแต่ตัวแปร เงื่อนไข การวนซ้ำ และฟังก์ชัน พร้อมตัวอย่างเขียนโค้ดแก้โจทย์ปัญหาจริง เหมาะสำหรับวิชาวิทยาการคำนวณ',
      category: 'วิทยาการคำนวณและไอที',
      educationLevel: 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
      mediaType: 'video',
      url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
      authorId: user?.uid || 'seed_teacher_1',
      authorName: user?.displayName || 'ครูสมชาย เทคโนโลยี',
      authorEmail: user?.email || 'teacher.somchai@edushare.th',
      status: 'published',
      viewCount: 42,
      favoriteCount: 8,
      reportCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      title: 'สรุปสูตรคณิตศาสตร์ ม.ต้น เรื่อง ทฤษฎีบทพีทาโกรัสและตรีโกณมิติเบื้องต้น',
      description: 'ใบสรุปสูตรและเทคนิคการทำโจทย์เรขาคณิตสามเหลี่ยมมุมฉาก รวมแบบฝึกหัด 20 ข้อ พร้อมเฉลยละเอียดทีละสเต็ป',
      category: 'คณิตศาสตร์',
      educationLevel: 'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
      mediaType: 'pdf',
      url: 'https://www.scimath.org/lesson-mathematics',
      authorId: user?.uid || 'seed_teacher_2',
      authorName: 'อ.พรทิพย์ คณิตคิดเร็ว',
      authorEmail: 'pornthip@edushare.th',
      status: 'published',
      viewCount: 65,
      favoriteCount: 15,
      reportCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      title: 'การทดลองจำลองฟิสิกส์: การเคลื่อนที่แบบโพรเจกไทล์ (PhET Interactive Simulations)',
      description: 'เว็บไซต์แบบจำลองการยิงมุมต่างๆ เพื่อศึกษาระยะทาง ความเร็ว และแรงโน้มถ่วง สนุก เข้าใจง่ายผ่านสื่อ Interactive',
      category: 'วิทยาศาสตร์และฟิสิกส์',
      educationLevel: 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
      mediaType: 'website',
      url: 'https://phet.colorado.edu/th/simulations/projectile-motion',
      authorId: user?.uid || 'seed_teacher_3',
      authorName: 'ดร.กิตติพงษ์ วิทยาศาสตร์',
      authorEmail: 'kittipong@edushare.th',
      status: 'published',
      viewCount: 88,
      favoriteCount: 21,
      reportCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      title: 'เทคนิคการจำ 12 English Tenses แบบเข้าใจง่ายด้วย Timeline',
      description: 'วิดีโออธิบายโครงสร้างไวยากรณ์ภาษาอังกฤษ 12 Tense พร้อมประโยคตัวอย่างในชีวิตประจำวันสำหรับเตรียมสอบเข้ามหาวิทยาลัย',
      category: 'ภาษาอังกฤษและภาษาต่างประเทศ',
      educationLevel: 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
      mediaType: 'video',
      url: 'https://www.youtube.com/watch?v=84jVz045Q6o',
      authorId: user?.uid || 'seed_teacher_4',
      authorName: 'ครูพี่แนท English',
      authorEmail: 'nat.eng@edushare.th',
      status: 'published',
      viewCount: 110,
      favoriteCount: 34,
      reportCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      title: 'ใบงานวิเคราะห์วรรณคดี เรื่อง รามเกียรติ์ ตอน ศึกมัยราพณ์',
      description: 'ใบงานสรุปข้อคิด คุณค่าทางวรรณศิลป์ และบทบาทของตัวละครหลัก พร้อมคำถามกระตุ้นความคิดเชิงวิพากษ์',
      category: 'ภาษาไทย',
      educationLevel: 'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
      mediaType: 'document',
      url: 'https://www.trueplookpanya.com/learning/thai',
      authorId: user?.uid || 'seed_teacher_5',
      authorName: 'ครูวรรณา ภาษาไทย',
      authorEmail: 'wanna@edushare.th',
      status: 'published',
      viewCount: 35,
      favoriteCount: 7,
      reportCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      title: 'สไลด์การสอน: จริยธรรมและกฎหมายดิจิทัล (PDPA & พระราชบัญญัติคอมพิวเตอร์)',
      description: 'ชุดสไลด์นำเสนอสำหรับครูผู้สอนเพื่อใช้ในคาบเรียน เรื่องการคุ้มครองข้อมูลส่วนบุคคล ลิขสิทธิ์ออนไลน์ และมารยาทบนโลกไซเบอร์',
      category: 'การงานอาชีพและเทคโนโลยี',
      educationLevel: 'สำหรับครูผู้สอน / ทั่วไป',
      mediaType: 'slide',
      url: 'https://www.canva.com',
      authorId: user?.uid || 'seed_teacher_6',
      authorName: 'ศูนย์นวัตกรรมการศึกษา',
      authorEmail: 'innovation@edushare.th',
      status: 'published',
      viewCount: 73,
      favoriteCount: 19,
      reportCount: 0,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 6).toISOString()
    }
  ];

  const handleSeed = async () => {
    setLoading(true);
    try {
      for (const res of sampleResources) {
        await addDoc(collection(db, 'resources'), res);
      }
      showToast('เพิ่มสื่อการเรียนรู้ตัวอย่างเข้าสู่ Cloud Firestore สำเร็จแล้ว', 'success');
      onLoaded();
    } catch (err: any) {
      console.error('Seed error:', err);
      showToast('ไม่สามารถนำเข้าสื่อตัวอย่างได้ กรุณาเข้าสู่ระบบก่อน', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 sm:p-6 text-center space-y-3 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
        <Sparkles className="w-6 h-6 text-amber-300" />
      </div>
      <div>
        <h3 className="font-bold text-base text-slate-800">
          เริ่มต้นสำรวจคลังความรู้ด้วยสื่อการสอนตัวอย่าง
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          นำเข้าตัวอย่างสื่อคุณภาพ 6 วิชา (คลิปสอน Python, ใบงานคณิตศาสตร์, ฟิสิกส์ PhET, ภาษาอังกฤษ ฯลฯ) ลงในฐานข้อมูล Cloud Firestore จริงได้ในคลิกเดียว
        </p>
      </div>
      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition transform active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>กำลังบันทึกลง Firestore...</span>
          </>
        ) : (
          <>
            <Database className="w-4 h-4" />
            <span>นำเข้าชุดสื่อการสอนตัวอย่าง (6 วิชา)</span>
          </>
        )}
      </button>
    </div>
  );
};
