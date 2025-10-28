# 📱 MedRemind – Daily Medicine Reminder App

> A smart and lightweight **React Native** app that helps users remember to take their medicines on time with **daily notifications**, dosage tracking, and a simple, beautiful UI.

---






## 🧭 Overview

**MedRemind** allows users to:
- Add medicines with name, dosage, and reminder time.  
- Choose **when to take** (morning, afternoon, evening).  
- Choose **before or after eating**.  
- Automatically schedule **daily notifications** using [**Notifee**](https://notifee.app).  
- View upcoming, missed, and taken medicines.  
- Delete, update, or mark reminders as “taken.”  

It’s a fully offline app powered by **AsyncStorage**, with smooth navigation and adaptive icons.

---





## 🏗️ Project Structure

MedRemind/
├── android/ # Native Android code (Java + resources)
│ └── app/src/main/res/
│ ├── mipmap-/ # App launcher icons (ic_launcher)
│ ├── drawable-/ # Notification icons (ic_notification)
│ └── xml/ # Adaptive icon XML configs
│
├── src/
│ ├── screens/
│ │ ├── HomeScreen.jsx # Main screen with medicine list, filters & FAB
│ │ ├── AddMedicineScreen.jsx# Add/Edit medicine form + reminder setup
│ │
│ ├── components/
│ │ └── MedicineItem.jsx # Single medicine card with delete/taken buttons
│ │
│ ├── storage/
│ │ └── medicineStorage.js # AsyncStorage CRUD (add, load, delete, update)
│ │
│ ├── utils/
│ │ └── notifications.js # Notifee notification scheduling & cancellation
│ │
│ └── App.js / AppNavigator.js # Root navigation
│
├── package.json
├── README.md # This file
└── App.json, index.js, etc.






---

## ⚙️ Features

| Feature | Description |
|----------|--------------|
| 🧾 Add Medicine | Add medicine name, dosage, and reminder time |
| ⏰ Daily Reminder | Notifee schedules notifications at user-set time |
| 🍽️ Before / After Eating | Option to specify medicine timing context |
| 🌞 Morning / Afternoon / Evening | Choose when to take |
| 🗑️ Delete Medicine | Delete reminders and cancel notifications |
| 🔕 Mark as Taken | Cancel scheduled reminders for that medicine |
| 🔔 Local Notifications | Works even when the app is closed |
| 💾 Offline Storage | Saved locally via AsyncStorage |
| 🧭 Smooth Navigation | Implemented with React Navigation |
| 🧩 Adaptive & Notification Icons | Custom app and monochrome notification icons |

---





//-------------------- Terminal Commands ---------------//
# 1st Terminal command 
npm start

# 2ns Terminal command
npx react-native run-android






## 📦 Required Packages

Install all dependencies before running the project:

```bash

# Core React Native packages
npm install react-native react

# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# Local Storage
npm install @react-native-async-storage/async-storage

# Date & Time Picker
npm install @react-native-community/datetimepicker

# Notifications
npm install @notifee/react-native

# For daily scheduling logic
npm install date-fns
