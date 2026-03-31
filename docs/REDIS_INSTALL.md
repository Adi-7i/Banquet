# Redis Installation Guide

## Windows

### Option 1: Using WSL (Recommended)
```bash
# Install WSL if not already installed
wsl --install

# In WSL terminal:
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Test
redis-cli ping
# Should return: PONG
```

### Option 2: Using Docker
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Option 3: Memurai (Windows Native)
1. Download from: https://www.memurai.com/
2. Install and start service

## Verify Connection
```bash
# Test Redis connection
redis-cli ping
```

## Alternative: Run Without Redis
The booking system will work without Redis, but with reduced functionality:
- ❌ No distributed locking (single-instance only)
- ❌ No async job queues (synchronous notifications)
- ✅ Booking creation still works
- ✅ All CRUD operations work
- ✅ Pricing calculations work
