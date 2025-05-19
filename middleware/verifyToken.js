const jwt = require('jsonwebtoken');
require('dotenv').config(); // Untuk mengambil variabel lingkungan dari file .env 
// Middleware untuk memverifikasi token JWT

function verifyToken(req, res, next) {
  // console.log(req.headers);
  
  const token = req.headers['authorization']?.split(' ')[1]; // Mengambil token dari header Authorization
  // console.log(token);
  
  if (!token) {
    return res.status(401).send({ message: 'No token provided, please log in.' });
  }

  try {
    // Verifikasi token dan dekode data di dalamnya
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    // console.log(decoded);
    
    // Menyimpan data pengguna yang terdekripsi ke dalam request
    req.user = decoded;

    next(); // Jika token valid, lanjutkan ke route berikutnya
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).send({ message: 'Invalid or expired token.' });
  }
}

module.exports = verifyToken;