# GEMINI.md: SupaMart Project Overview

This document provides a comprehensive overview of the SupaMart project, a smart retail assistant, to be used as a context for future interactions with the Gemini CLI.

## Project Overview

SupaMart is a monorepo containing a backend service and a mobile application. The project is designed to be a "smart retail assistant" that helps shop owners manage their inventory, sales, and gain insights into their business.

The project is divided into two main parts:

*   **`backend`**: An Express.js application built with TypeScript that serves as the API for the mobile app. It uses Prisma as an ORM for interacting with a PostgreSQL database.
*   **`mobilev2`**: A React Native application built with Expo that provides the user interface for the retail assistant. It uses an offline-first approach, with a local SQLite database and a sync engine to keep the data in sync with the backend.

### Key Technologies

| Feature | Backend | MobileV2 |
| :--- | :--- | :--- |
| **Framework** | Express.js | React Native (Expo) |
| **Language** | TypeScript | TypeScript |
| **Database** | PostgreSQL, Prisma | SQLite |
| **API Style** | REST | |
| **Authentication** | JWT | |
| **Styling** | | Nativewind (Tailwind CSS) |
| **Navigation** | | Expo Router |
| **Validation** | Zod | |

## Building and Running

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory with the following content:
    ```
    PORT=3000
    NODE_ENV=development
    DATABASE_URL="postgresql://user:password@localhost:5432/supamart_db?schema=public"
    JWT_SECRET="your_super_secret_key"
    ```
4.  **Run database migrations:**
    ```bash
    npm run prisma:migrate
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```

### MobileV2

1.  **Navigate to the mobilev2 directory:**
    ```bash
    cd mobilev2
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Expo Dev Server. You can then run the app in a simulator or on a physical device using the Expo Go app.

## Development Conventions

*   **Monorepo Structure:** The project is organized as a monorepo, with the backend and mobile app in separate directories.
*   **TypeScript:** Both the backend and mobile app are written in TypeScript, providing type safety and improved developer experience.
*   **Modular Architecture:** The backend follows a modular architecture, with features organized into separate modules.
*   **Offline-First:** The mobile app is designed to be offline-first, using a local SQLite database and a sync engine to synchronize data with the backend.
*   **API Documentation:** The backend API is documented using Swagger, which can be accessed at the `/api-docs` endpoint.
*   **Validation:** The backend uses Zod for request validation, ensuring data integrity.
*   **Conventional Commits:** The project uses conventional commits for its commit messages. (Inferred from the commit history)
