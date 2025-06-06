# ExpenseTracker 📊 (IN WORKING)

[![Deployment Status](https://img.shields.io/badge/deployment-active-brightgreen)](https://expense-tracker-ntt.vercel.app)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Integrated-FFA000)](https://firebase.google.com/)

## 🔍 Overview

The Expense Tracker is an internal Angular application developed as part of the NTT DATA Tech Trek initiative. This tool streamlines the expense reporting process for NTT DATA employees, allowing for efficient submission, tracking, and management of business expenses.

## ✨ Features

* **Quick Expense Entry**: Submit expenses on-the-go with an intuitive interface
* **Receipt Management**: Upload, store, and organize digital receipts *(coming in V3)*
* **OCR-Based Receipts**: Automatically extract expense data from uploaded receipts using Google Vision API
* **Smart Insights & Budgeting**: Gemini AI helps users analyze spending patterns and provides smart budgeting suggestions
* **Expense Categories**: Categorize expenses for better financial visibility
* **Approval Workflow**: Streamlined approval process with notifications *(coming in V3)*
* **Reporting**: Generate detailed expense reports across various time periods *(coming in V2)*
* **Export Options**: Download reports in multiple formats (PDF, CSV, Excel) *(coming in V2)*

## 🚀 Getting Started

### Prerequisites

* Node.js (v20.0 or higher)
* Angular CLI (v19.0 or higher)
* npm (v10.0 or higher)
* Firebase account

## 🔥 Firebase Configuration

This project uses Firebase services and requires proper configuration via environment variables. 

### 📋 Prerequisites:

1. You need a Firebase account. If you don't have one, sign up at [firebase.google.com](https://firebase.google.com/).
2. Create a new Firebase project or use an existing one.
3. Configure the following services in your Firebase project:
   * Firebase Authentication
   * Cloud Firestore
   * Realtime Database
   * Firebase Storage
   * Google Analytics (optional, but required for the measurement ID)

### 🔑 Getting your Firebase Configuration Keys:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to access Project settings
4. Scroll down to "Your apps" section and select your web app (or create one by clicking the web icon </> if you haven't added one yet)
5. Under the "SDK setup and configuration" section, you'll find your Firebase configuration object which contains all the required keys
6. For Google Vision API and Gemini API keys, you'll need to enable these services in the Google Cloud Console associated with your Firebase project

### 🛠️ Additional Firebase Setup:

1. **Firebase Authentication**: Enable the authentication methods you plan to use (Email/Password, Google, etc.)
2. **Cloud Firestore**: Create a new database and set up appropriate security rules
3. **Realtime Database**: Create a database and configure security rules
4. **Firebase Storage**: Set up storage and configure security rules

## 💻 Installation

### Clone the repository:
```bash
git clone https://github.com/andricolae/expense-tracker.git
```

### Navigate to the project directory:
```bash
cd expense-tracker
```

### Install dependencies:
```bash
npm install
```

### Set up environment variables

Create a `.env` file in the root directory of the project with the following structure:

```env
API_KEY="your-firebase-api-key"
AUTH_DOM="your-firebase-auth-domain"
PROJ_ID="your-firebase-project-id"
STORAGE="your-firebase-storage-bucket"
MESS_SEND_ID="your-firebase-messaging-sender-id"
APP_ID="your-firebase-app-id"
MEASURE_ID="your-firebase-measurement-id"
GOGL_VISION="your-google-vision-api-key"
GMNI="your-gemini-api-key"
DB_URL="your-firebase-database-url"
```

```json
"start": "node -r dotenv/config mynode.js && ng serve",
```

## 🏗️ Architecture

- Core modules for authentication, data services, and HTTP interceptors
- Feature modules for expenses, reports, approvals, and user settings
- Shared modules for common components and directives
- State management using NgRx for predictable data flow

### Tech Stack

- Frontend: Angular 19
- Backend: Firebase
- OCR: Google Vision API
- AI Insights: Gemini AI
- CI/CD: GitHub and Vercel

## 👥 Team

| Name | Role |
| --- | --- |
| Anna Marita Thuri | Visual Experience Architect |
| Antonia Gabriela Albu | Visual Experience Architect |
| Francesco Maxim | Receipt Whisperer – OCR & AI Integration |
| Robert Gengiu | Access Maestro |
| Tudor Ovidiu Atodiresei | Authentication Guardian |
| Andrei Nicolae Calutiu | Expense Engineer |

## 📝 License

This project is proprietary and confidential. The code and its assets are the exclusive property of NTT DATA. Unauthorized use, reproduction, or distribution is prohibited.  
© 2025 NTT DATA | All Rights Reserved
