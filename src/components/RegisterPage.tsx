// src/components/RegisterPage.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';

// Firebase
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Types
type Gender = '' | 'male' | 'female';
type AccountType = '' | 'user' | 'artisan';
type City = '' | 'الرياض' | 'جدة' | 'الدمام' | 'القصيم';

interface RegisterForm {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: Gender;
  city: City;
  accountType: AccountType;
  password: string;
  confirmPassword: string;
}

interface RegisterPageProps {
  onRegister?: (data: any) => void;
  onNavigateToLogin?: () => void;
  language?: 'ar' | 'en';
  t?: any;
}

export function RegisterPage({
  onRegister,
  onNavigateToLogin,
  language = 'ar',
  t,
}: RegisterPageProps) {
  const [formData, setFormData] = useState<RegisterForm>({
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    city: '',
    accountType: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);

  // تنظيف البريد: إزالة المحارف الخفية + trim + lowercase
  const INVISIBLES_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u200B]/g;
  const normalizeEmail = (v: string) => v.replace(INVISIBLES_REGEX, '').trim().toLowerCase();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) =>
    /^(\+?966|0)?5\d{8}$/.test(phone) || /^[0-9+()\-\s]{8,14}$/.test(phone);

  const mapFirebaseError = (code: string) => {
    const ar: Record<string, string> = {
      'auth/email-already-in-use': 'البريد مستخدم مسبقًا',
      'auth/invalid-email': 'البريد الإلكتروني غير صالح',
      'auth/weak-password': 'كلمة المرور ضعيفة',
      'auth/operation-not-allowed': 'نوع التسجيل غير مفعّل',
      'auth/network-request-failed': 'مشكلة في الاتصال بالإنترنت',
    };
    const en: Record<string, string> = {
      'auth/email-already-in-use': 'Email already in use',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Weak password',
      'auth/operation-not-allowed': 'Provider not enabled',
      'auth/network-request-failed': 'Network error',
    };
    return (isRTL ? ar : en)[code] || tr('حدث خطأ غير متوقع', 'Unexpected error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setGlobalError('');
    const newErrors: Record<string, string> = {};

    // 1) تحقّق الحقول
    if (!formData.fullName) newErrors.fullName = tr('الاسم الكامل مطلوب', 'Full name is required');

    const cleanedEmail = normalizeEmail(formData.email);
    if (!cleanedEmail) newErrors.email = tr('البريد الإلكتروني مطلوب', 'Email is required');
    else if (!validateEmail(cleanedEmail)) newErrors.email = tr('رجاءً أدخل بريدًا بصيغة صحيحة', 'Please enter a valid email');

    if (!formData.phoneNumber) newErrors.phoneNumber = tr('رقم الجوال مطلوب', 'Phone number is required');
    else if (!validatePhone(formData.phoneNumber)) newErrors.phoneNumber = tr('صيغة رقم الجوال غير صحيحة', 'Invalid phone number');

    if (!formData.gender) newErrors.gender = tr('الجنس مطلوب', 'Gender is required');
    if (!formData.city) newErrors.city = tr('المدينة مطلوبة', 'City is required');
    if (!formData.accountType) newErrors.accountType = tr('نوع الحساب مطلوب', 'Account type is required');

    if (!formData.password) newErrors.password = tr('كلمة المرور مطلوبة', 'Password is required');
    else if (formData.password.length < 6) newErrors.password = tr('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters');

    if (!formData.confirmPassword) newErrors.confirmPassword = tr('تأكيد كلمة المرور مطلوب', 'Password confirmation is required');
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = tr('التأكيد لا يطابق كلمة المرور', 'Passwords do not match');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);

      // 2) إنشاء المستخدم بالبريد المنظّف
      const cred = await createUserWithEmailAndPassword(auth, cleanedEmail, formData.password);
      console.log('[REGISTER] uid =', cred.user.uid, 'email =', cleanedEmail);

      // 3) تحديث الاسم المعروض في Auth
      if (formData.fullName?.trim()) {
        await updateProfile(cred.user, { displayName: formData.fullName.trim() });
      }

      // 4) إنشاء مستند المستخدم في Firestore (مطابق لــ FireUserDoc)
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          uid: cred.user.uid,
          fullName: formData.fullName.trim(),
          email: cleanedEmail,
          phoneNumber: formData.phoneNumber.trim(),
          city: formData.city,
          accountType: formData.accountType,
          avatarUrl: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // احتفظنا بـ gender لو تبي تستخدمينه لاحقًا
          gender: formData.gender || null,
        },
        { merge: true }
      );

      onRegister?.({
        uid: cred.user.uid,
        email: cleanedEmail,
        fullName: formData.fullName.trim(),
        accountType: formData.accountType,
      });

      // 5) توجيه بعد النجاح
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.warn('[REGISTER] error =', error?.code, error);
      setGlobalError(mapFirebaseError(error?.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-[800px] px-8">
        <div className="bg-white rounded-2xl border p-10 shadow-lg">
          <div className="text-center mb-10">
            <h1 className="text-3xl mb-3 text-[#15442f]">
              {t?.createNewAccount || 'إنشاء حساب جديد'}
            </h1>
            <p className="text-muted-foreground">
              {t?.registerSubtitle || 'انضم إلى مجتمع حِرفُنا'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="mb-3 block">
                  {t?.fullName || 'الاسم الكامل'}
                </Label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="fullName"
                    placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} ${errors.fullName ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive mt-2">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="mb-3 block">
                  {t?.email || 'البريد الإلكتروني'}
                </Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive mt-2">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phoneNumber" className="mb-3 block">
                  {t?.phoneNumber || 'رقم الجوال'}
                </Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+966 5x xxx xxxx"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} ${errors.phoneNumber ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-sm text-destructive mt-2">{errors.phoneNumber}</p>}
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor="gender" className="mb-3 block">
                  {isRTL ? 'الجنس' : 'Gender'}
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isRTL ? 'اختر الجنس' : 'Select gender'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{isRTL ? 'ذكر' : 'Male'}</SelectItem>
                    <SelectItem value="female">{isRTL ? 'أنثى' : 'Female'}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-destructive mt-2">{errors.gender}</p>}
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city" className="mb-3 block">
                  {t?.city || 'المدينة'}
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value: City) => setFormData({ ...formData, city: value })}
                >
                  <SelectTrigger className={errors.city ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isRTL ? 'اختر المدينة' : 'Select city'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الرياض">{isRTL ? 'الرياض' : 'Riyadh'}</SelectItem>
                    <SelectItem value="جدة">{isRTL ? 'جدة' : 'Jeddah'}</SelectItem>
                    <SelectItem value="الدمام">{isRTL ? 'الدمام' : 'Dammam'}</SelectItem>
                    <SelectItem value="القصيم">{isRTL ? 'القصيم' : 'Qassim'}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-sm text-destructive mt-2">{errors.city}</p>}
              </div>

              {/* Account Type */}
              <div>
                <Label htmlFor="accountType" className="mb-3 block">
                  {t?.accountType || 'نوع الحساب'}
                </Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value: AccountType) => setFormData({ ...formData, accountType: value })}
                >
                  <SelectTrigger className={errors.accountType ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isRTL ? 'اختر نوع الحساب' : 'Select account type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t?.regularUser || 'مستخدم عادي'}</SelectItem>
                    <SelectItem value="artisan">{t?.artisan || 'حِرفي'}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.accountType && <p className="text-sm text-destructive mt-2">{errors.accountType}</p>}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="mb-3 block">
                  {t?.password || 'كلمة المرور'}
                </Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-2">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="mb-3 block">
                  {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive mt-2">{errors.confirmPassword}</p>}
              </div>
            </div>

            {globalError && <div className="text-sm text-destructive">{globalError}</div>}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#860A33] hover:bg-[#860A33]/90 text-white"
            >
              {submitting ? (t?.creating || 'جاري إنشاء الحساب...') : (t?.register || 'إنشاء الحساب')}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {t?.haveAccount || 'لديك حساب؟'}{' '}
              <button onClick={onNavigateToLogin} className="text-[#860A33] hover:underline">
                {t?.login || 'تسجيل الدخول'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
