import { SEED_DATA } from '../lib/seed-data';

interface LocationStats {
  location: string;
  count: number;
  minDate: string;
  maxDate: string;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  let year = parseInt(parts[2]);
  if (year < 100) {
    year += 2000;
  }
  return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function formatDateForDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function analyzeLocations(): LocationStats[] {
  const locationMap = new Map<string, { dates: Date[], count: number }>();

  for (const row of SEED_DATA) {
    const location = row.campaign;
    const date = parseDate(row.date);

    if (!locationMap.has(location)) {
      locationMap.set(location, { dates: [], count: 0 });
    }

    const stats = locationMap.get(location)!;
    stats.dates.push(date);
    stats.count++;
  }

  const result: LocationStats[] = [];
  
  for (const [location, stats] of locationMap.entries()) {
    const sortedDates = stats.dates.sort((a, b) => a.getTime() - b.getTime());
    result.push({
      location,
      count: stats.count,
      minDate: formatDateForDisplay(sortedDates[0]),
      maxDate: formatDateForDisplay(sortedDates[sortedDates.length - 1]),
    });
  }

  return result.sort((a, b) => a.location.localeCompare(b.location));
}

function generateReport(): void {
  console.log('\n=== DATA INTEGRITY AUDIT ===\n');
  
  console.log(`Total rows in SEED_DATA: ${SEED_DATA.length}`);
  console.log(`Expected: 44`);
  console.log(`Status: ${SEED_DATA.length === 44 ? '✅ PASS' : '❌ FAIL'}\n`);

  console.log('=== PER-LOCATION BREAKDOWN ===\n');
  
  const locationStats = analyzeLocations();
  
  console.log('Location                      | Count | Min Date     | Max Date');
  console.log('------------------------------|-------|--------------|------------');
  
  for (const stat of locationStats) {
    const paddedLocation = stat.location.padEnd(30);
    const paddedCount = stat.count.toString().padStart(5);
    console.log(`${paddedLocation}| ${paddedCount} | ${stat.minDate} | ${stat.maxDate}`);
  }
  
  console.log('\n=== LOCATIONS PRESENT ===\n');
  const expectedLocations = [
    'BRIGHTON',
    'TONBRIDGE/TUNBRIDGE WELLS',
    'MAIDSTONE',
    'HASTINGS/BEXHILL',
    'EASTBOURNE'
  ];
  
  const actualLocations = locationStats.map(s => s.location);
  
  for (const expected of expectedLocations) {
    const present = actualLocations.includes(expected);
    console.log(`${expected}: ${present ? '✅' : '❌'}`);
  }
  
  const unexpectedLocations = actualLocations.filter(l => !expectedLocations.includes(l));
  if (unexpectedLocations.length > 0) {
    console.log('\n⚠️  Unexpected locations found:');
    for (const loc of unexpectedLocations) {
      console.log(`  - ${loc}`);
    }
  }
  
  console.log('\n=== CSV REMNANTS CHECK ===\n');
  console.log('Run: grep -rn "csv\\|CSV\\|upload" --include="*.ts" --include="*.tsx" app/ contexts/ lib/ backend/');
  console.log('Expected: No matches (except in bun.lock which is acceptable)');
  
  console.log('\n=== API_BASE CONFIG ===\n');
  console.log('EXPO_PUBLIC_API_BASE must be:');
  console.log('  - Non-empty');
  console.log('  - Start with https://');
  console.log('  - No trailing slash');
  console.log('  - Used by all API calls');
  
  console.log('\n=== ZUSTAND CHECK ===\n');
  console.log('Run: grep -rn "zustand" --include="*.ts" --include="*.tsx" app/ contexts/ lib/ backend/');
  console.log('Expected: No matches (bun.lock is acceptable until reinstall)');
}

generateReport();
