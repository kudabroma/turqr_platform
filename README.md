🇹🇷 TurQR — Digital QR Menu & Website Platform for Restaurants

SaaS platform for restaurants: QR menus, public restaurant pages, and admin dashboard.
Built for scalable growth in the Turkish HoReCa market.

🚀 About The Project

TurQR is a full-stack SaaS platform that allows restaurants to:

Generate a digital QR menu

Manage categories & dishes via admin panel

Create a simple public restaurant page

Prepare for subscription-based monetization

The goal is to digitize restaurant menus and later expand into a broader hospitality ecosystem (bookings, payments, analytics).

🏗 Tech Stack
Backend

🐍 Python

🌿 Django

🔥 Django REST Framework

🔐 Session Authentication (Cookies + CSRF)

🗄 PostgreSQL (recommended)

Frontend (Public)

⚛ React

⚡ Vite

🎨 TailwindCSS

🔄 TanStack Query

Frontend (Admin)

⚛ React

🔐 Auth Context

📡 API client with CSRF handling

🧠 React Query (invalidateQueries, caching)

✨ Core Features
1️⃣ Public Restaurant Page

Restaurant profile (name, description, location)

Categories

Dishes

Language switcher

Mobile-friendly UI

2️⃣ Admin Dashboard

Login system (Session-based auth)

Restaurant profile editing

Full CRUD for:

Categories

Dishes

Error handling

API-driven state (no local mock data)

Logout with session cleanup

3️⃣ Backend Architecture

REST API

Clean separation:

Models

Serializers

ViewSets

CSRF-protected unsafe methods

Superuser panel (Django Admin)

📂 Project Structure
project_root/
│
├── back/
│   ├── restaurants/
│   ├── menu/
│   ├── users/
│   └── manage.py
│
├── front_public/
│   ├── src/
│   └── public/
│
├── front_admin/
│   ├── src/
│   └── api/
│
└── README.md

⚙️ Installation
1️⃣ Clone Repository
git clone https://github.com/yourusername/turqr.git
cd turqr

2️⃣ Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate (Windows)

pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver


Backend runs on:

http://127.0.0.1:8000

3️⃣ Frontend (Public)
cd front_public
npm install
npm run dev

4️⃣ Frontend (Admin)
cd front_admin
npm install
npm run dev

🔐 Authentication

Uses Django SessionAuthentication

CSRF token automatically attached to unsafe requests

Login sets HTTP-only session cookie

Logout invalidates session

📡 API Example
GET    /api/public/restaurant/
GET    /api/public/menu/

POST   /api/admin/categories/
PATCH  /api/admin/dishes/:id/
DELETE /api/admin/dishes/:id/

💰 Monetization Strategy (Planned)

14-day free trial

Monthly subscription:

Basic (QR only)

Standard (QR + Website)

Premium (Extended features)

Add-on services:

Menu setup

Seasonal updates

Custom design

📈 Roadmap
Phase 1

Full backend integration

Remove all mock data

Stable admin CRUD

Phase 2

Subscription system

Stripe integration

Trial logic

Phase 3

Analytics dashboard

Multi-restaurant support

Role-based permissions

Phase 4

Expansion:

Online ordering

Booking system

Payment integration

🎯 Vision

TurQR is designed to become:

The digital infrastructure layer for small & mid-size restaurants in Turkey.

Start with QR menus.
Expand into payments, analytics, bookings, and loyalty systems.

🤝 Contribution

Pull requests are welcome.

For major changes:

Open an issue

Discuss proposed improvements

Submit PR

📜 License

MIT License
