// src/components/AddExperienceModal.tsx
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { X, Save, Upload } from 'lucide-react';

import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ar' | 'en';
  t?: ((key: string) => string | undefined) | Record<string, string>;
  onAdd?: (data: any) => void | Promise<void>;  // ⬅️ أضفنا هذا السطر
}


interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ar' | 'en';
  t?: ((key: string) => string | undefined) | Record<string, string>;
}

type NumOrEmpty = number | '';

interface FormDataState {
  category: string;
  title: string;
  maxPersons: NumOrEmpty;
  allowedGender: string;
  city: string;
  description: string;
  pricePerPerson: NumOrEmpty;
  durationHours: NumOrEmpty;
  image: string; 
}

/* -------- Cloudinary helpers -------- */
function cleanEnv(v: unknown): string {
  return String(v ?? '')
    .trim()
    .replace(/^[\'\"\u200E\u200F]+|[\'\"\u200E\u200F]+$/g, '')
    .replace(/\r?\n/g, '');
}

async function uploadToCloudinary(file: File) {
  const cloudName = cleanEnv(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
  const uploadPreset = cleanEnv(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  const folder = cleanEnv(import.meta.env.VITE_CLOUDINARY_FOLDER || 'herafona');

  const ascii = /^[A-Za-z0-9_-]+$/;
  if (!cloudName || !uploadPreset || !ascii.test(cloudName) || !ascii.test(uploadPreset)) {
    throw new Error('Cloudinary config invalid: check cloud name/preset (ASCII only, no spaces).');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset); // UNSIGNED
  if (folder) form.append('folder', folder);

  const res = await fetch(url, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) {
    console.error('Cloudinary error payload:', data);
    throw new Error(data?.error?.message || 'Cloudinary upload failed');
  }
  return { url: data.secure_url as string, publicId: data.public_id as string };
}

export  function AddExperienceModal({
  isOpen,
  onClose,
  language = 'ar',
  t,
  onAdd,
}: AddExperienceModalProps) {
  const isRTL = language === 'ar';
  const TT = (key: string, ar: string, en: string) => {
    if (typeof t === 'function') return t(key) ?? (isRTL ? ar : en);
    if (t && typeof t === 'object' && key in t) {
      const val = (t as Record<string, string>)[key];
      if (val) return val;
    }
    return isRTL ? ar : en;
  };

  const [formData, setFormData] = useState<FormDataState>({
    category: '',
    title: '',
    maxPersons: '',
    allowedGender: '',
    city: '',
    description: '',
    pricePerPerson: '',
    durationHours: '',
    image: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const setNum = (field: keyof FormDataState) => (v: string) => {
    const num = v === '' ? '' : Number(v);
    setFormData((prev) => ({ ...prev, [field]: isNaN(num as number) ? '' : num }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);

    // معاينة محلية
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const up = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, image: up.url }));
    } catch (err: any) {
      setUploadError(isRTL ? 'تعذّر رفع الصورة' : 'Image upload failed');
      setFormData((prev) => ({ ...prev, image: '' }));
      console.warn('[Cloudinary]', err?.message || err);
    } finally {
      setUploading(false);
    }
  };

  // حفظ مباشر في Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.category)
      newErrors.category = TT('errors.category', 'الفئة مطلوبة', 'Category is required');
    if (!formData.title)
      newErrors.title = TT('errors.title', 'اسم التجربة مطلوب', 'Title is required');
    if (formData.maxPersons === '' || Number(formData.maxPersons) <= 0)
      newErrors.maxPersons = TT('errors.maxPersons', 'العدد الأقصى مطلوب', 'Max persons is required');
    if (!formData.allowedGender)
      newErrors.allowedGender = TT('errors.allowedGender', 'الفئة المسموح لها مطلوبة', 'Allowed gender is required');
    if (!formData.city)
      newErrors.city = TT('errors.city', 'المدينة مطلوبة', 'City is required');
    if (!formData.description)
      newErrors.description = TT('errors.description', 'الوصف مطلوب', 'Description is required');
    if (formData.pricePerPerson === '' || Number(formData.pricePerPerson) <= 0)
      newErrors.pricePerPerson = TT('errors.pricePerPerson', 'السعر مطلوب', 'Price is required');
    if (formData.durationHours === '' || Number(formData.durationHours) <= 0)
      newErrors.durationHours = TT('errors.durationHours', 'عدد الساعات مطلوب', 'Duration is required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (uploading) {
      setErrors({
        image: TT('errors.uploading', 'انتظار رفع الصورة...', 'Please wait for image upload...'),
      });
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const uid = auth?.currentUser?.uid || 'anonymous';
      const docData = {
        category: formData.category,
        title: formData.title,
        maxPersons: Number(formData.maxPersons),
        allowedGender: formData.allowedGender,
        city: formData.city,
        description: formData.description,
        pricePerPerson: Number(formData.pricePerPerson),
        durationHours: Number(formData.durationHours),
        image: formData.image || '', // اختياري
        createdBy: uid,
        createdAt: serverTimestamp(),
        status: 'active', // حقل مفيد لاحقًا
      };

      await addDoc(collection(db, 'experiences'), docData);

      setFormData({
        category: '',
        title: '',
        maxPersons: '',
        allowedGender: '',
        city: '',
        description: '',
        pricePerPerson: '',
        durationHours: '',
        image: '',
      });
      setImagePreview('');
      onClose();
      alert(isRTL ? 'تمت إضافة التجربة بنجاح' : 'Experience added successfully');
    } catch (err: any) {
      console.error('Add experience failed:', err);
      alert(
        (isRTL ? 'خطأ أثناء إضافة التجربة: ' : 'Failed to add experience: ') +
          (err?.message || err)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#15442f]">
            {TT('title', 'إضافة تجربة جديدة', 'Add New Experience')}
          </DialogTitle>
          <DialogDescription>
            {TT('subtitle', 'أضف تفاصيل التجربة الحرفية التي تقدمها', 'Add details of the artisan experience you provide')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* الفئة */}
            <div>
              <Label htmlFor="category" className="mb-3 block">
                {TT('category.label', 'فئة التجربة', 'Category')}
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: string) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder={TT('category.placeholder', 'اختر الفئة', 'Select a category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="النسيج">{TT('category.weaving', 'النسيج', 'Weaving')}</SelectItem>
                  <SelectItem value="الخزف">{TT('category.ceramics', 'الخزف', 'Ceramics')}</SelectItem>
                  <SelectItem value="النقش">{TT('category.engraving', 'النقش', 'Engraving')}</SelectItem>
                  <SelectItem value="الخط">{TT('category.calligraphy', 'الخط العربي', 'Arabic Calligraphy')}</SelectItem>
                  <SelectItem value="السدو">{TT('category.sadu', 'السدو', 'Sadu')}</SelectItem>
                  <SelectItem value="الفخار">{TT('category.pottery', 'الفخار', 'Pottery')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive mt-2">{errors.category}</p>}
            </div>

            {/* العنوان */}
            <div>
              <Label htmlFor="title" className="mb-3 block">
                {TT('title.label', 'اسم التجربة', 'Experience Title')}
              </Label>
              <Input
                id="title"
                placeholder={TT('title.placeholder', 'مثال: أساسيات السدو', 'e.g. Sadu Basics')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-sm text-destructive mt-2">{errors.title}</p>}
            </div>

            {/* العدد الأقصى */}
            <div>
              <Label htmlFor="maxPersons" className="mb-3 block">
                {TT('maxPersons.label', 'العدد الأقصى للأشخاص', 'Max persons')}
              </Label>
              <Input
                id="maxPersons"
                type="number"
                inputMode="numeric"
                placeholder={TT('maxPersons.placeholder', 'مثال: 15', 'e.g. 15')}
                value={formData.maxPersons === '' ? '' : String(formData.maxPersons)}
                onChange={(e) => setNum('maxPersons')(e.target.value)}
                className={errors.maxPersons ? 'border-destructive' : ''}
              />
              {errors.maxPersons && <p className="text-sm text-destructive mt-2">{errors.maxPersons}</p>}
            </div>

            {/* المدة بالساعات */}
            <div>
              <Label htmlFor="durationHours" className="mb-3 block">
                {TT('duration.label', 'عدد الساعات', 'Duration (hours)')}
              </Label>
              <Input
                id="durationHours"
                type="number"
                step="0.5"
                inputMode="decimal"
                placeholder={TT('duration.placeholder', 'مثال: 3', 'e.g. 3')}
                value={formData.durationHours === '' ? '' : String(formData.durationHours)}
                onChange={(e) => setNum('durationHours')(e.target.value)}
                className={errors.durationHours ? 'border-destructive' : ''}
              />
              {errors.durationHours && <p className="text-sm text-destructive mt-2">{errors.durationHours}</p>}
            </div>

            {/* الفئة المسموح لها */}
            <div>
              <Label htmlFor="allowedGender" className="mb-3 block">
                {TT('allowedGender.label', 'الفئة المسموح لها بالحضور', 'Allowed audience')}
              </Label>
              <Select
                value={formData.allowedGender}
                onValueChange={(value: string) => setFormData({ ...formData, allowedGender: value })}
              >
                <SelectTrigger className={errors.allowedGender ? 'border-destructive' : ''}>
                  <SelectValue placeholder={TT('allowedGender.placeholder', 'اختر الفئة', 'Select audience')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{TT('allowedGender.all', 'الجميع', 'All')}</SelectItem>
                  <SelectItem value="male">{TT('allowedGender.male', 'ذكور', 'Male')}</SelectItem>
                  <SelectItem value="female">{TT('allowedGender.female', 'إناث', 'Female')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.allowedGender && <p className="text-sm text-destructive mt-2">{errors.allowedGender}</p>}
            </div>

            {/* المدينة */}
            <div>
              <Label htmlFor="city" className="mb-3 block">
                {TT('city.label', 'المدينة', 'City')}
              </Label>
              <Select
                value={formData.city}
                onValueChange={(value: string) => setFormData({ ...formData, city: value })}
              >
                <SelectTrigger className={errors.city ? 'border-destructive' : ''}>
                  <SelectValue placeholder={TT('city.placeholder', 'اختر المدينة', 'Select city')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الرياض">{TT('city.riyadh', 'الرياض', 'Riyadh')}</SelectItem>
                  <SelectItem value="جدة">{TT('city.jeddah', 'جدة', 'Jeddah')}</SelectItem>
                  <SelectItem value="الدمام">{TT('city.dammam', 'الدمام', 'Dammam')}</SelectItem>
                  <SelectItem value="القصيم">{TT('city.qassim', 'القصيم', 'Al-Qassim')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.city && <p className="text-sm text-destructive mt-2">{errors.city}</p>}
            </div>

            {/* السعر للشخص */}
            <div className="col-span-2">
              <Label htmlFor="pricePerPerson" className="mb-3 block">
                {TT('price.label', 'السعر للشخص (ريال)', 'Price per person (SAR)')}
              </Label>
              <Input
                id="pricePerPerson"
                type="number"
                step="1"
                inputMode="decimal"
                placeholder={TT('price.placeholder', 'مثال: 90', 'e.g. 90')}
                value={formData.pricePerPerson === '' ? '' : String(formData.pricePerPerson)}
                onChange={(e) => setNum('pricePerPerson')(e.target.value)}
                className={errors.pricePerPerson ? 'border-destructive' : ''}
              />
              {errors.pricePerPerson && <p className="text-sm text-destructive mt-2">{errors.pricePerPerson}</p>}
            </div>

            {/* الوصف */}
            <div className="col-span-2">
              <Label htmlFor="description" className="mb-3 block">
                {TT('description.label', 'وصف التجربة', 'Experience Description')}
              </Label>
              <Textarea
                id="description"
                rows={4}
                placeholder={TT(
                  'description.placeholder',
                  'اكتب وصفًا موجزًا للتجربة ومحتواها والفئة المستهدفة…',
                  'Write a short description of the experience, content, and target audience…'
                )}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && <p className="text-sm text-destructive mt-2">{errors.description}</p>}
            </div>
          </div>

          {/* صورة التجربة */}
          <div>
            <Label htmlFor="image" className="mb-3 block">
              {TT('image.label', 'صورة التجربة', 'Experience Image')}
            </Label>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-dashed border-border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setFormData({ ...formData, image: '' });
                    }}
                    className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-destructive text-white p-2 rounded-full hover:bg-destructive/90`}
                    disabled={uploading || saving}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">
                        {TT('image.cta', 'اضغط لرفع الصورة', 'Click to upload')}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {TT('image.types', 'PNG, JPG أو JPEG', 'PNG, JPG or JPEG')}
                    </p>
                  </div>
                  <input id="image" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}

              {uploading && <p className="text-sm text-muted-foreground">{isRTL ? 'جاري رفع الصورة...' : 'Uploading image...'}</p>}
              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
              {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
              {formData.image && !uploading && (
                <p className="text-xs text-green-600">
                  {isRTL ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully'}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={uploading || saving}
              className="flex-1 bg-[#860A33] hover:bg-[#860A33]/90 text-white"
            >
              <Save className="ml-2 h-4 w-4" />
              {saving ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...') : TT('actions.add', 'إضافة', 'Add')}
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="flex-1" disabled={uploading || saving}>
              <X className="ml-2 h-4 w-4" />
              {TT('actions.cancel', 'إلغاء', 'Cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default AddExperienceModal;

