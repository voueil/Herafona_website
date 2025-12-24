// src/components/BookingPage.tsx
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ArrowRight, Calendar, MapPin, User, Mail, Users, CheckCircle2 } from "lucide-react";
import type { Experience } from "../App";

interface BookingPageProps {
  experience: Experience;
  onNavigate?: (page: "home" | "events" | "reservations" | "profile") => void;
  onBook?: (bookingData: any) => void | Promise<void>;
  language?: "ar" | "en";
  t?: any;
}

export function BookingPage({
  experience,
  onNavigate,
  onBook,
  language = "ar",
  t,
}: BookingPageProps) {
  const isRTL = language === "ar";
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    personsCount: "1",
    date: "",
    time: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pricePerPersonNum = Number(experience.pricePerPerson) || 0;
  const persons = Math.max(1, parseInt(formData.personsCount || "1", 10) || 1);
  const totalPrice = pricePerPersonNum * persons;

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError(null);

    const newErrors: Record<string, string> = {};
    const txt = (k: string, def: string) => (t?.[k] as string) || def;

    if (!formData.fullName.trim()) newErrors.fullName = txt("nameRequired", "الاسم الكامل مطلوب");
    if (!formData.email.trim()) newErrors.email = txt("emailRequired", "البريد الإلكتروني مطلوب");
    else if (!validateEmail(formData.email)) newErrors.email = txt("emailInvalid", "رجاءً أدخل بريدًا إلكترونيًّا بصيغة صحيحة");
    if (!formData.personsCount || persons < 1) newErrors.personsCount = txt("personsRequired", "عدد الأشخاص مطلوب");
    if (!formData.date) newErrors.date = txt("dateRequired", "التاريخ مطلوب");
    if (!formData.time) newErrors.time = txt("timeRequired", "الوقت مطلوب");

    // التحقق من الحد الأقصى للأشخاص (إن وُجد)
    if (experience?.maxPersons && persons > Number(experience.maxPersons)) {
      newErrors.personsCount = txt("exceedsMaxPersons", `الحد الأقصى للحجز هو ${experience.maxPersons} أشخاص`);
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);
      await onBook?.({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        numberOfPeople: persons,
        totalPrice: Number.isFinite(totalPrice) ? totalPrice : 0,
        // ملاحظة: لا نرسل bookingDate هنا — App.tsx سيبني Timestamp من date + time
        date: formData.date,
        time: formData.time,
      });
      // نجاح فعلي من App.tsx -> افتحي المودال
      setShowSuccessModal(true);
    } catch (err: any) {
      const msg =
        err?.message ||
        (isRTL ? "تعذّر إنشاء الحجز. يُرجى المحاولة لاحقًا." : "Failed to create booking. Please try again.");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // منع اختيار تواريخ ماضية
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  return (
    <>
      <div className="w-full min-h-[calc(100vh-5rem)] py-16" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto max-w-[1200px] px-8">
          <button
            onClick={() => onNavigate?.("events")}
            className="flex items-center gap-2 text-[#3F2A22] hover:underline mb-8"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : null}
            {isRTL ? "العودة لصفحة الفعاليات" : "Back to Events"}
            {!isRTL ? <ArrowRight className="h-4 w-4 rotate-180" /> : null}
          </button>

          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 md:col-span-5">
              <div className="bg-white rounded-xl border shadow-lg overflow-hidden md:sticky md:top-24">
                <div className="relative h-64">
                  <ImageWithFallback
                    src={
                      experience.image ||
                      "https://images.unsplash.com/photo-1593671186131-d58817e7dee0?w=800"
                    }
                    alt={experience.title}
                    className="h-full w-full object-cover"
                  />
                  <Badge
                    className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} bg-accent hover:bg-accent text-white`}
                  >
                    {experience.category}
                  </Badge>
                </div>

                <div className="p-8">
                  <h2 className="text-2xl mb-6 text-[#15442f]">{experience.title}</h2>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{experience.artisanName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{experience.city}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl text-[#15442f]">{pricePerPersonNum}</span>
                      <span className="text-muted-foreground">{isRTL ? "ريال للشخص" : "SAR per person"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-7">
              <div className="bg-white rounded-xl border shadow-lg p-10">
                <h1 className="text-3xl mb-3 text-[#15442f]">{t?.completeBooking || "إتمام الحجز"}</h1>
                <p className="text-muted-foreground mb-10">{t?.fillBookingData || "املأ البيانات التالية لتأكيد حجزك"}</p>

                {/* رسالة خطأ عامة عند فشل onBook */}
                {submitError && (
                  <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div>
                    <Label htmlFor="fullName" className="mb-3 block">الاسم الكامل</Label>
                    <div className="relative">
                      <User className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                      <Input
                        id="fullName"
                        placeholder="أدخل اسمك الكامل"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={`${isRTL ? "pr-10" : "pl-10"} ${errors.fullName ? "border-destructive" : ""}`}
                        autoComplete="name"
                      />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive mt-2">{errors.fullName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email" className="mb-3 block">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`${isRTL ? "pr-10" : "pl-10"} ${errors.email ? "border-destructive" : ""}`}
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive mt-2">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="personsCount" className="mb-3 block">عدد الأشخاص</Label>
                    <div className="relative">
                      <Users className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                      <Input
                        id="personsCount"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={formData.personsCount}
                        onChange={(e) => setFormData({ ...formData, personsCount: e.target.value })}
                        className={`${isRTL ? "pr-10" : "pl-10"} ${errors.personsCount ? "border-destructive" : ""}`}
                        inputMode="numeric"
                      />
                    </div>
                    {errors.personsCount && <p className="text-sm text-destructive mt-2">{errors.personsCount}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="date" className="mb-3 block">التاريخ</Label>
                      <div className="relative">
                        <Calendar className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className={`${isRTL ? "pr-10" : "pl-10"} ${errors.date ? "border-destructive" : ""}`}
                          min={minDate}
                        />
                      </div>
                      {errors.date && <p className="text-sm text-destructive mt-2">{errors.date}</p>}
                    </div>

                    <div>
                      <Label htmlFor="time" className="mb-3 block">الوقت</Label>
                      <Input
                        id="time"
                        type="time"
                        step="60"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className={errors.time ? "border-destructive" : ""}
                      />
                      {errors.time && <p className="text-sm text-destructive mt-2">{errors.time}</p>}
                    </div>
                  </div>

                  <div className="bg-[#FCFBF5] rounded-lg p-8 space-y-4">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{isRTL ? "السعر للشخص ×" : "Price per person ×"} {persons}</span>
                      <span>{pricePerPersonNum} × {persons}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-lg">{isRTL ? "السعر الإجمالي" : "Total price"}</span>
                      <span className="text-2xl text-[#15442f]">{totalPrice} {isRTL ? "ريال" : "SAR"}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#860A33] hover:bg-[#860A33]/90 text-white"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (isRTL ? "جارٍ الحجز..." : "Booking...") : (isRTL ? "احجز الآن" : "Book Now")}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl text-[#15442f]">
              {isRTL ? "تم الحجز بنجاح" : "Booking Confirmed"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isRTL ? "تم إرسال تفاصيل الحجز إلى بريدك الإلكتروني" : "Booking details were sent to your email"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                onNavigate?.("home");
              }}
              className="flex-1 bg-[#860A33] hover:bg-[#860A33]/90 text-white"
            >
              {isRTL ? "الصفحة الرئيسية" : "Home"}
            </Button>
            <Button onClick={() => setShowSuccessModal(false)} variant="outline" className="flex-1">
              {isRTL ? "إغلاق" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
