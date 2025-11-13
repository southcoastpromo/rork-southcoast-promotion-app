# SouthCoast ProMotion - Admin Runbook

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in the project root with:

```bash
# API Base URL (no trailing slash)
EXPO_PUBLIC_API_BASE=https://your-api-domain.com

# Admin Token for /admin/* routes
ADMIN_TOKEN=your-secure-admin-token-here
```

**Requirements:**
- `EXPO_PUBLIC_API_BASE`: Must start with `https://` and have NO trailing slash
- `ADMIN_TOKEN`: Secure random string (minimum 32 characters recommended)

### 2. Install Dependencies

```bash
bun install
```

### 3. Start the Development Server

```bash
# Start with tunnel (recommended for mobile testing)
bun run start

# Start web preview
bun run start-web
```

### 4. Run Seed Data

1. Open the app
2. Navigate to Admin tab
3. Login with your `ADMIN_TOKEN`
4. Click "Run Seed (Upsert)" for initial load
5. Click "Replace Mode" to archive old records
6. Click "Reset & Seed" to clear all data and reseed

## Seed Modes

**Upsert Mode** (default, idempotent):
- Updates existing campaign windows
- Creates new windows if they don't exist
- Preserves bookings
- Safe for repeated runs (0/0 on second run)

**Replace Mode**:
- Upserts seed data
- Archives windows NOT in the seed data
- Use when removing old campaigns

**Reset Mode**:
- **DESTRUCTIVE**: Deletes ALL data
- Reseeds from scratch
- Use only for testing or fresh start

## API Endpoints

### Health Check
```bash
GET https://your-api-domain.com/api/health
# Expected: 200 OK with { status: "ok", service: "SouthCoast ProMotion API" }
```

### Seed Data (Admin Only)
```bash
POST https://your-api-domain.com/api/trpc/admin.seed
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "mode": "upsert",  // or "replace"
  "reset": false     // set true for reset mode
}

# Expected: 200 OK with { rows_total: 44, created: N, updated: M, archived: 0, seed_version: "4.0.0" }
# Without auth: 401 Unauthorized
# Rate limited: 429 Too Many Requests (max 20 requests per minute)
```

### Get All Campaigns
```bash
POST https://your-api-domain.com/api/trpc/campaigns.getAll
Content-Type: application/json

{
  "date": "2025-11-21",      // optional
  "location": "BRIGHTON",    // optional
  "time": "19:00-24:00",     // optional
  "page": 1
}

# Expected: 200 OK with { data: [...], pagination: { page, limit, total, pages } }
```

### Create Booking
```bash
POST https://your-api-domain.com/api/trpc/bookings.create
Content-Type: application/json

{
  "windowId": "win_xxx",
  "slotsBooked": 2,
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 1234 567890"
  }
}

# Expected: 200 OK with booking details and discount tier
# Insufficient slots: 409 CONFLICT
# Invalid data: 400 BAD_REQUEST
```

## 3 Smoke Checks

### Check 1: Health Endpoint
```bash
curl https://your-api-domain.com/api/health
# Expected: {"status":"ok","service":"SouthCoast ProMotion API","version":"1.0.0"}
```

### Check 2: Campaigns List (with filters)
```bash
curl -X POST https://your-api-domain.com/api/trpc/campaigns.getAll \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-11-21","location":"BRIGHTON"}'
# Expected: JSON with matching campaign windows
```

### Check 3: Booking with Discount + 409 Overbooking
```bash
# Test discount (2+ slots get 10% off)
curl -X POST https://your-api-domain.com/api/trpc/bookings.create \
  -H "Content-Type: application/json" \
  -d '{
    "windowId": "win_xxx",
    "slotsBooked": 3,
    "contact": {"name":"Test","email":"test@test.com","phone":"1234567890"}
  }'
# Expected: 200 OK with tier: "10%" and discountApplied > 0

# Test overbooking (if only 2 slots available)
curl -X POST https://your-api-domain.com/api/trpc/bookings.create \
  -H "Content-Type: application/json" \
  -d '{
    "windowId": "win_xxx",
    "slotsBooked": 50,
    "contact": {"name":"Test","email":"test@test.com","phone":"1234567890"}
  }'
# Expected: 409 CONFLICT with message about available slots
```

## Discount Tiers

| Slots Booked | Discount | Tier   |
|--------------|----------|--------|
| 1            | 0%       | none   |
| 2-3          | 10%      | 10%    |
| 4-5          | 15%      | 15%    |
| 6+           | 20%      | 20%    |

VAT: 20% applied after discount

## Seed Data Details

**Total Rows:** 44  
**Version:** 4.0.0  
**Locations:** BRIGHTON, TONBRIDGE/TUNBRIDGE WELLS, MAIDSTONE, HASTINGS/BEXHILL, EASTBOURNE  
**Date Range:** 20/11/2025 - 31/12/2025

### Per-Location Breakdown

| Location                      | Windows | Min Date   | Max Date   |
|-------------------------------|---------|------------|------------|
| BRIGHTON                      | 11      | 21/11/2025 | 27/12/2025 |
| EASTBOURNE                    | 3       | 12/12/2025 | 14/12/2025 |
| HASTINGS/BEXHILL              | 23      | 20/11/2025 | 31/12/2025 |
| MAIDSTONE                     | 4       | 27/11/2025 | 28/12/2025 |
| TONBRIDGE/TUNBRIDGE WELLS     | 3       | 19/12/2025 | 21/12/2025 |

## Security Features

✅ Admin routes require Bearer token authentication  
✅ Rate limiting on /admin/* (20 requests per 60 seconds)  
✅ Input sanitization (name, email, phone)  
✅ Audit logging for all admin and booking operations  
✅ No secrets logged  
✅ HTTPS enforced for API_BASE

## Audit Logs

All admin actions and booking attempts are logged:
- `seed_upsert`, `seed_replace`, `seed_reset`
- `booking_attempt`, `booking_success`, `booking_failure`

Logs include: timestamp, IP, action details (no sensitive data)

## Troubleshooting

**401 Unauthorized on admin routes?**
- Check `ADMIN_TOKEN` is set in server environment
- Ensure Authorization header: `Bearer <token>`

**429 Rate Limited?**
- Wait 60 seconds before retrying
- Reduce request frequency

**Seed returns 0/0 on first run?**
- Data may already exist; use Reset mode if needed

**TypeScript errors?**
- Run `bunx tsc --noEmit` to check
- Ensure all dependencies installed

**Build failing?**
- Clear cache: `bunx expo start --clear`
- Reinstall: `rm -rf node_modules && bun install`

## Development

```bash
# Type checking
bunx tsc --noEmit

# Linting
bun run lint

# Run audit report
bunx tsx scripts/auditResult.ts
```

## Support

For issues or questions:
- Check [Expo Documentation](https://docs.expo.dev/)
- Review [tRPC Documentation](https://trpc.io/)
- Contact system administrator for API access
