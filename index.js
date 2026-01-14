import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dbConfig, PORT } from './configuration/db.config.js';
import adminRoute from './controllers/Auth/admin.controller.js';
import collectionRoute from "./routes/Collection/collection.route.js";
import galleryRoute from "./routes/Gallery/gallery.route.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173"
];
// app.use(cors({
//   origin: [ process.env.FRONTEND_URL, "http://localhost:5173"] || "*" ,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders:['Content-Type', 'Authorization'],
//   credentials: true
// }));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.options("*", cors());   // Very Important 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

mongoose.connect(dbConfig.url)
  .then(() => console.log('📊 MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.get('/', (req, res) => res.send('✅ Backend is Running...'));

// Serve uploads publically
app.use("/uploads", express.static("uploads"));

// Routes
app.use('/api/auth', adminRoute);
app.use("/api/collections", collectionRoute);
app.use("/api/gallery", galleryRoute);

const port = PORT || 5000;
app.listen(port, '0.0.0.0', () => console.log(`🚀 Server running on port ${port}`));
