# Menggunakan image Node.js slim versi 20.14 sebagai base image
FROM node:22.15-slim

# Menentukan direktori kerja di dalam container
WORKDIR /app

# Menyalin file package.json dan package-lock.json ke dalam container
COPY package*.json ./

# Menginstall dependencies
RUN npm install

# Menyalin seluruh file aplikasi ke dalam container
COPY . .

# Menginstall serve untuk menyajikan aplikasi di production
# RUN npm install -g serve

# Menentukan port yang akan diekspos oleh container
EXPOSE 3000

# Menjalankan aplikasi menggunakan serve
CMD ["npm", "run", "start"]