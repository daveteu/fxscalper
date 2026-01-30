# FX Scalper - MongoDB Setup

## Start MongoDB with Docker

```bash
# Start MongoDB container
docker-compose up -d

# Check if MongoDB is running
docker ps | grep fxscalper-mongo

# View MongoDB logs
docker-compose logs -f mongodb

# Stop MongoDB
docker-compose down

# Stop and remove data (fresh start)
docker-compose down -v
```

## MongoDB Connection

- **Host**: localhost:27017
- **Database**: fxscalper
- **Username**: admin
- **Password**: fxscalper123
- **Connection String**: `mongodb://admin:fxscalper123@localhost:27017/fxscalper?authSource=admin`

## Environment Variables

Add to `.env.local`:

```bash
MONGODB_URI=mongodb://admin:fxscalper123@localhost:27017/fxscalper?authSource=admin
```

## Verify Setup

```bash
# Connect to MongoDB using Docker exec
docker exec -it fxscalper-mongo mongosh -u admin -p fxscalper123 --authenticationDatabase admin

# Inside mongosh, run:
use fxscalper
db.trades.find()
```

## Trade Sync Flow

1. **Start MongoDB**: `docker-compose up -d`
2. **Go to Journal page** in the app
3. **Click "Sync from Oanda"** button
4. **View trades** - Both open and closed trades appear
5. **Filter** by "All", "Open", or "Closed"
6. **Export CSV** of your trades

## Features

✅ Syncs open positions from Oanda
✅ Syncs closed trades from Oanda (last 500)
✅ Calculates pips automatically
✅ Shows win/loss/breakeven status
✅ Filters by status
✅ Export to CSV
✅ Persistent storage in MongoDB
