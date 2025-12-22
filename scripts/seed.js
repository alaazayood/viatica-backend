const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const path = require('path');
const base = path.resolve(__dirname, '..');
const User = require(path.join(base, 'models', 'User'));
const Drug = require(path.join(base, 'models', 'Drug'));
const Order = require(path.join(base, 'models', 'Order'));

const DB = process.env.DATABASE_FULL_URL;

async function main() {
  try {
    if (!DB) {
      console.error('No DATABASE connection string in .env (DATABASE). Aborting.');
      process.exit(1);
    }
    await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Drug.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑 Cleared users, drugs, orders');

    const warehouse = await User.create({
      name: 'Warehouse Test',
      email: 'warehouse@test.com',
      password: 'warehouse123',
      role: 'warehouse',
      phone: '0912345678',
      isVerified: true
    });

    const pharmacist = await User.create({
      name: 'Pharmacy Test',
      email: 'pharmacy@test.com',
      password: 'pharmacy123',
      role: 'pharmacist',
      phone: '0912345679',
      isVerified: false
    });

    const driver = await User.create({
      name: 'Driver Test',
      email: 'driver@test.com',
      password: 'driver123',
      role: 'driver',
      phone: '0912345680',
      isVerified: false,
      warehouse: warehouse._id
    });

    const admin = await User.create({
      name: 'Admin Test',
      email: 'admin@viatica.com',
      password: 'admin123',
      role: 'admin',
      phone: '0912345681',
      isVerified: true
    });

    const drugsData = [
      {
        name: 'باراسيتامول 500',
        genericName: 'Paracetamol',
        manufacturer: 'الشركة الطبية',
        price: 5000,
        quantity: 100,
        category: 'analgesic',
        batchNumber: 'BATCH-001',
        expiryDate: new Date('2026-12-31'),
        warehouse: warehouse._id,
        dosage: '500mg',
        dosageForm: 'Tablet',
        activeIngredients: ['Paracetamol'],
        indications: 'Relief of mild to moderate pain and fever.',
        sideEffects: ['Nausea', 'Skin rash']
      },
      {
        name: 'أوغمنتين 1000',
        genericName: 'Amoxicillin + Clavulanic Acid',
        manufacturer: 'GSK',
        price: 45000,
        quantity: 50,
        category: 'antibiotic',
        batchNumber: 'BATCH-002',
        expiryDate: new Date('2025-06-30'),
        warehouse: warehouse._id,
        dosage: '1000mg',
        dosageForm: 'Tablet',
        activeIngredients: ['Amoxicillin', 'Clavulanic Acid'],
        indications: 'Bacterial infections including respiratory tract infections.',
        sideEffects: ['Diarrhea', 'Oral thrush']
      },
      {
        name: 'بانادول نايت',
        genericName: 'Paracetamol + Diphenhydramine',
        manufacturer: 'GSK',
        price: 12000,
        quantity: 200,
        category: 'analgesic',
        batchNumber: 'BATCH-003',
        expiryDate: new Date('2027-01-01'),
        warehouse: warehouse._id,
        dosage: '525mg',
        dosageForm: 'Tablet',
        activeIngredients: ['Paracetamol', 'Diphenhydramine'],
        indications: 'Short-term treatment of occasional sleeplessness associated with pain.',
        sideEffects: ['Drowsiness', 'Dry mouth']
      },
      {
        name: 'فينادون',
        genericName: 'Dexamethasone + Chlorpheniramine',
        manufacturer: 'العربية للأدوية',
        price: 8500,
        quantity: 75,
        category: 'antihistamine',
        batchNumber: 'BATCH-004',
        expiryDate: new Date('2025-12-12'),
        warehouse: warehouse._id,
        dosage: '0.5mg/2mg',
        dosageForm: 'Syrup',
        activeIngredients: ['Dexamethasone', 'Chlorpheniramine'],
        indications: 'Allergic conditions and inflammation.',
        sideEffects: ['Increased appetite', 'Restlessness']
      },
      {
        name: 'بروفين 600',
        genericName: 'Ibuprofen',
        manufacturer: 'Abbott',
        price: 7000,
        quantity: 150,
        category: 'analgesic',
        batchNumber: 'BATCH-005',
        expiryDate: new Date('2026-05-20'),
        warehouse: warehouse._id,
        dosage: '600mg',
        dosageForm: 'Tablet',
        activeIngredients: ['Ibuprofen'],
        indications: 'Rheumatoid arthritis, osteoarthritis, and pain relief.',
        sideEffects: ['Stomach pain', 'Heartburn']
      },
      {
        name: 'فيتامين سي 1000',
        genericName: 'Ascorbic Acid',
        manufacturer: 'Health Life',
        price: 15000,
        quantity: 300,
        category: 'other',
        batchNumber: 'BATCH-006',
        expiryDate: new Date('2025-08-15'),
        warehouse: warehouse._id,
        dosage: '1000mg',
        dosageForm: 'Tablet',
        activeIngredients: ['Ascorbic Acid'],
        indications: 'Prevention and treatment of Vitamin C deficiency.',
        sideEffects: ['Stomach cramps', 'Diarrhea']
      }
    ];

    const drugs = await Drug.insertMany(drugsData);

    console.log('🎯 Seed complete:', {
      warehouse: warehouse._id.toString(),
      pharmacist: pharmacist._id.toString(),
      driver: driver._id.toString(),
      admin: admin._id.toString(),
      drugsCount: drugs.length
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:');
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
