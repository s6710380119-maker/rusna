import React from 'react';
import { 
  X, 
  BookOpen, 
  ShieldCheck, 
  Key, 
  Users, 
  FileText, 
  CheckCircle2, 
  ExternalLink,
  Mail,
  Lock,
  Sparkles
} from 'lucide-react';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">คู่มือการตั้งค่า Firebase Console & การทดสอบระบบ</h2>
              <p className="text-xs text-blue-100">
                คำแนะนำทีละขั้นตอนสำหรับการเปิดใช้ Authentication, สิทธิ์แอดมิน และการทดสอบ
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          
          {/* Step 1: Firebase Auth setup */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 text-base">
              <Key className="w-5 h-5 text-blue-600" />
              <span>1. การเปิดใช้งาน Sign-in Method ใน Firebase Console</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              เพื่อให้ระบบรองรับทั้ง <strong>อีเมล/รหัสผ่าน (Email/Password)</strong> และ <strong>Google Sign-In</strong> อย่างสมบูรณ์ ให้ไปที่{' '}
              <a 
                href="https://console.firebase.google.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 font-semibold underline inline-flex items-center gap-1"
              >
                Firebase Console <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <ol className="list-decimal list-inside text-xs space-y-1.5 text-slate-700 pl-1">
              <li>ไปที่เมนู <strong>Build</strong> &gt; <strong>Authentication</strong> &gt; แถบ <strong>Sign-in method</strong></li>
              <li>คลิก <strong>Email/Password</strong> &gt; สวิตช์เป็น <strong>Enable</strong> &gt; คลิก <strong>Save</strong></li>
              <li>คลิก <strong>Google</strong> &gt; สวิตช์เป็น <strong>Enable</strong> &gt; เลือกอีเมลสนับสนุนโปรเจกต์ &gt; คลิก <strong>Save</strong></li>
            </ol>
          </div>

          {/* Step 2: 3-Tier Roles */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <h3 className="font-bold text-indigo-950 flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>2. โครงสร้างสิทธิ์ 3 ระดับ (Role-Based Access Control)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                <span className="font-bold text-slate-800 block mb-1">1. บุคคลทั่วไป (Guest)</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  ค้นหา กรอง และเปิดดูสื่อการเรียนรู้สาธารณะได้ทั้งหมดโดยไม่ต้องล็อกอิน
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                <span className="font-bold text-emerald-700 block mb-1">2. สมาชิก (Member)</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  โพสต์สื่อใหม่ แก้ไข/ลบสื่อตนเอง กดบันทึกรายการโปรด และรายงานเนื้อหาไม่เหมาะสม
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                <span className="font-bold text-indigo-700 block mb-1">3. ผู้ดูแลระบบ (Admin)</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  แอดมินหลักถูกตั้งค่าอัตโนมัติสำหรับอีเมล <code>s6710380119@pkru.ac.th</code> สามารถตรวจสอบรายงาน ซ่อน/ลบสื่อ ปรับสิทธิ์สมาชิก และเพิ่ม/ลบหมวดหมู่
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Test Scenario Walkthrough */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>3. ลำดับขั้นตอนการทดสอบระบบจริง (Test Flow)</span>
            </h3>
            
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ขั้นตอนที่ 1 - บุคคลทั่วไป:</strong> เข้าชมหน้าแรก ใช้ช่องค้นหาขนาดใหญ่ ทดลองเลือกหมวดหมู่วิชา และคลิกดูรายละเอียดสื่อตัวอย่าง
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ขั้นตอนที่ 2 - สมัครสมาชิก & เข้าสู่ระบบ:</strong> คลิกปุ่ม &quot;สมัครสมาชิก&quot; กรอกชื่อ อีเมล รหัสผ่าน (มีปุ่มเปิด/ปิดตาดูรหัส) หรือกดล็อกอินด้วย Google ทันที
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ขั้นตอนที่ 3 - การบันทึกรายการโปรด:</strong> กดปุ่มหัวใจ/บุ๊กมาร์กที่การ์ดสื่อ ข้อมูลจะถูกบันทึกจริงใน Firestore คอลเลกชัน <code>favorites</code> และซิงค์ข้ามอุปกรณ์
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ขั้นตอนที่ 4 - แบ่งปันสื่อใหม่:</strong> กดปุ่ม &quot;แบ่งปันสื่อใหม่&quot; ใส่ชื่อ แนบลิงก์ YouTube หรือ Drive และเลือกประเภทสื่อ ข้อมูลจะบันทึกลง <code>resources</code>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ขั้นตอนที่ 5 - รายงานเนื้อหา:</strong> เปิดดูสื่อ แล้วกดปุ่ม &quot;รายงานสื่อนี้&quot; ระบุสาเหตุ เช่น ลิงก์เสีย หรือ ไม่เหมาะสม ข้อมูลจะเข้า <code>reports</code>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ขั้นตอนที่ 6 - หน้าผู้ดูแลระบบ (Admin Console):</strong> ล็อกอินด้วยอีเมล <code>s6710380119@pkru.ac.th</code> จะมีแท็บ &quot;แผงควบคุมแอดมิน&quot; ขึ้นมา ให้ทดลองซ่อน/ลบสื่อ เปลี่ยนสิทธิ์สมาชิก และเพิ่มหมวดหมู่วิชาใหม่
                </div>
              </div>
            </div>
          </div>

          {/* Database collections summary */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Collections ใน Cloud Firestore ที่เชื่อมต่อจริง
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <span className="p-2 bg-slate-50 rounded-lg border border-slate-100">📁 users</span>
              <span className="p-2 bg-slate-50 rounded-lg border border-slate-100">📁 resources</span>
              <span className="p-2 bg-slate-50 rounded-lg border border-slate-100">📁 favorites</span>
              <span className="p-2 bg-slate-50 rounded-lg border border-slate-100">📁 reports</span>
              <span className="p-2 bg-slate-50 rounded-lg border border-slate-100">📁 moderationLogs</span>
              <span className="p-2 bg-slate-50 rounded-lg border border-slate-100">📁 settings</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            เข้าใจแล้ว & ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
