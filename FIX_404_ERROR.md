# 🔧 Fix 404 Error - Suafast Application

## Common Causes of 404 Errors

### 1. Application Not Running
**Check:**
- Is the Node.js application started in cPanel?
- Check Node.js Selector → Is app status "Running"?
- Check application logs for errors

**Fix:**
```bash
# In Node.js Selector, click "Start" or "Restart"
# OR via SSH:
pm2 restart suafast
# OR:
npm run start
```

---

### 2. Wrong Port Configuration
**Check:**
- What port is the application running on?
- Is the port accessible?
- Is there a reverse proxy configured?

**Fix:**
- Check Node.js Selector for assigned port
- Access via: `http://suafast.live:PORT` (if direct port access)
- Or configure reverse proxy in cPanel

---

### 3. Domain/DNS Not Configured
**Check:**
- Is DNS pointing to correct server?
- Is domain configured in cPanel?
- Is subdomain set up correctly?

**Fix:**
- Verify DNS A record points to cPanel server IP
- Check domain in cPanel → Domains
- Wait for DNS propagation (24-48 hours)

---

### 4. Build Files Missing or Corrupted
**Check:**
- Are `.next/` files uploaded correctly?
- Is `server.js` in the correct location?
- Are files extracted properly?

**Fix:**
```bash
# Verify files exist
ls -la .next/
ls -la server.js
ls -la package.json

# Re-extract if needed
tar -xzf suafast-cpanel-build.tar.gz
```

---

### 5. Environment Variables Not Set
**Check:**
- Are environment variables configured?
- Is `NEXTAUTH_URL` set correctly?
- Check Node.js Selector → Environment Variables

**Fix:**
Set in Node.js Selector:
```
NODE_ENV=production
NEXTAUTH_URL=https://suafast.live
PORT=3000
```

---

### 6. Next.js Routing Issues
**Check:**
- Is the build complete?
- Are routes properly configured?
- Check application logs

**Fix:**
```bash
# Rebuild if needed
npm run build

# Check build output
ls -la .next/server/app/
```

---

## 🔍 Diagnostic Steps

### Step 1: Check Application Status
```bash
# Via SSH
pm2 list
# OR
ps aux | grep node

# In cPanel Node.js Selector
- Check application status
- View logs
```

### Step 2: Check Application Logs
```bash
# In Node.js Selector → View Logs
# OR via SSH:
pm2 logs suafast
# OR:
tail -f app.log
```

### Step 3: Test Application Locally
```bash
# SSH into server
cd ~/public_html
npm run start

# Test locally
curl http://localhost:3000
```

### Step 4: Verify Files
```bash
# Check required files exist
ls -la .next/
ls -la server.js
ls -la package.json
ls -la next.config.js
```

### Step 5: Check Port and URL
```bash
# What port is app running on?
# Check Node.js Selector for port number
# Or check .env.local for PORT variable
```

---

## 🚀 Quick Fixes

### Fix 1: Restart Application
1. Go to cPanel → Node.js Selector
2. Find your application
3. Click "Stop"
4. Click "Start"
5. Wait 30 seconds
6. Try accessing site again

### Fix 2: Rebuild Application
```bash
# Via SSH
cd ~/public_html
npm run build
pm2 restart suafast
```

### Fix 3: Check File Permissions
```bash
# Via SSH
chmod 755 server.js
chmod -R 755 .next/
chmod -R 755 public/
```

### Fix 4: Verify Environment Variables
1. Node.js Selector → Your App → Environment Variables
2. Verify all required variables are set:
   - `NODE_ENV=production`
   - `NEXTAUTH_URL=https://suafast.live`
   - `PORT=3000` (or assigned port)
3. Restart application

### Fix 5: Check Reverse Proxy
If using reverse proxy:
1. cPanel → Apache Handlers or .htaccess
2. Configure proxy to Node.js port
3. Example `.htaccess`:
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## 📋 Checklist

- [ ] Application is running (Node.js Selector shows "Running")
- [ ] All files uploaded and extracted correctly
- [ ] `server.js` exists and is executable
- [ ] `.next/` folder exists with build files
- [ ] Environment variables are set
- [ ] Port is accessible
- [ ] DNS is pointing correctly
- [ ] Domain is configured in cPanel
- [ ] SSL certificate is installed (if using HTTPS)
- [ ] Application logs show no errors

---

## 🔧 Common Error Messages

### "Cannot GET /"
- **Cause**: Application not running or wrong port
- **Fix**: Start application in Node.js Selector

### "404 Not Found"
- **Cause**: Route doesn't exist or build incomplete
- **Fix**: Rebuild application: `npm run build`

### "Connection Refused"
- **Cause**: Application not running on that port
- **Fix**: Check port and start application

### "Module Not Found"
- **Cause**: Dependencies not installed
- **Fix**: Run `npm install --production`

---

## 📞 Need More Help?

1. **Check Application Logs:**
   - Node.js Selector → View Logs
   - Look for error messages

2. **Test Locally:**
   - SSH into server
   - Run `npm run start`
   - Check what port it starts on

3. **Verify Build:**
   - Check `.next/` folder exists
   - Verify `server.js` is in root
   - Check `package.json` is present

4. **Contact Support:**
   - Check hosting provider documentation
   - Review cPanel Node.js documentation
   - Check Next.js deployment docs

---

## ✅ Expected Behavior

When working correctly:
- Application starts without errors
- Logs show: "Ready on http://localhost:PORT"
- Homepage loads at `/`
- Routes work correctly
- No 404 errors on main pages

---

Share the error logs or what you see, and I can help diagnose further!

