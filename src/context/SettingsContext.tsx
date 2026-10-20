import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SiteSettings } from '../types';

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>, userEmail: string) => Promise<void>;
  addCategory: (category: string, userEmail: string) => Promise<void>;
  removeCategory: (category: string, userEmail: string) => Promise<void>;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'EduShare Thailand - คลังปัญญาและสื่อการเรียนรู้',
  siteDescription: 'ศูนย์กลางแบ่งปันสื่อการสอน บทเรียน คลิปวิดีโอ ใบงาน และองค์ความรู้เพื่อการศึกษาไทย สำหรับนักเรียน นักศึกษา และครูอาจารย์',
  announcement: 'ยินดีต้อนรับสู่ EduShare Thailand! ร่วมแบ่งปันสื่อการเรียนรู้คุณภาพและเข้าถึงคลังปัญญาฟรีได้แล้ววันนี้',
  categories: [
    'วิทยาการคำนวณและไอที',
    'คณิตศาสตร์',
    'วิทยาศาสตร์และฟิสิกส์',
    'ภาษาไทย',
    'ภาษาอังกฤษและภาษาต่างประเทศ',
    'สังคมศึกษาและประวัติศาสตร์',
    'ศิลปะและดนตรี',
    'สุขศึกษาและพลศึกษา',
    'การงานอาชีพและเทคโนโลยี',
    'การเตรียมสอบและแนะแนว'
  ],
  educationLevels: [
    'ประถมศึกษา (ป.1 - ป.6)',
    'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
    'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
    'อุดมศึกษา / ปริญญาตรี',
    'สำหรับครูผู้สอน / ทั่วไป'
  ],
  updatedBy: 'system',
  updatedAt: new Date().toISOString()
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'general');

    const unsubscribe = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteSettings>;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            categories: data.categories && data.categories.length > 0 ? data.categories : DEFAULT_SETTINGS.categories,
            educationLevels: data.educationLevels && data.educationLevels.length > 0 ? data.educationLevels : DEFAULT_SETTINGS.educationLevels
          });
        } else {
          // Keep default settings
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Error reading settings snapshot:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newValues: Partial<SiteSettings>, userEmail: string) => {
    const settingsDocRef = doc(db, 'settings', 'general');
    const updatedData: SiteSettings = {
      ...settings,
      ...newValues,
      updatedBy: userEmail,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(settingsDocRef, updatedData, { merge: true });
      setSettings(updatedData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/general');
    }
  };

  const addCategory = async (categoryName: string, userEmail: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed || settings.categories.includes(trimmed)) return;

    const newCategories = [...settings.categories, trimmed];
    await updateSettings({ categories: newCategories }, userEmail);
  };

  const removeCategory = async (categoryName: string, userEmail: string) => {
    if (settings.categories.length <= 1) {
      throw new Error('ต้องมีหมวดหมู่อย่างน้อย 1 หมวดหมู่');
    }
    const newCategories = settings.categories.filter(c => c !== categoryName);
    await updateSettings({ categories: newCategories }, userEmail);
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, addCategory, removeCategory }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
