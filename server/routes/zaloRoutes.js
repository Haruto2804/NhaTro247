const express = require('express');
const router = express.Router();
const zaloController = require('../controllers/zaloController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/status', zaloController.getStatus);
router.post('/qr/start', zaloController.startQr);
router.get('/qr/status', zaloController.getQrStatus);
router.post('/disconnect', zaloController.disconnect);

module.exports = router;
