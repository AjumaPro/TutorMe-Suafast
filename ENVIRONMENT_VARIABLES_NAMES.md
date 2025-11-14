# 📝 Environment Variable Names - Quick Reference

## What to Enter in the "Name" Field

For each row, enter **ONLY the variable name** (without the value).

---

## ✅ Complete List:

### Row 1:
**Name field:** `NODE_ENV`  
**Value field:** `production`

### Row 2:
**Name field:** `NEXTAUTH_URL`  
**Value field:** `https://suafast.live`  
(Or `https://app.suafast.live` if using subdomain)

### Row 3:
**Name field:** `NEXT_PUBLIC_SUPABASE_URL`  
**Value field:** `https://ptjnlzrvqyynklzdipac.supabase.co`

### Row 4:
**Name field:** `SUPABASE_SERVICE_ROLE_KEY`  
**Value field:** `your-actual-service-role-key-here`  
(Get this from Supabase dashboard → Settings → API → service_role key)

### Row 5:
**Name field:** `NEXTAUTH_SECRET`  
**Value field:** `your-generated-secret-here`  
(Generate with: `openssl rand -base64 32`)

### Row 6:
**Name field:** `PAYSTACK_SECRET_KEY`  
**Value field:** `sk_live_...`  
(Your live Paystack secret key)

---

## 📋 Quick Copy-Paste List:

Copy these into the **Name** field (one per row):

```
NODE_ENV
NEXTAUTH_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_SECRET
PAYSTACK_SECRET_KEY
```

---

## ⚠️ Important Notes:

1. **Name = Variable name only** (no spaces, no equals sign)
2. **Value = The actual value** (what you see in the grey boxes)
3. **No quotes needed** in either field
4. **Case sensitive** - use exact capitalization shown

---

## 🔍 How to Fill Each Row:

1. **Click in the "Name" field** (red border)
2. **Type the variable name** (e.g., `NODE_ENV`)
3. **The "Value" field** should already show the value
4. **If Value is wrong**, click it and edit
5. **Click "DONE"** to save that variable
6. **Repeat for each row**

---

## ✅ Example:

**Row 1:**
- Name: `NODE_ENV`
- Value: `production`
- Click "DONE"

**Row 2:**
- Name: `NEXTAUTH_URL`
- Value: `https://suafast.live`
- Click "DONE"

**Continue for all 6 rows...**

---

After filling all Name fields and verifying Values, click "DONE" for each row, then proceed with creating the application!

