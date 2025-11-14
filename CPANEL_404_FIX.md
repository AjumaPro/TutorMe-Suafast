# 🔧 Fix 404 Error on cPanel - Suafast

## Common Causes of 404 on cPanel

### 1. Application Not Started
**Check:**
- Go to Node.js Selector in cPanel
- Verify your application shows "Running" status
- If stopped, click "Start"

**Fix:**
```bash
# Via SSH
cd ~/public_html
pm2 start server.js --name suafast
# OR
npm run start
```

---

### 2. Wrong Port Configuration

**Problem:** Application running on wrong port or port not accessible

**Check:**
- In Node.js Selector, note the port assigned (e.g., 3000, 3001, etc.)
- Application might be on a different port than expected

**Fix:**
1. **Option A: Use Node.js Selector Port**
   - Access via: `http://suafast.live:PORT` (where PORT is assigned port)
   - Or configure reverse proxy (see below)

2. **Option B: Set Custom Port**
   - In Node.js Selector → Environment Variables
   - Add: `PORT=3000` (or your preferred port)
   - Restart application

3. **Option C: Configure Reverse Proxy**
   - Create `.htaccess` in `public_html/`:
   ```apache
   RewriteEngine On
   RewriteRule ^(.*)$ http://localhost:PORT/$1 [P,L]
   ```
   - Replace `PORT` with your Node.js app port

---

### 3. Missing .htaccess File

**Create `.htaccess` in `public_html/`:**

```apache
# Redirect all requests to Node.js app
RewriteEngine On

# Get the port from environment or use default
RewriteCond %{REQUEST_URI} !^/socket.io/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Or if using a subdomain/app folder
# RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Note:** Replace `3000` with your actual Node.js port from Node.js Selector

---

### 4. Wrong Application Root

**Check:**
- In Node.js Selector, verify "Application Root" points to correct folder
- Should be: `/home/username/public_html` (or your domain folder)

**Fix:**
- Update Application Root in Node.js Selector
- Restart application

---

### 5. Missing Environment Variables

**Required Variables:**
```
NODE_ENV=production
NEXTAUTH_URL=https://suafast.live
NEXT_PUBLIC_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
NEXTAUTH_SECRET=your-secret
PAYSTACK_SECRET_KEY=sk_live_...
PORT=3000
```

**Fix:**
- Set in Node.js Selector → Environment Variables
- Restart application after setting

---

### 6. Domain Not Pointing to Correct Directory

**Check:**
- In cPanel → Domains
- Verify `suafast.live` points to correct directory
- Should point to `public_html/` or your app folder

**Fix:**
- Update domain document root in cPanel
- Or move files to correct directory

---

### 7. Application in Subdirectory

**If app is in subdirectory (e.g., `public_html/app/`):**

**Option A: Move to Root**
```bash
# Move all files to public_html root
mv ~/public_html/app/* ~/public_html/
```

**Option B: Configure Base Path**
- Update `next.config.js`:
```javascript
const nextConfig = {
  basePath: '/app',  // If in subdirectory
  // ... rest of config
}
```
- Rebuild: `npm run build`

---

### 8. Missing Build Files

**Check:**
```bash
# Via SSH
cd ~/public_html
ls -la .next/
```

**Fix:**
- Ensure `.next/` folder is uploaded
- Re-upload if missing
- Rebuild if needed: `npm run build`

---

### 9. Node.js Version Mismatch

**Check:**
- Node.js Selector → Verify version is 18.x or higher

**Fix:**
- Update Node.js version in Node.js Selector
- Restart application

---

### 10. Application Crashed

**Check Logs:**
- In Node.js Selector → View Logs
- Or via SSH:
```bash
cd ~/public_html
tail -f app.log
# OR
pm2 logs suafast
```

**Common Errors:**
- Missing environment variables
- Database connection errors
- Port already in use
- Missing dependencies

**Fix:**
- Address errors in logs
- Restart application

---

## 🔍 Step-by-Step Troubleshooting

### Step 1: Verify Application is Running

1. Log into cPanel
2. Go to "Node.js Selector"
3. Find your application
4. Check status:
   - ✅ "Running" → Continue to Step 2
   - ❌ "Stopped" → Click "Start", then continue

### Step 2: Check Port Number

1. In Node.js Selector, note the port (e.g., 3000, 3001)
2. Try accessing: `http://suafast.live:PORT`
3. If it works → Need reverse proxy (Step 3)
4. If it doesn't → Check logs (Step 4)

### Step 3: Configure Reverse Proxy

**Create `.htaccess` in `public_html/`:**

```apache
RewriteEngine On

# Proxy to Node.js app (replace PORT with your actual port)
RewriteCond %{REQUEST_URI} !^/socket.io/
RewriteRule ^(.*)$ http://localhost:PORT/$1 [P,L]

# Enable proxy module (may need to contact hosting)
```

**Note:** Some hosting requires enabling `mod_proxy` - contact support if needed

### Step 4: Check Application Logs

**In Node.js Selector:**
- Click "View Logs" on your application
- Look for errors

**Via SSH:**
```bash
cd ~/public_html
tail -50 app.log
# OR
pm2 logs suafast --lines 50
```

### Step 5: Verify Files

```bash
# Via SSH
cd ~/public_html
ls -la
# Should see:
# - .next/
# - public/
# - server.js
# - package.json
# - next.config.js
```

### Step 6: Test Locally on Server

```bash
# Via SSH
cd ~/public_html
NODE_ENV=production node server.js
# Try accessing: http://localhost:PORT
# If works → Issue is with domain/proxy
# If doesn't → Check application errors
```

---

## ✅ Quick Fix Checklist

- [ ] Application is started in Node.js Selector
- [ ] Port number is noted and accessible
- [ ] `.htaccess` file exists with reverse proxy
- [ ] Environment variables are set
- [ ] All files are uploaded (`.next/`, `public/`, `server.js`, etc.)
- [ ] Dependencies installed (`npm install --production`)
- [ ] Node.js version is 18.x+
- [ ] Domain points to correct directory
- [ ] Application logs show no errors
- [ ] SSL certificate is installed (for HTTPS)

---

## 🚨 Most Common Fix

**90% of cases:** Application not started or wrong port

1. **Start Application:**
   - Node.js Selector → Click "Start"

2. **Check Port:**
   - Note the port number
   - Access via: `http://suafast.live:PORT`

3. **If port works, add reverse proxy:**
   - Create `.htaccess` with proxy rules
   - Access via: `http://suafast.live` (without port)

---

## 📞 Still Not Working?

1. **Check Application Logs:**
   ```bash
   # Via SSH
   cd ~/public_html
   tail -100 app.log
   ```

2. **Verify Server.js is Running:**
   ```bash
   ps aux | grep "node server.js"
   ```

3. **Test Direct Access:**
   ```bash
   curl http://localhost:PORT
   ```

4. **Contact Hosting Support:**
   - Ask about Node.js reverse proxy setup
   - Verify Node.js is properly configured
   - Check if mod_proxy is enabled

---

## 🎯 Expected Behavior

**When Working:**
- `http://suafast.live` → Shows homepage
- `http://suafast.live/dashboard` → Shows dashboard (if logged in)
- `http://suafast.live/auth/signin` → Shows login page

**If Getting 404:**
- Application not started → Start it
- Wrong port → Check port, configure proxy
- Missing files → Re-upload build files
- Wrong directory → Move files to correct location

---

Try these fixes in order. The most common issue is the application not being started or needing a reverse proxy configuration.

