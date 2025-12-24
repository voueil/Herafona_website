import { useState } from 'react';
import { EventCard } from './EventCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Experience } from "../App";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { Search, Filter, X } from 'lucide-react';

interface EventsPageProps {
  experiences: Experience[];
  onBook?: (experience: Experience) => void;
  userType: "user" | "artisan" | "tourist";
  onAddExperience?: () => void;
  language?: 'ar' | 'en';
  t?: any;
}

export function EventsPage({ 
  experiences, 
  onBook, 
  userType, 
  onAddExperience,
  language = 'ar',
  t 
}: EventsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 400]);

  const isRTL = language === 'ar';

  // 🔍 فلترة التجارب حسب البحث والفلاتر
  const filteredEvents = experiences.filter((event) => {
    const matchesSearch =
      searchQuery === '' ||
      event.title.includes(searchQuery) ||
      event.artisanName.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesCity = selectedCity === 'all' || event.city === selectedCity;
    const matchesPrice =
      Number(event.pricePerPerson) >= priceRange[0] &&
      Number(event.pricePerPerson) <= priceRange[1];

    return matchesSearch && matchesCategory && matchesCity && matchesPrice;
  });

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setPriceRange([0, 400]);
  };

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-[1440px] px-8 py-16">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-3 text-[#15442f]">
              {t?.events || 'الفعاليات'}
            </h1>
            <p className="text-muted-foreground">
              {t?.exploreExperiences || 'استكشف التجارب الحرفية المتاحة'}
            </p>
          </div>
          {userType === 'artisan' && (
            <Button
              onClick={onAddExperience}
              className="bg-[#860A33] hover:bg-[#860A33]/90 text-white"
            >
              {t?.addExperience || '+ إضافة تجربة'}
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border p-8 mb-12">
          <div className="grid grid-cols-12 gap-6">
            {/* Search */}
            <div className="col-span-12">
              <Label className="mb-3 block">{t?.search || 'البحث'}</Label>
              <div className="relative">
                <Search
                  className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`}
                />
                <Input
                  placeholder={t?.searchPlaceholder || 'ابحث باسم الورشة أو الحرفي...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </div>
            </div>

            {/* Category */}
            <div className="col-span-4">
              <Label className="mb-3 block">{t?.category || 'الفئة'}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t?.allCategories || 'جميع الفئات'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t?.allCategories || 'جميع الفئات'}</SelectItem>
                  <SelectItem value="النسيج">{isRTL ? 'النسيج' : 'Textile'}</SelectItem>
                  <SelectItem value="الخزف">{isRTL ? 'الخزف' : 'Pottery'}</SelectItem>
                  <SelectItem value="النقش">{isRTL ? 'النقش' : 'Engraving'}</SelectItem>
                  <SelectItem value="الخط">{isRTL ? 'الخط العربي' : 'Calligraphy'}</SelectItem>
                  <SelectItem value="السدو">{isRTL ? 'السدو' : 'Sadu'}</SelectItem>
                  <SelectItem value="الفخار">{isRTL ? 'الفخار' : 'Ceramics'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="col-span-4">
              <Label className="mb-3 block">{t?.city || 'المدينة'}</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder={t?.allCities || 'جميع المدن'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t?.allCities || 'جميع المدن'}</SelectItem>
                  <SelectItem value="الرياض">{isRTL ? 'الرياض' : 'Riyadh'}</SelectItem>
                  <SelectItem value="جدة">{isRTL ? 'جدة' : 'Jeddah'}</SelectItem>
                  <SelectItem value="الدمام">{isRTL ? 'الدمام' : 'Dammam'}</SelectItem>
                  <SelectItem value="القصيم">{isRTL ? 'القصيم' : 'Qassim'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="col-span-4">
              <Label className="mb-3 block">
                {t?.priceRange || 'نطاق السعر'}: {priceRange[0]} - {priceRange[1]} {t?.sar || 'ريال'}
              </Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={400}
                step={18}
                className="mt-4"
              />
            </div>

            {/* Actions */}
            <div className="col-span-12 flex gap-4 pt-4">
              <Button
                onClick={() => {}}
                className="bg-[#860A33] hover:bg-[#860A33]/90 text-white"
              >
                <Filter className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t?.applyFilters || 'تطبيق التصفية'}
              </Button>
              <Button onClick={handleReset} variant="outline">
                <X className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t?.reset || 'إعادة تعيين'}
              </Button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-12 gap-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="col-span-4">
                <EventCard
                  id={event.id}
                  title={event.title}
                  category={event.category}
                  hostName={event.artisanName}
                  city={event.city}
                  durationHours={Number(event.durationHours)}
                  maxPersons={Number(event.maxPersons)}
                  pricePerPerson={Number(event.pricePerPerson)}
                  imageUrl={event.image}
                  onBook={() => onBook?.(event)}
                  language={language}
                  t={t}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-20 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl mb-4 text-[#15442f]">
                {t?.noEventsFound || 'لا توجد فعاليات حاليًّا'}
              </h3>
              <p className="text-muted-foreground mb-8">
                {t?.noEventsDescription ||
                  'لم نجد أي فعاليات تطابق معايير البحث. جرّب تعديل الفلاتر أو ارجع لاحقًا.'}
              </p>
              {userType === 'artisan' && (
                <Button
                  onClick={onAddExperience}
                  className="bg-[#860A33] hover:bg-[#860A33]/90 text-white"
                >
                  {t?.addExperience || 'أضف تجربة'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
