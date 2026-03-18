
# 📱 SmartInfoQueue

**Mobile-Based Location-Activated Information & Engagement System for Public Service Visitors**

---

## 🚀 Overview

SmartInfoQueue is a smart queue and information management system designed to improve the experience of visitors in public service areas like hospitals, government offices, banks, and campuses.

The system uses **location-based services and mobile interaction** to provide real-time updates, reduce waiting confusion, and improve engagement.

---

## ✨ Features

* 📍 **Location-Based Access**
  Detects user location and activates relevant services automatically

* 📊 **Smart Queue Management**
  View queue status, waiting time, and position in real-time

* 📢 **Instant Notifications**
  Get alerts when your turn is near

* 🧠 **Interactive Quiz Module**
  Keeps users engaged while waiting

* 🗺️ **Map Picker Integration**
  Select or detect service location easily

* 🧩 **Modular Architecture**
  Built using reusable components for scalability

---

## 🛠️ Tech Stack

* **Frontend:** React + TypeScript
* **Build Tool:** Vite
* **UI Components:** Custom components
* **Backend Services:** API-based (via `services/`)
* **AI Integration:** Gemini API (for smart features)

---

## 📁 Project Structure

```
smartinfoqueue/
│
├── components/
│   ├── Layout.tsx
│   ├── MapPicker.tsx
│   └── QuizModule.tsx
│
├── services/
│   └── geminiService.ts
│
├── App.tsx
├── index.tsx
├── index.html
├── types.ts
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/smartinfoqueue.git
cd smartinfoqueue
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Run the development server

```bash
npm run dev
```

### 4️⃣ Open in browser

```
http://localhost:5173
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory and add:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

---

## 🎯 Use Cases

* 🏥 Hospitals (OPD queue management)
* 🏛️ Government offices
* 🏦 Banks
* 🎓 Universities & campuses
* 🚉 Transport hubs

---

## 📌 Future Enhancements

* 🤖 AI-based waiting time prediction
* 📱 Mobile app version
* 🔔 SMS/WhatsApp notifications
* 📊 Admin dashboard & analytics
* 🧾 Token generation system

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Commit your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the **MIT License**.

---

👥 Team

SmartInfoQueue Development Team

Vishal Mate — Team Lead

Saish — Team Member

Tejas — Team Member

Mukund — Team Member

* Computer Science Engineer
* Building SaaS & AI-based solutions

