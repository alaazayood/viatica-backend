const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offer.controller');
const auth = require('../middlewares/auth');

router.get('/', auth.protect, offerController.getAllOffers);

// Restricted to warehouse/admin
router.post('/', auth.protect, auth.restrictTo('admin', 'warehouse'), offerController.createOffer);
router.delete('/:id', auth.protect, auth.restrictTo('admin', 'warehouse'), offerController.deleteOffer);

module.exports = router;
