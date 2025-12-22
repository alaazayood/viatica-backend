const xlsx = require('xlsx');
const csv = require('csv-parser');
const stream = require('stream');
const Drug = require('../models/Drug');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const EXPORT_HEADERS = {
  name: 'الاسم التجاري',
  genericName: 'الاسم العلمي',
  manufacturer: 'الشركة المصنعة',
  price: 'السعر',
  quantity: 'الكمية',
  category: 'التصنيف',
  expiryDate: 'تاريخ الانتهاء',
  batchNumber: 'رقم الطبخة',
  dosage: 'العيار',
  dosageForm: 'الشكل الصيدلاني',
};

exports.exportInventory = catchAsync(async (req, res, next) => {
  const warehouseId = req.user.id;
  const drugs = await Drug.find({ warehouse: warehouseId });

  // Map data to the export headers
  const data = drugs.map(drug => ({
    [EXPORT_HEADERS.name]: drug.name,
    [EXPORT_HEADERS.genericName]: drug.genericName,
    [EXPORT_HEADERS.manufacturer]: drug.manufacturer,
    [EXPORT_HEADERS.price]: drug.price,
    [EXPORT_HEADERS.quantity]: drug.quantity,
    [EXPORT_HEADERS.category]: drug.category,
    [EXPORT_HEADERS.expiryDate]: drug.expiryDate ? drug.expiryDate.toISOString().split('T')[0] : '',
    [EXPORT_HEADERS.batchNumber]: drug.batchNumber,
    [EXPORT_HEADERS.dosage]: drug.dosage,
    [EXPORT_HEADERS.dosageForm]: drug.dosageForm,
  }));

  // If no drugs, at least provide the headers as a template
  const workbook = xlsx.utils.book_new();
  let worksheet;

  if (data.length > 0) {
    worksheet = xlsx.utils.json_to_sheet(data);
  } else {
    // Just headers
    worksheet = xlsx.utils.aoa_to_sheet([Object.values(EXPORT_HEADERS)]);
  }

  xlsx.utils.book_append_sheet(workbook, worksheet, 'Inventory');

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=inventory_template.xlsx');
  
  res.status(200).send(buffer);
});

exports.uploadPreview = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const filename = req.file.originalname.toLowerCase();
  let headers = [];
  let sampleData = [];

  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length > 0) {
      headers = data[0];
      sampleData = data.slice(1, 4); // Get first 3 rows of data
    }
  } else if (filename.endsWith('.csv')) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    
    const results = [];
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('headers', (h) => {
          headers = h;
        })
        .on('data', (data) => {
          if (results.length < 3) results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // For CSV, sampleData is already objects, but let's convert to arrays to match Excel output for preview UI consistency
    sampleData = results.map(row => headers.map(h => row[h]));
  } else {
    return next(new AppError('Unsupported file format. Please upload Excel or CSV.', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      headers,
      sampleData
    }
  });
});

exports.commitImport = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded', 400));
  if (!req.body.mapping) return next(new AppError('No mapping provided', 400));

  const mapping = JSON.parse(req.body.mapping);
  const warehouseId = req.user.id;
  let rawData = [];

  const filename = req.file.originalname.toLowerCase();
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rawData = xlsx.utils.sheet_to_json(sheet);
  } else {
    // CSV logic
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    await new Promise((resolve, reject) => {
      bufferStream.pipe(csv()).on('data', (data) => rawData.push(data)).on('end', resolve).on('error', reject);
    });
  }

  // Transform rawData to Drug model format based on mapping
  const transformedData = rawData.map(row => {
    const drug = { warehouse: warehouseId };
    
    Object.keys(mapping).forEach(field => {
      const excelHeader = mapping[field];
      if (excelHeader && row[excelHeader] !== undefined) {
        // Special handling for arrays or types
        if (field === 'activeIngredients' || field === 'sideEffects') {
          drug[field] = String(row[excelHeader]).split(',').map(i => i.trim());
        } else if (field === 'expiryDate') {
          // Attempt to parse date
          drug[field] = new Date(row[excelHeader]);
        } else {
          drug[field] = row[excelHeader];
        }
      }
    });

    // Default scientific values if missing but required by model
    if (!drug.dosage) drug.dosage = 'N/A';
    
    // Ensure Category matches enum
    const validCategories = ['antibiotic', 'analgesic', 'antihistamine', 'antidepressant', 'other'];
    if (!drug.category || !validCategories.includes(drug.category.toLowerCase())) {
      drug.category = 'other';
    } else {
      drug.category = drug.category.toLowerCase();
    }

    // Ensure DosageForm matches enum
    const validForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drops', 'Other'];
    const foundForm = validForms.find(f => f.toLowerCase() === (drug.dosageForm || '').toLowerCase());
    drug.dosageForm = foundForm || 'Other';

    // Required fields defaults if mapping missed them
    if (!drug.genericName) drug.genericName = drug.name || 'N/A';
    if (!drug.batchNumber) drug.batchNumber = 'N/A';
    if (!drug.manufacturer) drug.manufacturer = 'N/A';
    if (!drug.quantity) drug.quantity = 0;
    if (!drug.price) drug.price = 0;
    if (!drug.expiryDate || isNaN(new Date(drug.expiryDate).getTime())) {
      drug.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    }

    return drug;
  });

  // Bulk Insert
  const drugs = await Drug.insertMany(transformedData, { ordered: false });

  res.status(201).json({
    status: 'success',
    message: `${drugs.length} drugs imported successfully`,
    data: { count: drugs.length }
  });
});
