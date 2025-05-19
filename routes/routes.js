// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { getCartAll, addToCart, removeFromCart } = require('../controllers/cart');
const verifyToken = require('../middleware/verifyToken');

// Mendapatkan cart berdasarkan userId (dari token JWT)
router.get('/cart', verifyToken, getCartAll);

// Menambahkan item ke dalam cart
router.post('/cart', verifyToken, addToCart);

// Menghapus item dari cart
router.delete('/cart/:itemId', verifyToken, removeFromCart);

module.exports = router;
