# 🔄 Port Configuration Update

## Changes Made

- **Backend server** port changed from **3000** to **4000**
- **Frontend** port changed from **3000** to **3100**

### Updated Configuration

#### Backend (.env)

```env
PORT=4000  # Changed from 3000
```

#### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:4000/api  # Changed from 3000
```

#### Frontend (package.json)

```json
"scripts": {
  "start": "PORT=3100 react-scripts start"  // Changed from default 3000
}
```

### Application URLs

- **Frontend**: http://localhost:3100 (Changed)
- **Backend API**: http://localhost:4000/api (Changed)
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

### Files Updated

1. `backend/.env.example` - PORT=4000
2. `frontend/.env.example` - REACT_APP_API_URL updated
3. `backend/src/index.js` - Default port changed
4. `setup.sh` - Documentation updated
5. `run.sh` - URLs updated
6. `fix_database.sh` - URLs updated
7. `quick_fix.sh` - Port references updated
8. `test_database.sh` - API test URL updated
9. `check_status.sh` - Port check added
10. `ENVIRONMENT_VARIABLES.md` - Documentation updated
11. `TROUBLESHOOTING.md` - Port references updated
12. `README.md` - URLs updated
13. `SETUP_GUIDE.md` - All port references updated

### How to Apply Changes

If you already have `.env` files, update them manually:

```bash
# Update backend/.env
sed -i '' 's/PORT=3000/PORT=4000/' backend/.env

# Update frontend/.env
sed -i '' 's/localhost:3000\/api/localhost:4000\/api/' frontend/.env
```

Or copy from the updated examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Testing the Changes

```bash
# Start the application
./run.sh

# Test the endpoints
curl http://localhost:4000/health  # Backend
curl http://localhost:3100         # Frontend
```

All documentation and scripts have been updated to reflect the new port configuration.
