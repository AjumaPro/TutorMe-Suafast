# 🚨 cPanel Deployment Guide - Suafast

## ⚠️ Important: Next.js on cPanel

**Short Answer**: Next.js applications can work on cPanel, but **only if your cPanel hosting supports Node.js**.

---

## ✅ Requirements for cPanel

### Must Have:
1. **Node.js Support** - Your cPanel must have Node.js installed
2. **Node.js Version** - Node.js 18.x or higher
3. **PM2 or Process Manager** - To keep the app running
4. **Terminal/SSH Access** - To run npm commands

### Check Your cPanel:
1. Log into cPanel
2. Look for "Node.js" or "Node.js Selector" in the dashboard
3. If you see it → ✅ You can deploy Next.js
4. If you don't see it → ❌ You need a different hosting solution

---

## 🚀 Deployment Steps for cPanel with Node.js

### Step 1: Prepare Files

Upload these files/folders to your cPanel:

```
Required:
├── .next/              # Build output (upload this)
├── public/             # Static files
├── package.json        # Dependencies
├── server.js           # Server entry point
├── next.config.js      # Next.js config
└── node_modules/       # OR install on server

Optional:
├── .env.local          # Local env vars (or set in cPanel)
└── supabase/           # SQL files (for reference)
```

### Step 2: Upload to cPanel

1. **Via File Manager:**
   - Go to cPanel → File Manager
   - Navigate to your domain's public_html or subdomain folder
   - Upload all files

2. **Via FTP/SFTP:**
   - Use FileZilla or similar
   - Connect to your server
   - Upload files to public_html or subdomain folder

### Step 3: Install Dependencies

**Via SSH/Terminal:**
```bash
# Navigate to your app directory
cd ~/public_html  # or your domain folder

# Install dependencies
npm install --production
```

**Via cPanel Terminal (if available):**
- Open Terminal in cPanel
- Run the same commands

### Step 4: Set Environment Variables

**In cPanel:**
1. Go to "Node.js Selector" or "Environment Variables"
2. Add these variables:
   ```
   NEXTAUTH_URL=https://suafast.live
   NEXT_PUBLIC_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-key
   NEXTAUTH_SECRET=your-secret
   PAYSTACK_SECRET_KEY=sk_live_...
   ```

### Step 5: Start the Application

**Option A: Using Node.js Selector (Recommended)**
1. Go to "Node.js Selector" in cPanel
2. Select your Node.js version (18.x or higher)
3. Create a new application
4. Set:
   - Application root: `/home/username/public_html` (or your folder)
   - Application URL: `suafast.live` or subdomain
   - Application startup file: `server.js`
5. Click "Create"
6. Click "Run NPM Install"
7. Start the application

**Option B: Using PM2 (via SSH)**
```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start server.js --name suafast

# Save PM2 configuration
pm2 save

# Set PM2 to start on server reboot
pm2 startup
```

**Option C: Using nohup (Simple)**
```bash
nohup npm run start > app.log 2>&1 &
```

### Step 6: Configure Domain

1. **Point Domain to cPanel:**
   - Update DNS A record to point to cPanel server IP
   - Wait for DNS propagation (24-48 hours)

2. **Create Subdomain (Alternative):**
   - In cPanel → Subdomains
   - Create: `app.suafast.live`
   - Point to your application folder

---

## ⚠️ Common Issues & Solutions

### Issue 1: No Node.js in cPanel
**Solution**: 
- Contact your hosting provider to enable Node.js
- Or switch to a hosting provider that supports Node.js (Vercel, Railway, Render, etc.)

### Issue 2: Port Conflicts
**Solution**:
- cPanel Node.js apps typically run on custom ports
- Configure reverse proxy in cPanel
- Or use the port assigned by Node.js Selector

### Issue 3: Build Files Too Large
**Solution**:
- Don't upload `node_modules/` - install on server
- Use `.gitignore` to exclude unnecessary files
- Compress before upload, extract on server

### Issue 4: App Stops After SSH Disconnect
**Solution**:
- Use PM2 or Node.js Selector (keeps app running)
- Don't use `npm run start` directly in SSH

### Issue 5: Environment Variables Not Working
**Solution**:
- Set in cPanel Node.js Selector
- Or create `.env.local` file in app root
- Restart application after setting variables

---

## 🎯 Recommended: Alternative Hosting

If your cPanel doesn't support Node.js, consider:

### 1. **Vercel** (Best for Next.js) ⭐
- Free tier available
- Automatic deployments
- Built-in SSL
- Perfect for Next.js
- **Recommended for suafast.live**

### 2. **Railway**
- Easy deployment
- Good for Node.js apps
- Free tier available

### 3. **Render**
- Free tier available
- Good Node.js support
- Easy setup

### 4. **DigitalOcean App Platform**
- Paid but reliable
- Good Node.js support

### 5. **AWS/Google Cloud**
- More complex setup
- Enterprise-grade

---

## 📋 cPanel Deployment Checklist

If your cPanel supports Node.js:

- [ ] Node.js 18.x+ installed in cPanel
- [ ] Files uploaded to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Environment variables set
- [ ] Application started via Node.js Selector or PM2
- [ ] Domain/DNS configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Application accessible at suafast.live
- [ ] Paystack webhook configured
- [ ] Test payment flow

---

## 🔍 How to Check if Your cPanel Supports Node.js

1. **Log into cPanel**
2. **Look for these:**
   - "Node.js Selector"
   - "Node.js Version Manager"
   - "Setup Node.js App"
   - "Node.js" in Software section

3. **If you see any of these** → ✅ You can deploy Next.js

4. **If you don't see any** → ❌ You need:
   - Contact hosting provider to enable Node.js
   - Or switch to a Node.js-friendly hosting provider

---

## 💡 Recommendation

**For suafast.live, I recommend:**

1. **Vercel** (Easiest, best for Next.js)
   - Free tier
   - Automatic SSL
   - Easy deployment
   - Perfect Next.js support

2. **If you must use cPanel:**
   - Verify Node.js support first
   - Use Node.js Selector if available
   - Or use PM2 via SSH
   - Configure reverse proxy for port

---

## 🚨 Important Notes

1. **Traditional cPanel (PHP-only)** won't work
   - Next.js requires Node.js runtime
   - PHP hosting can't run Node.js apps

2. **Shared Hosting Limitations:**
   - May have resource limits
   - May not allow long-running processes
   - Check with your hosting provider

3. **Better Alternatives:**
   - Vercel is specifically designed for Next.js
   - Free tier is generous
   - Much easier deployment
   - Better performance

---

## 📞 Next Steps

1. **Check your cPanel** for Node.js support
2. **If yes** → Follow deployment steps above
3. **If no** → Consider Vercel or other Node.js hosting
4. **For suafast.live** → Vercel is highly recommended

---

## ✅ Quick Answer

**Will it work on cPanel?**
- ✅ **YES** - If cPanel has Node.js support
- ❌ **NO** - If cPanel is PHP-only

**Best Option:**
- 🎯 **Vercel** - Specifically designed for Next.js, free, easy

Would you like help checking if your cPanel supports Node.js, or setting up deployment on Vercel instead?

