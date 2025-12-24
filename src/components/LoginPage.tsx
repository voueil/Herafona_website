import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginPageProps {
  onLogin?: (email: string, password: string) => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgot?: () => void; // الانتقال لصفحة استعادة كلمة المرور
  language?: 'ar' | 'en';
  t?: any;
}

export function LoginPage({
  onLogin,
  onNavigateToRegister,
  onNavigateToForgot,
  language = 'ar',
  t,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});

  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);

  // تطبيع البريد: إزالة المحارف الخفية + trim + lowercase
  const INVISIBLES_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u200B]/g;
  const normalizeEmail = (v: string) => v.replace(INVISIBLES_REGEX, '').trim().toLowerCase();

  // التحقق من الصيغة
  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // إرسال نموذج الدخول
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedEmail = normalizeEmail(email);
    const newErrors: typeof errors = {};

    if (!cleanedEmail) newErrors.email = tr('البريد الإلكتروني مطلوب', 'Email is required');
    else if (!validateEmail(cleanedEmail)) newErrors.email = tr('رجاءً أدخل بريدًا إلكترونيًّا بصيغة صحيحة', 'Please enter a valid email address');

    if (!password) newErrors.password = tr('كلمة المرور مطلوبة', 'Password is required');

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const cred = await signInWithEmailAndPassword(auth, cleanedEmail, password);
      console.log('[LOGIN] success uid =', cred.user.uid);
      onLogin?.(cleanedEmail, password);
    } catch (error: any) {
      const code = error?.code as string;

      // توحيد رسالة بيانات الاعتماد غير الصحيحة
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found'
      ) {
        setErrors({ password: tr('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Email or password is incorrect') });
      } else if (code === 'auth/user-disabled') {
        setErrors({ email: tr('تم تعطيل هذا الحساب', 'This account has been disabled') });
      } else if (code === 'auth/too-many-requests') {
        setErrors({ global: tr('محاولات كثيرة. جرّب لاحقًا.', 'Too many attempts. Try again later.') });
      } else if (code === 'auth/network-request-failed') {
        setErrors({ global: tr('مشكلة في الاتصال بالإنترنت', 'Network error') });
      } else {
        setErrors({ global: tr('حدث خطأ غير متوقع', 'Unexpected error') });
        console.error('[Login error]', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // الانتقال إلى صفحة الاستعادة
  const goToForgot = () => {
    if (onNavigateToForgot) onNavigateToForgot();
    else window.location.href = '/forgot-password';
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-[480px] px-8">
        <div className="bg-white rounded-2xl border p-10 shadow-lg">
          <div className="text-center mb-10">
            <h1 className="text-3xl mb-3 text-[#15442f]">
              {t?.welcomeBack || tr('مرحبًا بعودتك', 'Welcome back')}
            </h1>
            <p className="text-muted-foreground">
              {t?.loginSubtitle || tr('سجّل الدخول للوصول إلى حسابك', 'Sign in to access your account')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="mb-3 block">
                {t?.email || tr('البريد الإلكتروني', 'Email')}
              </Label>
              <div className="relative">
                <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive mt-2">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="mb-3 block">
                {t?.password || tr('كلمة المرور', 'Password')}
              </Label>
              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {errors.global && <p className="text-sm text-destructive -mt-2">{errors.global}</p>}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goToForgot}
                className="text-sm text-[#860A33] hover:underline"
              >
                {tr('نسيت كلمة المرور؟', 'Forgot password?')}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#860A33] hover:bg-[#860A33]/90 text-white disabled:opacity-70"
            >
              {loading ? (t?.loading || tr('جارٍ الدخول…', 'Signing in…')) : (t?.login || tr('تسجيل الدخول', 'Sign in'))}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {t?.noAccount || tr('ليس لديك حساب؟', "Don't have an account?")}{' '}
              <button onClick={onNavigateToRegister} className="text-[#860A33] hover:underline">
                {t?.createAccount || tr('إنشاء حساب', 'Create account')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
