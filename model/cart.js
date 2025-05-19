// model/cartModel.js
const db = require('../firebaseConfig'); // Mengimpor instance Firestore
const admin = require('firebase-admin');
// Fungsi untuk mendapatkan cart berdasarkan userId
async function getCart(userId) {
  const cartRef = db.collection('carts').doc(userId);
  const doc = await cartRef.get();
  if (!doc.exists) {
    throw new Error('Cart not found');
  }
  return doc.data();
}

// Fungsi untuk menambahkan item ke dalam cart
async function create(userId, newItem) {
  const cartRef = db.collection('carts').doc(userId);
  const cartDoc = await cartRef.get();

  let items = [];
  if (cartDoc.exists) {
    items = cartDoc.data().items || [];
  }

  // Cari item dengan id yang sama
  const existingItemIndex = items.findIndex(item => item.id === newItem.id);

  if (existingItemIndex > -1) {
    // Jika item sudah ada, tambahkan quantity-nya
    items[existingItemIndex].quantity = (items[existingItemIndex].quantity || 1) + (newItem.quantity || 1);
  } else {
    // Jika belum ada, tambahkan item baru
    items.push(newItem);
  }

  await cartRef.set({ items }, { merge: true });
}

// Fungsi untuk menghapus item dari cart
async function remove(userId, itemId) {
  const cartRef = db.collection('carts').doc(userId);

  // Mengambil cart terlebih dahulu untuk memastikan item yang ingin dihapus
  const cartDoc = await cartRef.get();
  if (!cartDoc.exists) {
    throw new Error('Cart not found');
  }

  const cart = cartDoc.data();
  
  // Cek apakah item ada dalam cart
  const itemToRemove = cart.items.find(item => item.id === itemId);
  
  if (!itemToRemove) {
    throw new Error('Item not found in cart');
  }

  // Hapus item dari array items menggunakan seluruh objek item
  await cartRef.update({
    items: admin.firestore.FieldValue.arrayRemove(itemToRemove)
  });
}

module.exports = {
  getCart,
  create,
  remove
};
