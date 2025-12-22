const express = require('express');
const multer = require('multer');
const importController = require('../controllers/import.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Use memory storage for fast processing since we don't need to persist the file on disk
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes here require authentication
router.use(authController.protect);

router.get(
  '/export',
  authController.restrictTo('warehouse', 'admin'),
  importController.exportInventory
);

router.post(
  '/preview',
  authController.restrictTo('warehouse', 'admin'),
  upload.single('file'),
  importController.uploadPreview
);

router.post(
  '/commit',
  authController.restrictTo('warehouse', 'admin'),
  upload.single('file'),
  importController.commitImport
);

module.exports = router;
