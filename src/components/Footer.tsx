import whiteLogo from '../assets/logo-white.png';
import type { PageString } from "../App";

interface FooterProps {
  language?: 'ar' | 'en';
  t?: any;
onNavigate?: (page: PageString) => void
}

export function Footer({ language = 'ar', t, onNavigate }: FooterProps) {
  const isRTL = language === 'ar';

  return (
    <footer className="border-t bg-[#15442f] mt-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-[1440px] px-8 py-16">
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-6">
            <img src={whiteLogo} alt="Herafona" className="h-16 w-auto mb-6" />
            <p className="text-white/80 mb-6">
              {t?.footerTagline || 'اكتشف الحِرف السعودية الأصيلة بتجارب عملية مميزة'}
            </p>
          </div>

          <div className="col-span-6">
            <h3 className="mb-6 text-white">{t?.quickLinks || 'روابط سريعة'}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href=""
                  onClick={(e) => { e.preventDefault(); onNavigate?.('home'); }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t?.home || 'الصفحة الرئيسية'}
                </a>
              </li>
              <li>
                <a
                  href=""
                  onClick={(e) => { e.preventDefault(); onNavigate?.('events'); }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t?.events || 'الفعاليات'}
                </a>
              </li>
              <li>
                <a
                  href=""
                  onClick={(e) => { e.preventDefault(); onNavigate?.('assistant'); }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {isRTL ? 'مساعد حِرفُنا' : 'Herafona Assistant'}
                </a>
              </li>
              <li>
                <a
                  href=""
                  onClick={(e) => { e.preventDefault(); onNavigate?.('home'); }} 
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t?.about || 'من نحن'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/70">
          <p>{t?.footerCopyright || '© 2025 حِرفُنا. جميع الحقوق محفوظة'}</p>
        </div>
      </div>
    </footer>
  );
}
