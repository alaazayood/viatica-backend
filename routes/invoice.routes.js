const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const invoiceController = require('../controllers/invoice.controller');

router.use(auth.protect);

router.post('/', auth.restrictTo('warehouse','admin'), invoiceController.generateInvoice);
router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);

module.exports = router;
