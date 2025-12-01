# 🚀 Quick Start Guide - Base2 Taco Restaurant

This guide will get your taco restaurant platform up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Docker** and **Docker Compose** installed ([Get Docker](https://docs.docker.com/get-docker/))
- ✅ **Node.js 18+** (for local development option)
- ✅ **Git** (to clone the repository)

---

## 🎯 Option 1: Docker Setup (Recommended)

### Step 1: Start Docker Services

```bash
cd /path/to/base2

# Start all services (PostgreSQL, backend, frontend, nginx, traefik)
./scripts/start.sh
```

**What this does:**

- Creates Docker network
- Starts PostgreSQL database on port 5432
- Starts backend API on port 5000
- Starts frontend on port 3000
- Sets up nginx and traefik reverse proxy

**Wait for services to be ready** (about 30-60 seconds for first run)

### Step 2: Initialize Database

```bash
# In a new terminal, run database setup
cd /path/to/base2/backend
npm run db:setup
```

**What this creates:**

- ✅ Restaurant database tables (menu_categories, menu_items, orders, order_items)
- ✅ Admin account: `admin@tacos.local` / `admin123`
- ✅ Kitchen account: `kitchen@tacos.local` / `kitchen123`
- ✅ Sample menu with 25+ items (Tacos, Sides, Drinks, Specials)

### Step 3: Access the Application

Open your browser and visit:

- **🌮 Restaurant Website**: http://localhost:3000
- **📱 Menu Page**: http://localhost:3000/menu
- **🔐 Login**: http://localhost:3000 (use staff credentials above)

---

## 🎯 Option 2: Local Development (Without Docker)

If you prefer to run services locally without Docker:

### Step 1: Install PostgreSQL

Install PostgreSQL 14+ on your system:

- **Mac**: `brew install postgresql@14`
- **Linux**: `sudo apt-get install postgresql-14`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

### Step 2: Create Database

```bash
# Start PostgreSQL service
# Mac: brew services start postgresql@14
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres
CREATE DATABASE base2;
CREATE USER base2user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE base2 TO base2user;
\q
```

### Step 3: Configure Environment

```bash
cd /path/to/base2/backend

# Copy and edit .env file
cp .env.example .env
nano .env  # or use your preferred editor
```

**Update these values in `.env`:**

```bash
DATABASE_URL=postgresql://base2user:your_password@localhost:5432/base2
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=5000
NODE_ENV=development
```

### Step 4: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../react-app
npm install
```

### Step 5: Initialize Database

```bash
cd backend
npm run db:setup
```

### Step 6: Start Services

Open **two terminal windows**:

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

Server will start on http://localhost:5000

**Terminal 2 - Frontend:**

```bash
cd react-app
npm start
```

App will open on http://localhost:3000

---

## ✅ Verify Installation

### 1. Test Public Menu

1. Visit http://localhost:3000/menu
2. You should see menu items organized by category
3. Try adding items to cart
4. Place a test order

### 2. Test Admin Login

1. Go to http://localhost:3000
2. Login with: `admin@tacos.local` / `admin123`
3. Click "Admin" in navigation
4. You should see Menu Management and Order Management tabs

### 3. Test Kitchen Dashboard

1. Logout and login with: `kitchen@tacos.local` / `kitchen123`
2. Click "Kitchen" in navigation
3. Place an order as a customer (use incognito window)
4. Order should appear in kitchen dashboard
5. Try updating order status

---

## 🎨 Complete User Flow Test

### Customer Flow (No Login Required)

1. **Browse Menu**

   ```
   → Go to http://localhost:3000/menu
   → Click category filters (TACOS, SIDES, DRINKS)
   → Click "Add to Cart" on items
   → See cart counter in navigation
   ```

2. **Place Order**

   ```
   → Click "Cart" button
   → Adjust quantities with +/- buttons
   → Fill in:
     - Name: John Doe
     - Phone: 555-1234
     - Email: john@example.com (optional)
     - Notes: "Extra salsa please"
   → Click "Place Order"
   ```

3. **View Confirmation**
   ```
   → Note the Order ID
   → See order status (NEW)
   → Bookmark the confirmation page URL
   ```

### Kitchen Staff Flow

1. **Login**

   ```
   → Go to http://localhost:3000
   → Login: kitchen@tacos.local / kitchen123
   → Click "Kitchen" in nav
   ```

2. **Process Orders**

   ```
   → See new order in blue card
   → Review items and special notes
   → Click "▶️ Start Preparing"
   → Order turns yellow (IN_PROGRESS)
   → When done, click "✅ Mark Ready"
   → Order disappears from active orders
   ```

3. **Check Auto-Refresh**
   ```
   → Place another order in different browser
   → Watch it appear in kitchen within 5 seconds
   → No page refresh needed!
   ```

### Admin Flow

1. **Login**

   ```
   → Go to http://localhost:3000
   → Login: admin@tacos.local / admin123
   → Click "Admin" in nav
   ```

2. **Manage Menu**

   ```
   → Click "Menu Management" tab
   → Click "+ Add Menu Item"
   → Fill in:
     - Name: Fish Burrito
     - Description: Grilled fish with rice and beans
     - Price: 8.99
     - Category: TACOS
     - ✓ Available
     - ✓ Special
   → Click "Save"
   → See new item in table
   → Click "Edit" to modify
   → Try toggling availability
   ```

3. **Manage Orders**
   ```
   → Click "Order Management" tab
   → See all orders (past and present)
   → View customer details
   → Update order status via dropdown
   → See total amounts and items
   ```

---

## 🔧 Troubleshooting

### Database Connection Errors

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Solutions:**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres  # For Docker setup
pg_isready                  # For local setup

# Restart PostgreSQL
docker-compose restart postgres  # Docker
brew services restart postgresql@14  # Mac local
sudo systemctl restart postgresql    # Linux local
```

### Port Already in Use

**Error**: `Port 3000/5000 is already in use`

**Solutions:**

```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:5000 | xargs kill -9  # Backend

# Or change ports in .env files
```

### Module Not Found Errors

**Error**: `Cannot find module 'pg'` or similar

**Solution:**

```bash
# Reinstall dependencies
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../react-app && rm -rf node_modules package-lock.json && npm install
```

### Database Not Seeded

**Error**: Menu is empty or staff accounts don't work

**Solution:**

```bash
cd backend
npm run db:setup  # Run migrations and seed again
```

### Cart Not Persisting

**Error**: Cart clears on page refresh

**Solution:**

- Clear browser localStorage and try again
- Check browser console for errors
- Disable browser extensions that block localStorage

---

## 📊 Default Data

After running `npm run db:setup`, you'll have:

### Staff Accounts

| Email               | Password   | Role    |
| ------------------- | ---------- | ------- |
| admin@tacos.local   | admin123   | ADMIN   |
| kitchen@tacos.local | kitchen123 | KITCHEN |

### Menu Categories

- **TACOS** - 7 items (Carne Asada, Al Pastor, Chicken, Fish, Carnitas, Veggie, Shrimp)
- **SIDES** - 6 items (Rice & Beans, Chips & Salsa, Guacamole, Elote, Queso, Black Beans)
- **DRINKS** - 7 items (Horchata, Jamaica, Tamarindo, Mexican Coke, Jarritos, Lime Water, Iced Tea)
- **SPECIALS** - 4 items (Taco Trio, Taco Platter, Family Pack, Burrito Grande)

**Total: 24 menu items** ready to order!

---

## 🎬 Video Walkthrough (What to Expect)

### Customer Experience

1. Land on menu page with hero header and taco emoji
2. See items organized by colorful category pills
3. Click items, watch "Added!" confirmation
4. Floating cart button shows item count
5. Cart page shows summary with +/- controls
6. Checkout form is simple and quick
7. Confirmation page shows order number and status
8. Status auto-updates as kitchen progresses

### Kitchen Experience

1. Dark-themed dashboard (easy on eyes in bright kitchen)
2. Badge counters show NEW vs IN_PROGRESS counts
3. New orders in blue, in-progress in yellow
4. Urgent orders (>15 min) have red border and warning
5. Big buttons for quick status updates
6. Auto-refresh every 5 seconds
7. Special instructions highlighted

### Admin Experience

1. Clean white dashboard with two tabs
2. Menu Management has full CRUD interface
3. Forms with validation and error messages
4. Order Management shows all orders in grid
5. Dropdown status selectors for quick updates
6. Customer contact info easily visible

---

## 🚀 Next Steps

### Customize Your Restaurant

1. **Update Branding**
   - Change "Base2 Tacos" to your restaurant name in `Navigation.js`
   - Update colors in inline styles (change `#667eea` purple to your brand color)
   - Add your logo image in `Navigation.js` logoIcon

2. **Add Your Menu**
   - Login as admin
   - Delete sample items
   - Create your actual menu items
   - Upload item images (add image URL field)

3. **Update Location**
   - Edit `Location.js` with your actual:
     - Address
     - Phone number
     - Hours of operation
   - Add Google Maps embed

4. **Configure Email/SMS**
   - Set up Nodemailer for order confirmations
   - Add SMS service (Twilio) for order alerts
   - Update notification templates

5. **Add Payment**
   - Integrate Stripe ([Guide](https://stripe.com/docs))
   - Update checkout flow in `Cart.js`
   - Add payment confirmation

### Deploy to Production

1. **Environment Variables**

   ```bash
   # Update .env for production
   NODE_ENV=production
   DATABASE_URL=your_production_db_url
   JWT_SECRET=super_secure_random_string
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Build Frontend**

   ```bash
   cd react-app
   npm run build
   # Deploy build/ folder to your host
   ```

3. **Deploy Backend**

   ```bash
   # Use Docker or deploy to:
   # - Heroku
   # - Digital Ocean
   # - AWS
   # - Railway
   # - Render
   ```

4. **Database**
   - Use managed PostgreSQL (Heroku Postgres, AWS RDS, Supabase)
   - Run migrations on production DB
   - Don't run seed script (or create prod-safe version)

---

## 📚 Additional Resources

- **Full Documentation**: See [RESTAURANT_README.md](./RESTAURANT_README.md)
- **API Docs**: See [RESTAURANT_README.md#api-documentation](./RESTAURANT_README.md#api-documentation)
- **Original Base2 Docs**: See [backend/README.md](./backend/README.md)

---

## 🆘 Getting Help

If you run into issues:

1. Check the Troubleshooting section above
2. Review logs:

   ```bash
   # Docker logs
   docker-compose logs backend
   docker-compose logs frontend

   # Or check terminal output for local dev
   ```

3. Check browser console for frontend errors (F12 → Console)
4. Verify database connection in pgAdmin or psql
5. Ensure all environment variables are set correctly

---

## 🎉 Success Checklist

You're all set when you can:

- [ ] See the menu at http://localhost:3000/menu
- [ ] Add items to cart and see counter
- [ ] Place a test order as a customer
- [ ] Login as admin and see the order
- [ ] Login as kitchen and process the order
- [ ] Create a new menu item from admin panel
- [ ] See order status update in real-time

**Congratulations! Your taco restaurant is ready to serve customers! 🌮🚀**

---

**Need help?** Review the [full documentation](./RESTAURANT_README.md) for detailed API specs, architecture details, and advanced features.
