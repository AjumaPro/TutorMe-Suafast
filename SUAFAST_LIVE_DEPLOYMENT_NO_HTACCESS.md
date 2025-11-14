# 🚀 Suafast.live Deployment - No .htaccess Required

## ✅ Build Package Ready

**File:** `suafast-cpanel-build.tar.gz`  
**Size:** Optimized (cache excluded)  
**Domain:** suafast.live  
**Status:** Ready for deployment

---

## 📦 What's Included

- ✅ `.next/` - Build output (cache excluded)
- ✅ `public/` - Static files
- ✅ `server.js` - Server entry point
- ✅ `package.json` - Dependencies
- ✅ `next.config.js` - Next.js configuration
- ❌ No `.htaccess` (to avoid conflicts)

---

## 🚀 Deployment Options for suafast.live

Since you can't use `.htaccess`, here are your options:

---

## Option 1: Direct Port Access (Easiest)

**Access via:** `suafast.live:PORT` (where PORT is your Node.js port)

### Steps:

1. **Upload Files:**
   - Upload `suafast-cpanel-build.tar.gz` to `public_html/`
   - Extract the archive

2. **Create Node.js App:**
   - Node.js Selector → Create Application
   - Application Root: `/home/username/public_html`
   - Application URL: `suafast.live`
   - Startup File: `server.js`
   - Note the port assigned (e.g., 3000, 3001)

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   NEXTAUTH_URL=https://suafast.live:PORT
   NEXT_PUBLIC_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-key
   NEXTAUTH_SECRET=your-secret
   PAYSTACK_SECRET_KEY=sk_live_...
   PORT=3000
   ```
   **Important:** Replace `PORT` with actual port number

4. **Install & Start:**
   - Run NPM Install
   - Start Application

5. **Access:**
   - `https://suafast.live:PORT` or `http://suafast.live:PORT`

**Pros:** Simple, no .htaccess needed  
**Cons:** Port number in URL

---

## Option 2: Subdirectory with Separate .htaccess

**Access via:** `suafast.live/app`

### Steps:

1. **Create Subdirectory:**
   ```bash
   # Via File Manager or SSH
   mkdir ~/public_html/app
   ```

2. **Upload Files:**
   - Upload to `public_html/app/`
   - Extract there

3. **Create `.htaccess` in `/app/` folder:**
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_URI} !^/socket.io/
   RewriteRule ^(.*)$ http://localhost:PORT/$1 [P,L]
   ```
   (This won't conflict with root .htaccess)

4. **Update `next.config.js`:**
   ```javascript
   const nextConfig = {
     basePath: '/app',
     reactStrictMode: true,
     images: {
       domains: ['localhost', 'res.cloudinary.com', 'suafast.live'],
     },
   }
   ```

5. **Rebuild:**
   ```bash
   npm run build
   ```

6. **Create Node.js App:**
   - Root: `/home/username/public_html/app`
   - URL: Configure as needed

7. **Environment:**
   ```
   NEXTAUTH_URL=https://suafast.live/app
   ```

**Access:** `https://suafast.live/app`

---

## Option 3: Node.js Selector Built-in Proxy

Some cPanel versions have built-in proxy in Node.js Selector.

### Steps:

1. **Create Node.js App** in Node.js Selector
2. **Look for "Proxy" or "Domain Mapping" option:**
   - Some versions allow direct domain mapping
   - Configure: `suafast.live` → Port mapping
3. **Enable if available:**
   - This handles reverse proxy automatically
   - No .htaccess needed

**Check:** Look for proxy/domain options in Node.js Selector interface

---

## Option 4: Contact Hosting for mod_proxy

If you need `suafast.live` without port:

1. **Contact Hosting Support:**
   - Ask them to enable `mod_proxy` for your account
   - Request reverse proxy setup for Node.js app

2. **Then you can:**
   - Use `.htaccess` in subdirectory
   - Or have them configure proxy at server level

---

## 📋 Recommended: Option 1 (Direct Port)

**For suafast.live, I recommend Option 1:**

1. ✅ Simple setup
2. ✅ No .htaccess conflicts
3. ✅ Works immediately
4. ✅ Just use port in URL

### Quick Setup:

1. **Upload & Extract** `suafast-cpanel-build.tar.gz` to `public_html/`
2. **Node.js Selector:**
   - Create Application
   - Root: `/home/username/public_html`
   - URL: `suafast.live`
   - Startup: `server.js`
3. **Note the port** (e.g., 3000)
4. **Environment Variables:**
   - `NEXTAUTH_URL=https://suafast.live:3000` (use actual port)
   - Add all other variables
5. **Install & Start**
6. **Access:** `https://suafast.live:3000`

---

## 🔧 Environment Variables for suafast.live

```
NODE_ENV=production
NEXTAUTH_URL=https://suafast.live:PORT  (replace PORT with actual port)
NEXT_PUBLIC_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-generated-secret
PAYSTACK_SECRET_KEY=sk_live_...
PORT=3000  (or whatever port is assigned)
```

---

## ✅ Deployment Checklist

- [ ] Files uploaded to `public_html/`
- [ ] Files extracted
- [ ] Node.js application created
- [ ] Port number noted
- [ ] Environment variables set (with correct port in NEXTAUTH_URL)
- [ ] Dependencies installed
- [ ] Application started
- [ ] Test: `suafast.live:PORT`

---

## 🎯 Quick Steps Summary

1. **Upload** `suafast-cpanel-build.tar.gz` to `public_html/`
2. **Extract** the archive
3. **Node.js Selector** → Create Application
4. **Note port** number
5. **Set environment variables** (use port in NEXTAUTH_URL)
6. **Install & Start**
7. **Access:** `suafast.live:PORT`

---

Your build package is ready! Upload it and follow Option 1 for the simplest deployment. 🚀

