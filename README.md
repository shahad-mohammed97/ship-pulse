# 🚢 ShipPulse: Premium Logistics & Shipment Tracking Dashboard

**ShipPulse** is a high-performance, aesthetically rich logistics management platform designed to provide businesses with real-time visibility and automated risk analysis for their global shipment chains. Built with a focus on premium UI/UX, it empowers logistics teams to monitor transit health, detect delays early, and automate customer communications.

![ShipPulse Dashboard View](frontend/public/images/dashboard-preview.png) *(Note: Placeholder for actual preview context)*

## ✨ Key Features

- **🚀 Real-Time Tracking Integration**: Seamless synchronization with **AfterShip API** for live status updates.
- **🛡️ Automated Risk Analysis**: Intelligent engine that marks shipments as **NORMAL**, **STUCK**, or **DELAYED** based on custom transit rules.
- **📊 Business Intelligence Dashboard**: High-fidelity charts showing delivery trends, success rates, and risk distribution.
- **📥 Bulk Logistics Import**: Support for CSV bulk uploads with intelligent carrier and country detection logic.
- **🌓 Advanced Theme Support**: A system-aware UI with a premium "Purple-Black" night mode and a high-contrast day mode.
- **📩 Customer Notifications**: Direct email communication triggers for delayed or high-risk shipments.
- **🔐 Enterprise Security**: Secure JWT-based authentication with data isolation between different logistics accounts.

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS v4 & Vanilla CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with **Prisma ORM**
- **Job Processing**: BullMQ with Redis (for background tracking sync)
- **Email**: Nodemailer / SMTP Integration

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (for background jobs)

### Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:shahad-mohammed97/ship-pulse.git
   cd ship-pulse
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env # Add your DB_URL and API keys
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 📜 License
Internal Project - All Rights Reserved.

---
*Created with ❤️ by the ShipPulse Development Team.*
