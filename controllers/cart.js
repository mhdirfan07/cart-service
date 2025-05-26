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

    // Mendapatkan ID produk di dalam cart
    const productIds = cart.items.map((item) => item.id);

    // Mengambil detail produk berdasarkan ID produk
    const productDetails = await Promise.all(
      productIds.map(async (productId) => {
        const productResponse = await axios.get(
          `${PRODUCT_SERVICE_URL}${productId}`,{
            headers: {
              Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}`  // Token yang dikirim dari frontend
            }});
        return productResponse.data; // Asumsi data produk ada di `data` response
      })
    );

    // Menggabungkan data produk dengan data cart
    const cartWithProductDetails = cart.items.map((item, index) => ({
      ...item,
      productDetails: productDetails[index],
    }));

    // Mengirimkan data cart beserta detail produk
    res.status(200).json({
      userId,
      items: cartWithProductDetails,
    });
  } catch (error) {
    res.status(500).send({message: error.message});
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
