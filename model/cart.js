// model/cartModel.js
const db = require('../firebaseConfig');
const admin = require('firebase-admin');

// Helper: Ambil referensi ke collection carts milik user
const getCartsCollection = (userId) => {
  return db.collection('users').doc(userId).collection('carts');
};

// 1. GET CART (Mengembalikan data + cartId untuk dipakai di Order)
async function getCart(userId) {
  const cartsRef = getCartsCollection(userId);
  
  // Ambil cart yang ada (asumsi 1 user 1 cart aktif)
  const snapshot = await cartsRef.limit(1).get();

  if (snapshot.empty) {
    return { userId, items: [] }; 
  }
  
  const doc = snapshot.docs[0];
  
  // Return data LENGKAP dengan cartId (nama dokumennya)
  // Ini yang nanti dipakai saat ORDER
  return { 
    cartId: doc.id, 
    ...doc.data() 
  };
}

// 2. CREATE / ADD TO CART
async function create(userId, newItem) {
  const cartsRef = getCartsCollection(userId);
  
  // Cek apakah user sudah punya cart?
  const snapshot = await cartsRef.limit(1).get();
  
  let cartDocRef;
  let items = [];

  if (!snapshot.empty) {
    // === KASUS A: Cart Sudah Ada ===
    // Kita pakai Cart ID (nama dokumen) yang sudah ada
    const doc = snapshot.docs[0];
    cartDocRef = doc.ref; // Referensi ke dokumen lama (misal ID: "xYz123")
    items = doc.data().items || [];
  } else {
    // === KASUS B: Cart Belum Ada ===
    // Kita minta Firestore buatkan ID baru yang unik untuk nama dokumennya
    cartDocRef = cartsRef.doc(); // Ini membuat referensi baru dengan ID acak
    items = [];
  }

  // --- Logika Update Item (Sama seperti sebelumnya) ---
  const existingItemIndex = items.findIndex(item => item.id === newItem.id);

  if (existingItemIndex > -1) {
    items[existingItemIndex].quantity = 
      (items[existingItemIndex].quantity || 0) + (newItem.quantity || 1);
  } else {
    items.push({
      ...newItem,
      quantity: newItem.quantity || 1
    });
  }

  // Simpan ke dokumen tersebut (Entah itu dokumen lama atau baru)
  await cartDocRef.set({ 
    items, 
    updatedAt: new Date(),
    // status: 'active' // Opsional: jika nanti mau filter cart history
  }, { merge: true });

  // PENTING: Kembalikan ID Dokumen (Cart ID) agar bisa dipakai Controller/Frontend
  return cartDocRef.id;
}

// 3. REMOVE ITEM
async function remove(userId, itemId) {
  const cartsRef = getCartsCollection(userId);
  const snapshot = await cartsRef.limit(1).get();

  if (snapshot.empty) {
    throw new Error('Cart not found');
  }

  const doc = snapshot.docs[0];
  const cartData = doc.data();
  
  const itemToRemove = cartData.items.find(item => item.id === itemId);

  if (!itemToRemove) {
    throw new Error('Item not found in cart');
  }

  // Hapus item dari dokumen tersebut
  await doc.ref.update({
    items: admin.firestore.FieldValue.arrayRemove(itemToRemove)
  });
  
  return doc.id; // Return cartId
}

module.exports = {
  getCart,
  create,
  remove
};