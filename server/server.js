require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const port = process.env.PORT || 5000;
async function start() {
 if (!process.env.MONGO_URI) { console.error('MONGO_URI chưa được cấu hình trong server/.env'); process.exitCode=1; return; }
 try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
  app.listen(port,()=>console.log(`EDUZO API: http://localhost:${port}`));
 } catch(err) {console.error('MongoDB connection failed:', err.message);process.exitCode=1;}
}
start();
