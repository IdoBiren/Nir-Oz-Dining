# FineDine: Premium Meal Ordering App

A modern, responsive meal ordering web application built with React, Vite, and Supabase.

## Features
- **Premium UI**: Glassmorphism design with a Gold/Light theme.
- **Menu Board**: Browse meals with images and details (Hebrew support).
- **Cart System**: Real-time cart management with modal view.
- **Ordering**: Place orders directly to a Supabase backend.
- **Login**: Simple Name/Table Number entry for customer identification.

## Tech Stack
- React 18
- Vite
- Vanilla CSS (Variables & Responsive Design)
- Supabase (Backend Database)

## Setup & Run

### 1. Prerequisites
- Node.js installed.
- A [Supabase](https://supabase.com) account (free tier works great).

### 2. Installation
```bash
npm install
```

### 3. Backend Setup
1. Create a new project on Supabase.
2. Run the SQL script found in `supabase_setup.sql` in your Supabase SQL Editor to create the `orders` table.
3. Copy your **Project URL** and **anon public key** from Supabase Settings -> API.
4. Open `.env` and paste your keys:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### 4. Running the App
```bash
# Windows
npm.cmd run dev

# Mac/Linux
npm run dev
```

Open `http://localhost:5173` to view it in the browser.
