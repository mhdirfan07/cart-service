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

async function create(userId, newItem) {
  const cartRef = db.collection('users').doc(userId).collection('cart');

  // Cek apakah sudah ada item dengan id yang sama (asumsi id di newItem.id)
  const existingItemsSnapshot = await cartRef.where('id', '==', newItem.id).get();

  if (!existingItemsSnapshot.empty) {
    // Jika item sudah ada, update quantity
    const existingDoc = existingItemsSnapshot.docs[0];
    const existingData = existingDoc.data();

    await existingDoc.ref.update({
      quantity: (existingData.quantity || 0) + (newItem.quantity || 1)
    });

    return existingDoc.id;  // Kembalikan id dokumen yang diupdate
  } else {
    // Kalau belum ada, tambah dokumen baru
    const newDocRef = await cartRef.add({
      ...newItem,
      quantity: newItem.quantity || 1
    });

    return newDocRef.id;  // Kembalikan id dokumen baru
  }
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
