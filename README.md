# WATCH ME 🎌
تطبيق مشاهدة أنمي جماعي مع مزامنة ودردشة ورسائل صوتية

---

## هيكل المشروع
```
watchme/
├── server/        ← السيرفر (Node.js + Socket.io)
└── app/           ← التطبيق (React Native + Expo)
```

---

## تشغيل السيرفر

```bash
cd server
npm install
npm start
```

السيرفر يعمل على: http://localhost:3001

---

## تشغيل التطبيق

```bash
cd app
npm install
npx expo start
```

ثم:
- اضغط `a` لفتح محاكي Android
- اضغط `i` لفتح محاكي iOS (Mac فقط)
- اسكن QR Code بتطبيق Expo Go على جهازك

---

## المتطلبات
- Node.js 18+
- npm أو yarn
- Expo CLI: `npm install -g expo-cli`
- للموبايل الحقيقي: تطبيق Expo Go من App Store / Play Store

---

## الميزات
- [x] غرف مشتركة بكود عشوائي
- [x] مزامنة play / pause / seek لحظية
- [x] دردشة نصية حية
- [x] رسائل صوتية (تسجيل وإرسال)
- [x] ردود فعل (إيموجي طائرة)
- [x] تشغيل روابط mp4 و m3u8 مباشرة
- [x] مؤشر Host للتحكم الرئيسي

---

## تغيير عنوان السيرفر
في الملف `app/src/hooks/useSocket.js`:
```js
const SERVER_URL = 'http://YOUR_SERVER_IP:3001';
```

للنشر على الإنترنت استخدم Railway أو Render (مجاني).

---

## الخطوات القادمة
- إضافة دعم yt-dlp لاستخراج روابط المواقع
- نظام حسابات وتسجيل دخول
- قائمة الغرف العامة
- ترجمة تلقائية للأنمي
