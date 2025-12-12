# SupaMart Backend

A robust Express.js backend for the SupaMart Smart Retail Assistant. Built with TypeScript, Prisma ORM, and PostgreSQL.

## 🚀 Features

- **Authentication**: JWT-based secure auth with phone number login.
- **Product Management**: CRUD operations for products with barcode support.
- **Inventory Management**: Real-time stock tracking and restocking.
- **Sales Processing**: Transactional checkout handling with inventory updates.
- **AI Insights**: (Stub) Endpoints for top-selling items, low stock alerts, and trends.
- **Validation**: Strict request validation using Zod.
- **Type Safety**: End-to-end type safety with TypeScript and Prisma.

## 🛠 Tech Stack

- Node.js & Express.js
- TypeScript
- PostgreSQL & Prisma ORM
- Zod (Validation)
- JSON Web Tokens (JWT)
- Docker (optional for DB)

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- npm or yarn

## ⚡ Getting Started

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` root:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/supamart_db?schema=public"
JWT_SECRET="your_super_secret_key"
```

### 3. Database Setup

Ensure your PostgreSQL server is running and the database URL is correct.

```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npm run prisma:migrate

# (Optional) Seed the database with sample data
npm run seed
```

### 4. Running the Application

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

## 📂 Project Structure

```
src/
├── config/         # DB and Env configuration
├── middlewares/    # Auth, Error handling, Logging
├── modules/        # Feature-based architecture
│   ├── auth/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   └── insights/
├── utils/          # Helpers (Responses, Validators)
├── app.ts          # Express app setup
└── server.ts       # Entry point
```

## 🧪 API Endpoints & Curl Examples

### Authentication

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "1234567890", "shopName": "My Store", "password": "password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "1234567890", "password": "password123"}'
```

> **Note:** Copy the `token` from the login response for subsequent requests.

### Products

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Super Coffee",
    "barcode": "888123456",
    "category": "Beverages",
    "sellingPrice": 5.50,
    "purchasePrice": 3.00
  }'
```

**List Products:**
```bash
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Sales (Checkout)

```bash
curl -X POST http://localhost:3000/api/v1/sales/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "items": [
      { "productId": "PRODUCT_ID_HERE", "quantity": 2 }
    ]
  }'
```

### AI Insights

```bash
curl -X GET http://localhost:3000/api/v1/insights/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🛡 License

ISC