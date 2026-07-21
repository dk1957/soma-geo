# Sanity Migration Scripts

Quick reference for all Sanity CMS migration scripts.

## Prerequisites

```bash
# Set your Sanity write token
export SANITY_API_WRITE_TOKEN="sk_production_..."

# Or add to .env.local
echo "SANITY_API_WRITE_TOKEN=sk_production_..." >> .env.local
```

Get token from: https://sanity.io/manage/personal/project/4de42y7s/api

## Available Scripts

### 1. General Marketing Pages
**Script**: `migrate-landing-to-sanity.ts`  
**Content**: Home, About, Pricing (basic)  
**Count**: 3 pages

```bash
npx tsx scripts/migrate-landing-to-sanity.ts
```

**Creates:**
- Home page with hero, features, content
- About page with company info
- Basic pricing page

---

### 2. Country-Specific Pages
**Script**: `migrate-countries-to-sanity.ts`  
**Content**: 8 regional landing pages  
**Count**: 8 pages

```bash
npx tsx scripts/migrate-countries-to-sanity.ts
```

**Creates:**
- 🇳🇬 Nigeria
- 🇩🇪 Germany
- 🇦🇪 UAE
- 🇬🇧 United Kingdom
- 🇬🇭 Ghana
- 🇰🇪 Kenya
- 🇿🇦 South Africa
- 🇸🇦 Saudi Arabia

Each with: hero, stats, specialization, case studies, market insights, cities, industries

---

### 3. Miscellaneous Pages
**Script**: `migrate-misc-pages-to-sanity.ts`  
**Content**: Legal, pricing, contact, FAQ  
**Count**: 5 pages

```bash
npx tsx scripts/migrate-misc-pages-to-sanity.ts
```

**Creates:**
- Privacy Policy (legal page with 8 sections)
- Terms of Service (legal page with 8 sections)
- Pricing (full pricing page with 3 tiers)
- Contact (contact page with 3 offices)
- FAQ (FAQ page with 4 categories)

---

## Run All Migrations

```bash
# Run all three scripts in sequence
npx tsx scripts/migrate-landing-to-sanity.ts && \
npx tsx scripts/migrate-countries-to-sanity.ts && \
npx tsx scripts/migrate-misc-pages-to-sanity.ts
```

**Expected Output:**
```
✅ Created/Updated: Home (/home)
✅ Created/Updated: About (/about)
✅ Created/Updated: Pricing (/pricing)
✅ Created/Updated: 🇳🇬 Nigeria (/nigeria)
✅ Created/Updated: 🇩🇪 Germany (/germany)
... (6 more countries)
✅ Created/Updated: Privacy Policy (/privacy)
✅ Created/Updated: Terms of Service (/terms)
✅ Created/Updated: Pricing (/pricing)
✅ Created/Updated: Contact (/contact)
✅ Created/Updated: FAQ (/faq)
```

---

## Verification

### 1. Check Sanity Studio

```bash
pnpm dev
# Open: http://localhost:3000/welcome
```

You should see:
- Page (3 documents)
- Country Page (8 documents)
- Legal Page (2 documents)
- Pricing Page (1 document)
- Contact Page (1 document)
- FAQ Page (1 document)

**Total: 15 documents across 6 document types**

### 2. Test Queries

Open Vision tab in Studio and run:

```groq
// All pages
*[_type == "page"]

// All country pages
*[_type == "countryPage"] | order(country.name asc)

// Legal pages
*[_type == "legalPage"]

// Other pages
*[_type in ["pricingPage", "contactPage", "faqPage"]]
```

---

## Troubleshooting

### Script Fails with "Unauthorized"

**Issue**: Missing or invalid write token

**Fix**:
```bash
# Check token is set
echo $SANITY_API_WRITE_TOKEN

# If empty, set it
export SANITY_API_WRITE_TOKEN="your_token_here"
```

### Script Fails with "Project not found"

**Issue**: Wrong project ID or no access

**Fix**:
1. Verify project ID in `sanity.config.ts` is `4de42y7s`
2. Ensure you're logged in with `withsoma.ai@gmail.com`
3. Check project permissions in Sanity dashboard

### TypeScript Errors

**Issue**: Type mismatches or import errors

**Fix**:
```bash
# Install dependencies
pnpm install

# Check TypeScript
npx tsc --noEmit
```

### Documents Not Appearing in Studio

**Issue**: Schema not registered or Studio cache

**Fix**:
1. Check `sanity/schemaTypes/index.ts` includes all schemas
2. Restart dev server
3. Hard refresh Studio (`Cmd/Ctrl + Shift + R`)

---

## Re-running Migrations

All scripts use `createOrReplace()`, so you can safely re-run them:

```bash
# This will update existing documents, not create duplicates
npx tsx scripts/migrate-countries-to-sanity.ts
```

**Note**: Any edits made in Studio will be overwritten. Export Studio content first if needed.

---

## Next Steps After Migration

1. **Update Route Files**: See docs for patterns
   - Country pages: `docs/COUNTRY_PAGES_MIGRATION.md`
   - Legal pages: `docs/MISC_PAGES_MIGRATION.md`
   - Pricing/Contact/FAQ: `docs/MISC_PAGES_MIGRATION.md`

2. **Test Locally**: Visit pages at:
   - http://localhost:3000/nigeria
   - http://localhost:3000/privacy
   - http://localhost:3000/pricing
   - etc.

3. **Deploy**: Once verified, push to production

4. **Train Team**: Share Studio access and editing guide

---

## Documentation

- **General Pages**: `docs/SANITY_MIGRATION_GUIDE.md`
- **Country Pages**: `docs/COUNTRY_PAGES_MIGRATION.md`
- **Misc Pages**: `docs/MISC_PAGES_MIGRATION.md`
- **Complete Summary**: `docs/SANITY_COMPLETE_SUMMARY.md`

---

## Script Maintenance

### Adding New Countries

Edit `scripts/migrate-countries-to-sanity.ts`:

```typescript
const countries = [
  // ... existing countries
  {
    _type: 'countryPage',
    _id: 'country-egypt',
    country: {
      name: 'Egypt',
      code: 'EG',
      flag: '🇪🇬',
      currency: 'EGP',
      phoneCode: '+20',
    },
    slug: { current: 'egypt', _type: 'slug' },
    // ... rest of country data
  }
]
```

Run script to add new country.

### Updating Legal Content

Edit `scripts/migrate-misc-pages-to-sanity.ts`:

```typescript
const legalPages = [
  // ... existing pages
  {
    _type: 'legalPage',
    _id: 'cookie-policy',
    title: 'Cookie Policy',
    slug: { current: 'cookies', _type: 'slug' },
    // ... content
  }
]
```

---

## Support

Questions? Check:
1. Documentation in `docs/` folder
2. Sanity docs: https://www.sanity.io/docs
3. Development team
4. GitHub issues

**Happy migrating! 🚀**
