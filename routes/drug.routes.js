const express = require('express');
const router = express.Router();
const drugController = require('../controllers/drug.controller');
const auth = require('../middlewares/auth');

router.get('/', auth.protect, drugController.getAllDrugs);
router.post('/', 
  auth.protect, 
  auth.restrictTo('warehouse', 'admin'), 
  drugController.createDrug
);

// النقاط التالية تحتاج دوالها في المتحكم (سنصلحها لاحقاً)
router.get('/:id', auth.protect, drugController.getDrugById);
router.put('/:id', 
  auth.protect, 
  auth.restrictTo('warehouse', 'admin'), 
  drugController.updateDrug
);
router.delete('/:id', 
  auth.protect, 
  auth.restrictTo('warehouse', 'admin'), 
  drugController.deleteDrug
);

module.exports = router;