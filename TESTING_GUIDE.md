# AI Personalization System - Testing Guide

This guide will help you test the AI Personalization System implementation step by step.

## Prerequisites

1. **Database Migration Applied**: Make sure you've run the migration SQL in your Supabase console
2. **Environment Variables**: Ensure your `.env` file has the required configurations
3. **Dependencies Installed**: Run `npm install` in the backend directory

## Testing Steps

### Step 1: Run Basic Functionality Tests

```bash
cd backend
node test-ai-personalization.js
```

This will test all the core services without requiring database connections.

**Expected Output:**

- ✅ Interest validation and sanitization
- ✅ Mood and topic detection
- ✅ Personalized response generation
- ✅ Qloo service status and fallbacks
- ✅ Reward matching algorithms
- ✅ Patient model validation

### Step 2: Run Unit Tests

```bash
cd backend
npm test
```

This runs all the Jest unit tests for the services.

**Expected Results:**

- PersonalizationService: ~20 tests
- FallbackResponseService: ~25 tests
- QlooService: ~15 tests
- RewardService: ~20 tests
- Patient Model: ~15 tests
- AIService: ~10 tests

### Step 3: Test Database Migration

Run these SQL queries in your Supabase SQL Editor to verify the migration:

```sql
-- Test 1: Check if taste_keywords column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'taste_keywords';

-- Test 2: Test validation function
SELECT validate_interest_keywords('["cricket", "movies"]'::jsonb) as is_valid;

-- Test 3: Test sanitization function
SELECT sanitize_interest_keywords('["  CRICKET  ", "Movies", ""]'::jsonb) as sanitized;

-- Test 4: Test coupon matching function
SELECT * FROM find_matching_coupons_by_interests('["food", "entertainment"]'::jsonb, 3);
```

**Expected Results:**

1. Column exists with JSONB type and default '[]'
2. Validation returns `true`
3. Sanitization returns `["cricket", "movies"]`
4. Function executes without error (may return empty if no coupons match)

### Step 4: Test with Real Data

#### 4.1 Test Patient Interest Management

```sql
-- Insert a test patient (replace with actual patient_id)
UPDATE patients
SET taste_keywords = '["cricket", "movies", "music"]'::jsonb
WHERE patient_id = 'your-patient-id';

-- Verify the update
SELECT patient_id, taste_keywords
FROM patients
WHERE taste_keywords IS NOT NULL;
```

#### 4.2 Test Donor Interest Management

```sql
-- Update a test donor (replace with actual donor_id)
UPDATE donors
SET qloo_taste_keywords = '["food", "travel", "fitness"]'::jsonb
WHERE donor_id = 'your-donor-id';

-- Verify the update
SELECT donor_id, qloo_taste_keywords
FROM donors
WHERE qloo_taste_keywords IS NOT NULL;
```

### Step 5: Test API Integration (if you have API endpoints)

#### 5.1 Test PersonalizationService via API

```javascript
// Example API test (adjust endpoint as needed)
const testPersonalizationAPI = async () => {
  const response = await fetch("/api/patients/patient-id/interests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interests: ["cricket", "movies"] }),
  });

  console.log("Interest update:", await response.json());
};
```

#### 5.2 Test Chat with Personalization

```javascript
// Example chat test
const testPersonalizedChat = async () => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "patient-id",
      message: "I feel sad today",
    }),
  });

  console.log("Personalized response:", await response.json());
};
```

### Step 6: Test Qloo Integration (Optional)

If you have a Qloo API key:

1. Add to your `.env` file:

```env
QLOO_API_KEY=your-qloo-api-key
QLOO_API_URL=https://api.qloo.com/v1
```

2. Test Qloo integration:

```bash
node -e "
const QlooService = require('./src/services/QlooService');
QlooService.getTasteProfile(['cricket', 'movies'])
  .then(result => console.log('Qloo result:', result))
  .catch(err => console.log('Qloo error:', err.message));
"
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```
Error: Invalid API key or you do not have permission
```

**Solution**: Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`

#### 2. Migration Not Applied

```
Error: column "taste_keywords" does not exist
```

**Solution**: Run the migration SQL in Supabase console

#### 3. Function Not Found

```
Error: function validate_interest_keywords does not exist
```

**Solution**: Ensure all parts of the migration SQL were executed

#### 4. Import Errors

```
Error: Cannot find module './PersonalizationService'
```

**Solution**: Check file paths and ensure all files are created

### Performance Testing

#### Test Response Times

```javascript
const testPerformance = async () => {
  const start = Date.now();

  // Test personalized response generation
  const response = FallbackResponseService.getPersonalizedFallback(
    "I feel bored",
    ["cricket", "movies"],
    "patient"
  );

  const end = Date.now();
  console.log(`Response time: ${end - start}ms`);
  console.log(`Response length: ${response.length} chars`);
};
```

#### Test Database Query Performance

```sql
-- Test index performance
EXPLAIN ANALYZE
SELECT * FROM patients
WHERE taste_keywords @> '["cricket"]'::jsonb;

-- Should show index scan, not sequential scan
```

## Success Criteria

### ✅ Basic Functionality

- [ ] All services instantiate without errors
- [ ] Interest validation works correctly
- [ ] Mood detection identifies emotions
- [ ] Response generation produces relevant content
- [ ] Match scoring calculates correctly

### ✅ Database Integration

- [ ] Migration applied successfully
- [ ] Database functions work
- [ ] JSONB queries use indexes
- [ ] Interest data can be stored and retrieved

### ✅ Personalization Quality

- [ ] Responses mention user interests
- [ ] Mood-appropriate suggestions generated
- [ ] User type specific content included
- [ ] Response quality scores > 70

### ✅ Error Handling

- [ ] Graceful degradation when Qloo unavailable
- [ ] Fallback responses when LLM fails
- [ ] Database errors handled properly
- [ ] Invalid input rejected safely

### ✅ Performance

- [ ] Response generation < 3 seconds
- [ ] Database queries use indexes
- [ ] Memory usage reasonable
- [ ] No memory leaks in long-running tests

## Next Steps After Testing

1. **If tests pass**: Continue with remaining tasks (API controllers, frontend)
2. **If tests fail**: Review error messages and fix issues
3. **Performance issues**: Optimize queries and add caching
4. **Integration issues**: Check environment configuration

## Getting Help

If you encounter issues:

1. Check the console output for specific error messages
2. Verify all files are created in the correct locations
3. Ensure database migration was applied completely
4. Check environment variables are set correctly
5. Review the test output for clues about what's failing

The system is designed to be resilient, so most functionality should work even if external services (like Qloo) are unavailable.
