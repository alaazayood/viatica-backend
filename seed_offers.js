const mongoose = require('mongoose');
require('dotenv').config();
const Offer = require('./models/Offer');

const DB = process.env.DATABASE_FULL_URL;
if (!DB) {
  console.error('DATABASE_FULL_URL is not defined in .env');
  process.exit(1);
}

mongoose.connect(DB).then(async () => {
  console.log('DB connection successful!');

  // Clear existing
  await Offer.deleteMany();

  // Create initial offers
  const initialOffers = [
    {
      title: 'بونص الشتاء ❄️',
      subtitle: 'بونص 12+3 على جميع أدوية السعال والزكام لفترة محدودة.',
      type: 'bonus',
      color: 'blue',
      endDate: new Date('2026-03-30')
    },
    {
      title: 'عرض المستودع المركزي 🏢',
      subtitle: 'خصم 7% على الطلبيات الكبيرة (أكثر من 50 قطة).',
      type: 'discount',
      color: 'purple',
      endDate: new Date('2026-01-15')
    },
    {
      title: 'مفاجأة الافتتاح! 🎉',
      subtitle: 'توصيل مجاني لجميع الصيادلة الجدد في مدينة دمشق.',
      type: 'general',
      color: 'teal',
      endDate: new Date('2026-12-31')
    }
  ];

  await Offer.create(initialOffers);
  console.log('Offers seeded successfully!');
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
