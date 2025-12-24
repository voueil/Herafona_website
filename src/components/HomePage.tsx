import { Button } from './ui/button';

import heroHeader from '../assets/new-header.png';

import type { PageString } from "../App";

interface HomePageProps {
onNavigate?: (page: PageString) => void
  language?: 'ar' | 'en';
  t?: any;
}

export function HomePage({ onNavigate, language = 'ar', t }: HomePageProps) {
  const isRTL = language === 'ar';

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ================= Hero ================= */}
      <section className="relative h-[600px] overflow-hidden">
  <img
    src={heroHeader}
    alt=""
    aria-hidden="true"
    className="absolute inset-0 z-0 h-full w-full object-cover"
    loading="eager"
    decoding="async"
  />

  {/* طبقة بُنّية خفيفة ترفع التباين */}
  <div className="absolute inset-0 z-10 pointer-events-none bg-[#3F2A22]/40 mix-blend-multiply" />

  {/* التدرّج الداكن من جهة النص */}
 <div
  className="absolute inset-0 z-20 pointer-events-none"
  style={{
    backgroundImage: isRTL
      ? 'linear-gradient(to left, rgba(0,0,0,.6), rgba(0,0,0,.3), rgba(0,0,0,0))'
      : 'linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.3), rgba(0,0,0,0))',
  }}
/>


  {/* المحتوى فوق الكل */}
  <div className="relative z-30 container mx-auto max-w-[1440px] px-8 h-full flex items-center">
    <div className="max-w-2xl text-white">
      <h1 className="text-5xl mb-6 leading-snug">
        {t?.heroTitle ?? 'من يد الحرفة، إلى قلب التجربة'}
      </h1>
      <p className="text-xl mb-10 opacity-90">
        {t?.heroSubtitle ?? 'اكتشف الحِرف السعودية الأصيلة بتجارب عملية مميزة'}
      </p>
      <div className="flex gap-4">
        <Button
          size="lg"
          onClick={() => onNavigate?.('events')}
          className="bg-[#860A33] hover:bg-[#860A33]/90 text-white px-8"
        >
          {t?.exploreNow ?? 'استكشف التجارب'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => onNavigate?.('login')}
          className="bg-white/10 border-white text-white hover:bg-white/20 backdrop-blur-sm px-8"
        >
          {isRTL ? 'انضم كحرفي' : 'Join as Artisan'}
        </Button>
      </div>
    </div>
  </div>
</section>


   {/* ================= Features ================= */}
<section className="py-24 bg-[#FCFBF5]">
  <div className="container mx-auto max-w-[1440px] px-8">
    <h2 className="text-3xl font-semibold text-[#3F2A22] text-center mb-12">
      {isRTL ? 'لماذا حِرفُنا؟' : 'Why Herafona?'}
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start text-center">
      {/* Feature 1 - هوية ثقافية */}
      <div className="space-y-4">
        <img
          src="/benefits/Sadu.png"
          alt="هوية ثقافية"
          className="w-24 h-24 mx-auto object-contain"
        />
        <h3 className="text-2xl font-semibold text-[#3F2A22]">
          هوية ثقافية
        </h3>
        <p className="text-[#6B6B6B] max-w-[360px] mx-auto leading-relaxed">
          اكتشف نقوشًا وزخارف تنبض بعبق التاريخ وأصالة التراث العريق.
        </p>
      </div>

      {/* Feature 2 - حرف متوارثة */}
      <div className="space-y-4">
        <img
          src="/benefits/Pottrey.png"
          alt="حرف متوارثة"
          className="w-24 h-24 mx-auto object-contain"
        />
        <h3 className="text-2xl font-semibold text-[#3F2A22]">
          حرف متوارثة
        </h3>
        <p className="text-[#6B6B6B] max-w-[360px] mx-auto leading-relaxed">
          تعرّف على فنون يدوية عريقة شكّلت ملامح الحياة اليومية عبر القرون.
        </p>
      </div>

      {/* Feature 3 - طبيعة أصيلة */}
      <div className="space-y-4">
        <img
          src="/benefits/Palm.png"
          alt="طبيعة أصيلة"
          className="w-24 h-24 mx-auto object-contain"
        />
        <h3 className="text-2xl font-semibold text-[#3F2A22]">
          طبيعة أصيلة
        </h3>
        <p className="text-[#6B6B6B] max-w-[360px] mx-auto leading-relaxed">
          استمتع بجمال الطبيعة السعودية التي تلهم الحِرف وتغذي روح الإبداع.
        </p>
      </div>
    </div>
  </div>
</section>


      {/* ================= CTA ================= */}
      <section className="py-24">
        <div className="container mx-auto max-w-[1440px] px-8">
          <div className="bg-[#15442f] rounded-2xl p-16 text-white text-center">
            <h2 className="text-4xl mb-4">
              {isRTL ? 'ابدأ رحلتك مع الحِرف اليوم' : 'Start Your Craft Journey Today'}
            </h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              {isRTL
                ? 'انضم إلى مئات المستفيدين واكتشف عالم الحِرف السعودية الأصيلة'
                : 'Join hundreds of participants and discover the world of authentic Saudi crafts'}
            </p>
            <Button
              size="lg"
              onClick={() => onNavigate?.('events')}
              className="bg-white text-[#15442f] hover:bg-white/90 px-10"
            >
              {isRTL ? 'تصفح الفعاليات' : 'Browse Events'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
