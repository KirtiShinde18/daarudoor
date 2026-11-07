# DaaruDoor 🍷

A full-stack liquor delivery platform featuring an Express backend, Next.js web portal (for admin & delivery partners), and React Native (Expo) mobile application for customers.

---

## 📁 Project Structure

```text
daarudoor/
├── server/          # Express.js REST API & Socket.io server
├── web/             # Next.js 16 (App Router) + Tailwind CSS web dashboard
└── mobile/          # React Native (Expo) customer mobile application
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22)
- **MongoDB**: Local or MongoDB Atlas instance
- **npm** or **yarn**

---

### 2. Backend (`server`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   *Fill in your MongoDB URI, JWT secret, Cloudinary credentials, and email settings in `.env`.*
4. (Optional) Seed the database with initial admin user:
   ```bash
   npm run seed
   ```
5. Start the server:
   ```bash
   node index.js
   ```
   Default server port: `5500`.

---

### 3. Web Dashboard (`web`)

1. Navigate to the web folder:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to your backend URL (e.g. `http://localhost:5500`).
4. Run in development:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

### 4. Mobile App (`mobile`)

1. Navigate to the mobile folder:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Set `EXPO_PUBLIC_API_URL` to your machine's local IP (e.g. `http://192.168.x.x:5500`) when testing on physical devices, or your production backend domain.
4. Start the Expo development server:
   ```bash
   npm start
   ```

