const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

router.post('/google', authController.loginWithGoogle);
router.get('/me', authMiddleware, authController.getMe);
router.put('/banking', authMiddleware, authController.updateBanking);

module.exports = router;
