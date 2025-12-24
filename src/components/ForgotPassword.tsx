// src/components/ForgotPassword.tsx
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface ForgotPasswordProps {
  language?: 'ar' | 'en';
  onBackToLogin?: () => void; // اختياري: للعودة لصفحة الدخول
  t?: any;
}

export function ForgotPassword({
  language = 'ar',
  onBackToLogin,
  t,
}: ForgotPasswordProps) {
  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);

  // تطبيع البريد: إزالة المحارف الخفية ثم trim ثم تحويل إلى أحرف صغيرة
  const INVISIBLES_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u200B]/g;
  const normalizeEmail = (v: string) => v.replace(INVISIBLES_REGEX, '').trim().toLowerCase();
  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleaned = normalizeEmail(email);
    if (!validateEmail(cleaned)) {
      setError(tr('أدخل بريدًا إلكترونيًا بصيغة صحيحة', 'Enter a valid email address'));
      return;
    }

    try {
      setSubmitting(true);
      await sendPasswordResetEmail(auth, cleaned);
      // رسالة عامة متوافقة مع أفضل الممارسات الأمنية
      setMessage(tr('إذا كان البريد مسجّلًا، ستصل رسالة لإعادة تعيين كلمة المرور.', 'If the email is registered, a reset email will be sent.'));
    } catch (err: any) {
      // لا نكشف إن كان البريد موجودًا أم لا
      setMessage(tr('إذا كان البريد مسجّلًا، ستصل رسالة لإعادة تعيين كلمة المرور.', 'If the email is registered, a reset email will be sent.'));
      console.warn('[ForgotPassword]', err?.code || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-[480px] px-8">
        <div className="bg-white rounded-2xl border p-10 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl mb-2">
              {t?.resetPasswordTitle || tr('استعادة كلمة المرور', 'Reset Password')}
            </h1>
            <p className="text-muted-foreground">
              {t?.resetPasswordSubtitle || tr('أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين', 'Enter your email to receive a reset link')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="mb-2 block">
                {t?.email || tr('البريد الإلكتروني', 'Email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive -mt-2">{error}</p>}
            {message && <p className="text-sm text-green-600 -mt-2">{message}</p>}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#860A33] hover:bg-[#860A33]/90 text-white disabled:opacity-70"
            >
              {submitting
                ? (t?.sending || tr('جارٍ الإرسال...', 'Sending...'))
                : (t?.sendResetLink || tr('إرسال رابط إعادة التعيين', 'Send reset link'))}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-[#860A33] hover:underline"
            >
              {t?.backToLogin || tr('العودة لتسجيل الدخول', 'Back to login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
