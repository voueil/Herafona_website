import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { User, Mail, Phone, MapPin, Edit, Home } from 'lucide-react';
import type { PageString } from "../App";

// Firestore
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../firebase';

interface UserData {
  uid: string;
  fullName: string;
  email: string;  
  phoneNumber: string;
  city: string;
  accountType: 'tourist' | 'user' | 'artisan';
  avatarUrl?: string;
}

interface ProfilePageProps {
  userData: UserData;
onNavigate?: (page: PageString) => void
  onUpdate?: (data: Partial<UserData>) => void;
  language?: 'ar' | 'en';
  t?: any;
}

export function ProfilePage({
  userData,
  onNavigate,
  onUpdate,
  language = 'ar',
  t,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userData);
  const [saving, setSaving] = useState(false);

  const isRTL = language === 'ar';

  const handleSave = async () => {
    try {
      setSaving(true);

      const fullName = formData.fullName?.trim();
      const phoneNumber = formData.phoneNumber?.trim();
      const city = formData.city?.trim();

      if (!fullName) {
        alert(isRTL ? 'الاسم الكامل مطلوب' : 'Full name is required');
        setSaving(false);
        return;
      }
      if (!phoneNumber) {
        alert(isRTL ? 'رقم الجوال مطلوب' : 'Phone number is required');
        setSaving(false);
        return;
      }
      if (!city) {
        alert(isRTL ? 'المدينة مطلوبة' : 'City is required');
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'users', userData.uid), {
        fullName,
        phoneNumber,
        city,
        updatedAt: serverTimestamp(),   
      });

      onUpdate?.({ fullName, phoneNumber, city });

      setIsEditing(false);
      alert(isRTL ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully!');
    } catch (error) {
      console.error('فشل تحديث البيانات:', error);
      alert(isRTL ? 'حدث خطأ أثناء تحديث البيانات' : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-[1000px] px-8">
        <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#15442f] p-10 text-white">
            <div className="flex items-center gap-8">
              <Avatar className="h-28 w-28 border-4 border-white">
                <AvatarImage src={formData.avatarUrl} />
                <AvatarFallback className="bg-white text-[#15442f] text-3xl">
                  {(formData.fullName?.[0] || 'U').toUpperCase() }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl mb-3">{formData.fullName}</h1>
                <Badge className="bg-white/20 hover:bg-white/20 text-white border-white/40">
                  {formData.accountType === 'artisan'
                    ? (isRTL ? 'حِرفي' : 'Artisan')
                    : (isRTL ? 'مستخدم' : 'User')}
                </Badge>
              </div>
              <Button
                onClick={() => onNavigate?.('home')}
                variant="outline"
                className="bg-white/10 border-white text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Home className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {isRTL ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl text-[#3F2A22]">
                {t?.personalInfo || 'المعلومات الشخصية'}
              </h2>

              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-[#3F2A22] text-[#3F2A22] hover:bg-[#3F2A22] hover:text-white"
                >
                  <Edit className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {isRTL ? 'تعديل' : 'Edit'}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#15442f] hover:bg-[#15442f]/90 text-white"
                  >
                    {saving
                      ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...')
                      : (t?.saveChanges || (isRTL ? 'حفظ التغييرات' : 'Save Changes'))}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(userData);  
                    }}
                    variant="outline"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <Label className="mb-3 block">{t?.fullName || 'الاسم الكامل'}</Label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!isEditing}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <Label className="mb-3 block">{t?.email || 'البريد الإلكتروني'}</Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    value={formData.email}
                    disabled // can't change email
                    className={`${isRTL ? 'pr-10' : 'pl-10'} bg-secondary/50`}
                  />
                </div>
               <p className="text-xs text-muted-foreground mt-1">
  {isRTL ? 'لا يمكن تعديل البريد الإلكتروني' : 'Email cannot be changed'}
</p>

              </div>

              {/* Phone */}
              <div>
                <Label className="mb-3 block">{t?.phoneNumber || 'رقم الجوال'}</Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <Label className="mb-3 block">{t?.city || 'المدينة'}</Label>
                <div className="relative">
                  <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              {/* Account Type */}
              <div className="col-span-2">
                <Label className="mb-3 block">{t?.accountType || 'نوع الحساب'}</Label>
                <Input
                  value={
                    formData.accountType === 'artisan'
                      ? (isRTL ? 'حِرفي' : 'Artisan')
                      : (isRTL ? 'مستخدم' : 'User')
                  }
                  disabled
                  className="bg-secondary/50"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {isRTL ? 'لا يمكن تعديل نوع الحساب' : 'Account type cannot be changed'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
