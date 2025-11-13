# Manual Actions Required

These actions cannot be performed programmatically and must be completed manually:

## 1. Remove Unused Dependencies

Run the following command to remove zustand and papaparse from package.json:

```bash
# This will update package.json and bun.lock
bun remove zustand papaparse @types/papaparse
```

**Why:** These dependencies are no longer used in the codebase but remain in package.json.

## 2. Set Environment Variables

Create a `.env` file in the project root (use `.env.example` as a template):

```bash
# Copy the example
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

Required variables:
```
EXPO_PUBLIC_API_BASE=https://your-actual-api-domain.com
ADMIN_TOKEN=<generate-secure-token>
```

To generate a secure admin token:
```bash
openssl rand -hex 32
```

## 3. Test the Application

### A. Type Check
```bash
bunx tsc --noEmit
# Expected: No errors
```

### B. Lint Check
```bash
bun run lint
# Expected: No errors (import path warnings for @/ are acceptable)
```

### C. Run Audit Script
```bash
bunx tsx scripts/auditResult.ts
# Expected: Shows 44 rows, all 5 locations present
```

### D. Verify No CSV Remnants
```bash
grep -rn "csv\|CSV\|upload" --include="*.ts" --include="*.tsx" app/ contexts/ lib/ backend/
# Expected: No matches
```

### E. Verify Zustand Removed
After running `bun remove zustand`:
```bash
grep -rn "zustand" package.json
# Expected: No matches
```

## 4. Start the Development Server

```bash
bun run start
```

Then test the app:
1. Navigate to Admin tab
2. Login with your ADMIN_TOKEN
3. Run seed in upsert mode
4. Verify it returns: `{ rows_total: 44, created: 44, updated: 0, ... }`
5. Run seed again in upsert mode
6. Verify it returns: `{ rows_total: 44, created: 0, updated: 0, ... }` (idempotent)

## 5. Test API Endpoints

### Health Check
```bash
curl ${EXPO_PUBLIC_API_BASE}/api/health
# Expected: 200 OK with service info
```

### Admin Seed (Without Auth)
```bash
curl -X POST ${EXPO_PUBLIC_API_BASE}/api/trpc/admin.seed \
  -H "Content-Type: application/json" \
  -d '{"mode":"upsert"}'
# Expected: 401 Unauthorized
```

### Admin Seed (With Auth)
```bash
curl -X POST ${EXPO_PUBLIC_API_BASE}/api/trpc/admin.seed \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"mode":"upsert"}'
# Expected: 200 OK with seed results
```

### Rate Limiting
Run the admin seed endpoint 25 times rapidly:
```bash
for i in {1..25}; do
  curl -X POST ${EXPO_PUBLIC_API_BASE}/api/trpc/admin.seed \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"mode":"upsert"}' \
    -w "\nStatus: %{http_code}\n"
done
# Expected: Last ~5 requests return 429 Too Many Requests
```

## 6. Review Documentation

Read the following files to understand the system:
- `RUNBOOK.md` - Admin operations guide
- `AUDIT_REPORT.md` - Complete audit evidence
- `scripts/auditResult.ts` - Data integrity verification script

## Completion Checklist

- [ ] Removed zustand, papaparse, @types/papaparse via `bun remove`
- [ ] Created `.env` file with valid `EXPO_PUBLIC_API_BASE` and `ADMIN_TOKEN`
- [ ] Verified 0 TypeScript errors with `bunx tsc --noEmit`
- [ ] Verified 0 ESLint errors with `bun run lint`
- [ ] Ran audit script successfully
- [ ] Confirmed no CSV code with grep
- [ ] Confirmed zustand not in package.json
- [ ] Tested app startup successfully
- [ ] Tested admin login with token
- [ ] Tested seed idempotency (44 → 0/0)
- [ ] Tested health endpoint (200 OK)
- [ ] Tested admin auth (401 without token, 200 with token)
- [ ] Tested rate limiting (429 after 20 requests)
- [ ] Reviewed RUNBOOK.md
- [ ] Reviewed AUDIT_REPORT.md

Once all items are checked, the application is ready for deployment.
