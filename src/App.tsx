// src/App.tsx

import { db } from "./firebase";
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { EventsPage } from "./components/EventsPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ProfilePage } from "./components/ProfilePage";
import ReservationsPage from "./components/ReservationsPage";
import { BookingPage } from "./components/BookingPage";
import { AddExperienceModal } from "./components/AddExperienceModal";
import { SimpleToaster } from "./components/SimpleToaster";
import { toast } from "sonner";
import { translations } from "./translations";
import { ForgotPassword } from "./components/ForgotPassword";
import AssistantPage from "./components/AssistantPage";

import {
  listenAuth,
  signIn,
  register as fbRegister,
  logout as fbLogout,
  getUserDoc,
  createUserDoc,
  updateUserDoc,
  type FireUserDoc,
  type AccountType,
} from "./firebase";

/* Cloudinary config */
const CLOUD_NAME = "dfxadnqle";
const UPLOAD_PRESET = "herafona_unsigned";
const CLOUD_FOLDER = "herafona/experiences";

/* Firestore collections/fields */
const EXP_COLLECTION = "experiences";
const BOOKING_COLLECTION = "booking";
const LEGACY_BOOKING_COLLECTION = "booking"; // احتياطي
const EXPERIENCE_IMAGE_FIELD = "image";
const EXPERIENCE_OWNER_FIELD = "artisanUid";

/* Helpers */
function dataURLtoBlob(dataUrl: string) {
  const [header = "", b64 = ""] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function uploadImageToCloudinary(dataUrl: string): Promise<string> {
  const blob = dataURLtoBlob(dataUrl);
  const form = new FormData();
  form.append("file", blob);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", CLOUD_FOLDER);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("فشل رفع الصورة إلى Cloudinary");
  const json = await res.json();
  return json.secure_url as string;
}

function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/* Types */
export type PageString =
  | "home"
  | "events"
  | "login"
  | "register"
  | "profile"
  | "reservations"
  | "booking"
  | "assistant"
  | "forgot";

export interface UserData {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  accountType: AccountType;
  avatarUrl?: string;
}

export interface Experience {
  id: string;
  artisanUid: string;
  artisanName: string;
  category: string;
  title: string;
  maxPersons: number;
  allowedGender: string;
  city: string;
  description: string;
  pricePerPerson: number;
  durationHours: number;
  image?: string;
}

export interface Booking {
  id: string;
  experienceId?: string;
  experienceTitle: string;
  userID: string;
  artisanID: string;
  bookingDate: any; // Firestore Timestamp
  totalPrice: number;
  numberOfPeople: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: any; // Firestore Timestamp
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

/* Mapping */
function toUserData(doc: FireUserDoc): UserData {
  return {
    uid: doc.uid || "",
    fullName: doc.fullName || "",
    email: doc.email || "",
    phoneNumber: doc.phoneNumber || "",
    city: doc.city || "",
    accountType: (doc.accountType as AccountType) || "tourist",
    avatarUrl: (doc as any).avatarUrl,
  };
}

/* App Component */
export default function App() {
  const [currentPage, setCurrentPage] = useState<PageString>("home");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    uid: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    city: "",
    accountType: "tourist",
  });

  const userType = userData.accountType;
  const userName = userData.fullName;
  const userId = userData.uid;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);

  const t = useMemo(() => translations[language] || translations.ar, [language]);

  /* Auth */
  useEffect(() => {
    const unsub = listenAuth(async (u) => {
      try {
        if (u) {
          const docData = await getUserDoc(u.uid);
          if (docData) {
            setUserData({
              uid: docData.uid || "",
              fullName: docData.fullName || "",
              email: docData.email || "",
              phoneNumber: docData.phoneNumber || "",
              city: docData.city || "",
              accountType: (docData.accountType as AccountType) || "tourist",
              avatarUrl: (docData as any).avatarUrl,
            });
            setIsLoggedIn(true);
          } else {
            const profile: FireUserDoc = {
              uid: u.uid,
              fullName: u.displayName || "",
              email: u.email || "",
              phoneNumber: "",
              city: "",
              accountType: "tourist",
            };
            await createUserDoc(profile);
            setUserData(toUserData(profile));
            setIsLoggedIn(true);
          }
        } else {
          setIsLoggedIn(false);
          setUserData({
            uid: "",
            fullName: "",
            email: "",
            phoneNumber: "",
            city: "",
            accountType: "tourist",
          });
        }
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  /* Experiences stream with fallback (orderBy -> fallback without orderBy) */
  useEffect(() => {
    // محاولة أولى مع orderBy
    const qExpOrdered = query(collection(db, EXP_COLLECTION), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qExpOrdered,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];
        setExperiences(
          data.map((x) => ({
            id: x.id,
            artisanUid: x[EXPERIENCE_OWNER_FIELD] || "",
            artisanName: x.artisanName || "",
            category: x.category || "",
            title: x.title || "",
            maxPersons: Number(x.maxPersons || 1),
            allowedGender: x.allowedGender || "any",
            city: x.city || "",
            description: x.description || "",
            pricePerPerson: Number(x.pricePerPerson || 0),
            durationHours: Number(x.durationHours || 1),
            image: x[EXPERIENCE_IMAGE_FIELD] || undefined,
          }))
        );
      },
      // فشل الفهرس -> اشتراك بديل بدون orderBy + فرز محلي
      () => {
        const unsubFallback = onSnapshot(collection(db, EXP_COLLECTION), (snap2) => {
          const data = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];
          data.sort((a, b) => (b?.createdAt?.seconds ?? 0) - (a?.createdAt?.seconds ?? 0));
          setExperiences(
            data.map((x) => ({
              id: x.id,
              artisanUid: x[EXPERIENCE_OWNER_FIELD] || "",
              artisanName: x.artisanName || "",
              category: x.category || "",
              title: x.title || "",
              maxPersons: Number(x.maxPersons || 1),
              allowedGender: x.allowedGender || "any",
              city: x.city || "",
              description: x.description || "",
              pricePerPerson: Number(x.pricePerPerson || 0),
              durationHours: Number(x.durationHours || 1),
              image: x[EXPERIENCE_IMAGE_FIELD] || undefined,
            }))
          );
        });
        // نبدّل الاشتراك بالاحتياطي
        return () => unsubFallback();
      }
    );
    return () => unsub();
  }, []);

  /* Bookings stream (role-based) — بدون orderBy + فرز محلي */
  useEffect(() => {
    if (!authReady || !userId) return;

    try {
      const base = collection(db, BOOKING_COLLECTION);
      const qBook =
        userType === "artisan"
          ? query(base, where("artisanID", "==", userId))
          : query(base, where("userID", "==", userId));

      const unsub = onSnapshot(
        qBook,
        (snap) => {
          const arr = snap.docs.map((d) => {
            const b = d.data() as any;
            const rec: Booking = {
              id: d.id,
              experienceId: b.experienceId || undefined,
              experienceTitle: b.experienceTitle || "",
              userID: b.userID || "",
              artisanID: b.artisanID || "",
              bookingDate: b.bookingDate,
              totalPrice: Number(b.totalPrice || 0),
              numberOfPeople: Number(b.numberOfPeople || 1),
              status: (b.status || "pending") as Booking["status"],
              createdAt: b.createdAt,
              userName: b.userName,
              userEmail: b.userEmail,
              userPhone: b.userPhone,
            };
            return rec;
          });

          arr.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          setBookings(arr);
        },
        (err) => {
          console.error("[bookings] snapshot error:", err);
          toast.error("تعذّر قراءة الحجوزات");
        }
      );
      return () => unsub();
    } catch (e) {
      console.error("[bookings] outer error:", e);
    }
  }, [authReady, userId, userType]);

  /* Actions */
  const handleAddExperience = async (data: any) => {
    try {
      const imageUrl = data.image ? await uploadImageToCloudinary(data.image) : undefined;

      const payload: Record<string, any> = cleanUndefined({
        [EXPERIENCE_OWNER_FIELD]: userId,
        artisanName: userName,
        category: data.category,
        title: data.title,
        maxPersons: Number(data.maxPersons ?? 1),
        allowedGender: data.allowedGender,
        city: data.city,
        description: data.description,
        pricePerPerson: Number(data.pricePerPerson ?? 0),
        durationHours: Number(data.durationHours ?? 1),
        [EXPERIENCE_IMAGE_FIELD]: imageUrl ?? null,
        createdBy: userId,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, EXP_COLLECTION), payload);
      setShowAddExperienceModal(false);
      toast.success(t.experienceAdded || "تمت إضافة التجربة بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "تعذّر حفظ التجربة");
    }
  };

  const handleBook = (experience: Experience) => {
    if (!isLoggedIn) {
      toast.error(t.pleaseLoginToBook || "سجّل الدخول لإتمام الحجز");
      setCurrentPage("login");
      return;
    }
    if (!["tourist", "user"].includes(String(userData.accountType))) {
      toast.error("الحجز متاح لحساب السائح فقط");
      return;
    }
    setSelectedExperience(experience);
    setCurrentPage("booking");
  };

  const handleBookingComplete = async (bookingData: any) => {
    if (!selectedExperience) return;

    try {
      const dateStr: string | undefined = bookingData?.date;
      const timeStr: string | undefined = bookingData?.time;

      if (!dateStr || !timeStr) {
        toast.error("الرجاء اختيار التاريخ والوقت.");
        return;
      }

      const bookingIso = `${dateStr}T${timeStr}:00`;
      const asDate = new Date(bookingIso);
      if (isNaN(asDate.getTime())) {
        toast.error("صيغة التاريخ أو الوقت غير صحيحة.");
        return;
      }

      const bookingTs = Timestamp.fromDate(asDate);

      if (!bookingTs || typeof (bookingTs as any).seconds !== "number") {
        throw new Error("Invalid booking timestamp.");
      }

      const persons = Number(bookingData.numberOfPeople ?? 1);
      const pricePerPerson = Number(selectedExperience.pricePerPerson ?? 0);
      const total =
        bookingData.totalPrice != null ? Number(bookingData.totalPrice) : pricePerPerson * persons;

      const payload = cleanUndefined({
        artisanID: selectedExperience.artisanUid || "",
        userID: userId,
        experienceId: selectedExperience.id,
        experienceTitle: selectedExperience.title,
        bookingDate: bookingTs,
        numberOfPeople: persons,
        totalPrice: Number.isFinite(total) ? total : 0,
        status: "pending" as const,
        createdAt: serverTimestamp(),
        userName: bookingData.fullName || undefined,
        userEmail: bookingData.email || undefined,
        userPhone: bookingData.phone || undefined,
      });

      await addDoc(collection(db, BOOKING_COLLECTION), payload);

      setSelectedExperience(null);
      setCurrentPage("reservations");
      toast.success(t.bookingSuccess ?? "تم إنشاء الحجز بنجاح");
    } catch (err: any) {
      console.error("[booking] write error:", err);
      const msg =
        err?.code === "permission-denied"
          ? "ليس لديك صلاحية لإتمام الحجز."
          : err?.message ?? "حدث خطأ أثناء إنشاء الحجز.";
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: "pending" | "confirmed" | "cancelled"
  ) => {
    try {
      try {
        const ref = doc(db, BOOKING_COLLECTION, bookingId);
        await updateDoc(ref, { status: newStatus });
      } catch {
        const refLegacy = doc(db, LEGACY_BOOKING_COLLECTION, bookingId);
        await updateDoc(refLegacy, { status: newStatus });
      }
      toast.success("تم تحديث الحالة بنجاح");
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  };

  const handleNavigate = (page: PageString) => setCurrentPage(page);

  const handleLogout = async () => {
    await fbLogout();
    setIsLoggedIn(false);
    setUserData({
      uid: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      city: "",
      accountType: "tourist",
    });
    setCurrentPage("home");
  };

  if (!authReady) return null;

  /* Render */
  return (
    <div className="min-h-screen flex flex-col" dir={language === "ar" ? "rtl" : "ltr"}>
      <Header
        isLoggedIn={isLoggedIn}
        userName={userName}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        language={language}
        onLanguageToggle={() => setLanguage(language === "ar" ? "en" : "ar")}
      />

      <main className="flex-1">
        {currentPage === "home" && (
          <HomePage onNavigate={handleNavigate} language={language} t={t} />
        )}

        {currentPage === "events" && (
          <EventsPage
            experiences={experiences}
            onBook={handleBook}
            userType={userType}
            onAddExperience={userType === "artisan" ? () => setShowAddExperienceModal(true) : undefined}
            language={language}
            t={t}
          />
        )}

        {currentPage === "reservations" && (
          <ReservationsPage
            userType={userType}
            userId={userId}
            experiences={experiences}
            bookings={bookings}
            onNavigate={handleNavigate}
            onAddExperience={userType === "artisan" ? () => setShowAddExperienceModal(true) : undefined}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            language={language}
            t={t}
          />
        )}

        {currentPage === "booking" && selectedExperience && (
          <BookingPage
            experience={selectedExperience}
            onNavigate={handleNavigate}
            onBook={handleBookingComplete}
            language={language}
            t={t}
          />
        )}

        {currentPage === "login" && (
          <LoginPage
            onLogin={async (email, password) => {
              const cred = await signIn(email, password);
              const userDoc = await getUserDoc(cred.user.uid);
              if (!userDoc) {
                toast.error("ملف المستخدم غير موجود. الرجاء إنشاء حساب جديد أولًا.");
                return;
              }
              setUserData({
                uid: userDoc.uid || "",
                fullName: userDoc.fullName || "",
                email: userDoc.email || "",
                phoneNumber: userDoc.phoneNumber || "",
                city: userDoc.city || "",
                accountType: (userDoc.accountType as AccountType) || "tourist",
                avatarUrl: (userDoc as any).avatarUrl,
              });
              setIsLoggedIn(true);
              setCurrentPage("home");
            }}
            onNavigateToRegister={() => setCurrentPage("register")}
            onNavigateToForgot={() => setCurrentPage("forgot")}
            language={language}
            t={t}
          />
        )}

        {currentPage === "register" && (
          <RegisterPage
            onRegister={async (data) => {
              const { user } = await fbRegister(data.email, data.password);
              const profile: FireUserDoc = {
                uid: user.uid,
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                city: data.city,
                accountType: (data.accountType as AccountType) || "tourist",
              };
              await createUserDoc(profile);
              setUserData(toUserData(profile));
              setIsLoggedIn(true);
              setCurrentPage("home");
            }}
            onNavigateToLogin={() => setCurrentPage("login")}
            language={language}
            t={t}
          />
        )}

        {currentPage === "profile" && (
          <ProfilePage
            userData={userData}
            onNavigate={handleNavigate}
            onUpdate={async (data) => {
              await updateUserDoc(userId, data);
              setUserData((prev) => ({ ...prev, ...data }));
            }}
            language={language}
            t={t}
          />
        )}

        {currentPage === "forgot" && (
          <ForgotPassword language={language} t={t} onBackToLogin={() => setCurrentPage("login")} />
        )}

        {currentPage === "assistant" && <AssistantPage />}
      </main>

      <Footer language={language} t={t} onNavigate={handleNavigate} />

      <AddExperienceModal
        isOpen={showAddExperienceModal}
        onClose={() => setShowAddExperienceModal(false)}
        onAdd={handleAddExperience}
        language={language}
        t={t}
      />

      <SimpleToaster />
    </div>
  );
}