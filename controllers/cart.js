// controllers/cartController.js
const axios = require("axios");
const { getCart, create , remove } = require("../model/cart");
require('dotenv').config();
// URL endpoint product-service (misalnya)
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

async function getCartAll(req, res) {
  try {
    const userId = req.user.userId;
    const cart = await getCart(userId);

    // 1. CEK: Jika cart tidak ditemukan atau items kosong, langsung return array kosong
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(200).json({
        userId,
        items: [],
      });
    }

    // Mendapatkan ID produk di dalam cart
    const productIds = cart.items.map((item) => item.id);

    // 2. CEK: Pastikan Token Ada (Optional, tergantung logic auth kamu)
    const token = req.headers['authorization']?.split(' ')[1] || '';

    // Mengambil detail produk
    const productDetails = await Promise.all(
      productIds.map(async (productId) => {
        try {
          // Pastikan URL valid (tambahkan slash jika perlu di logic env atau disini)
          // Gunakan try/catch per request agar 1 produk error tidak bikin crash semua
          const productResponse = await axios.get(
            `${PRODUCT_SERVICE_URL}${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return productResponse.data;
        } catch (err) {
          console.error(`Gagal ambil produk ID ${productId}:`, err.message);
          // Jika gagal ambil detail produk, kembalikan null atau object default
          return null; 
        }
      })
    );

    // Menggabungkan data produk dengan data cart
    const cartWithProductDetails = cart.items.map((item, index) => {
      // Jika productDetails[index] null (karena error diatas), gunakan fallback data
      const details = productDetails[index];
      return {
        ...item,
        // Jika detail produk gagal diambil, pakai nama/harga dari cart (jika ada) atau info "Product Unavailable"
        productDetails: details || { name: "Product Unavailable", price: item.price } 
      };
    });

    res.status(200).json({
      userId,
      items: cartWithProductDetails,
    });

  } catch (error) {
    // 3. DEBUG: Console log error aslinya agar kelihatan di terminal
    console.error("ERROR getCartAll:", error); 
    res.status(500).send({ message: error.message });
  }
}

// Endpoint untuk menambahkan item ke dalam cart
async function addToCart(req, res) {
  try {
    const userId = req.user.userId;
    const itemId = req.body.productId;

    const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}${itemId}`, {
      headers: {
        Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`
      }
    });
    const product = productResponse.data;

    if (!product) {
      return res.status(404).send('Product not found');
    }

    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: req.body.quantity || 1,
    };

    const cartId = await create(userId, item); // tangkap cartID dari create

    res.status(200).json({
      message: 'Item added to cart',
      cartId  // kirim cartID ke client
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function removeFromCart(req, res) {
  console.log(req.params);
  
  try {
    const userId = req.user.userId;
    const itemId = req.params.itemId; // ID produk yang ingin dihapus

    // Menghapus produk dari cart berdasarkan itemId
    await remove(userId, itemId);
    res.status(200).send('Item removed from cart');
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = { getCartAll , addToCart, removeFromCart };
