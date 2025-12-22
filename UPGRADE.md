# إرشادات الترقية من النسخة القديمة

1) **المتغيرات البيئية:**
   - انسخ `.env.example` إلى `.env` وعدّل القيم وفق بيئتك.
   - استخدم `DATABASE_FULL_URL` بدلاً من أي متغيرات قديمة مثل `DATABASE`/`DATABASE_PASSWORD`.

2) **الاعتمادات (Dependencies):**
   - شغّل: `npm install` لتثبيت الحزم الجديدة (helmet, express-rate-limit, express-mongo-sanitize, xss-clean, hpp, cookie-parser).

3) **الهجرة (Migrations):**
   - تأكد من إعادة بناء الفهارس: شغّل التطبيق مرة واحدة أو نفّذ: `db.getCollectionNames().forEach(n => db[n].reIndex())` في Mongo إن لزم.
   - تحقق من أن حقل `User.warehouse` أصبح يشير إلى `User`.
   - إذا كانت لديك بيانات حالية في `Order`, استخدم script بسيط لتعيين `status='pending'` لمن لا يحتوي حالة صالحة.

4) **النشر:**
   - اضبط CORS بوضوح (`FRONTEND_URL`, `DASHBOARD_URL`).
   - في الإنتاج: وضع `NODE_ENV=production`، تفعيل HTTPS، وتفعيل `ENABLE_AUDIT=true` فقط عند الحاجة.

5) **التوافق مع Flutter:**
   - جميع الردود تتبع الشكل `{ status, message?, data }` مع دعم تقسيم صفحي في `GET`.
   - استمر في إرسال توكن JWT في Header `Authorization: Bearer <token>` أو عبر Cookie.
