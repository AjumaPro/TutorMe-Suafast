# 📦 cPanel Deployment Package - Suafast

## ✅ Build Status: Ready for cPanel

Your application has been built and is ready for cPanel deployment.

---

## 📁 Files to Upload to cPanel

### Required Files & Folders:

```
suafast/
├── .next/                    # ✅ Build output (REQUIRED)
├── public/                   # ✅ Static files (images, etc.)
├── server.js                 # ✅ Server entry point
├── package.json              # ✅ Dependencies list
├── next.config.js            # ✅ Next.js configuration
└── node_modules/             # ⚠️ Install on server (don't upload)
```

### Optional Files:
```
├── .env.local                # ⚠️ Set in cPanel, don't upload
├── supabase/                 # SQL migration files (reference)
└── README.md                 # Documentation
```

---

## 🚀 Step-by-Step cPanel Deployment

### Step 1: Prepare Files Locally

**Option A: Upload via File Manager**
- Compress files (zip/tar.gz)
- Upload to cPanel

**Option B: Upload via FTP/SFTP**
- Use FileZilla or similar
- Upload files directly

**Files to Upload:**
```bash
# From your project directory
- .next/          (entire folder)
- public/          (entire folder)
- server.js
- package.json
- next.config.js
```

**DO NOT Upload:**
- `node_modules/` (too large, install on server)
- `.env` files (set in cPanel)
- `.git/` folder

### Step 2: Upload to cPanel

1. **Log into cPanel**
2. **Open File Manager**
3. **Navigate to your domain folder:**
   - `public_html/` (for main domain)
   - `public_html/subdomain/` (for subdomain)
4. **Upload files:**
   - Upload `.next/` folder
   - Upload `public/` folder
   - Upload `server.js`
   - Upload `package.json`
   - Upload `next.config.js`

### Step 3: Install Node.js (if not already installed)

1. **Check for Node.js in cPanel:**
   - Look for "Node.js Selector" or "Setup Node.js App"
   - If you see it → ✅ Node.js is available
   - If not → Contact hosting provider

2. **Create Node.js Application:**
   - Go to "Node.js Selector" or "Setup Node.js App"
   - Click "Create Application"
   - Set:
     - **Node.js Version**: 18.x or higher
     - **Application Root**: `/home/username/public_html` (or your folder)
     - **Application URL**: `suafast.live` or subdomain
     - **Application Startup File**: `server.js`
   - Click "Create"

### Step 4: Install Dependencies

**Via Node.js Selector:**
1. Find your application
2. Click "Run NPM Install"
3. Wait for installation to complete

**Via SSH/Terminal:**
```bash
# Navigate to your app directory
cd ~/public_html  # or your domain folder

# Install production dependencies
npm install --production
```

### Step 5: Set Environment Variables

**In Node.js Selector:**
1. Find your application
2. Click "Edit" or "Environment Variables"
3. Add these variables:

```bash
NODE_ENV=production
NEXTAUTH_URL=https://suafast.live
NEXT_PUBLIC_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-generated-secret
PAYSTACK_SECRET_KEY=sk_live_...
PORT=3000
```

**Or create `.env.local` file:**
1. In File Manager, create `.env.local` in your app root
2. Add all environment variables
3. Save file

### Step 6: Start the Application

**Via Node.js Selector:**
1. Find your application
2. Click "Start" or "Restart"
3. Application should start on assigned port

**Via SSH (Alternative):**
```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start server.js --name suafast
pm2 save
pm2 startup

# Or using nohup
nohup npm run start > app.log 2>&1 &
```

### Step 7: Configure Domain & Port

**If using Node.js Selector:**
- Port is automatically assigned
- Configure reverse proxy if needed
- Or access via: `http://suafast.live:PORT`

**If using custom port:**
- Configure reverse proxy in cPanel
- Or update DNS to point to server IP with port

### Step 8: Configure SSL (HTTPS)

1. **In cPanel:**
   - Go to "SSL/TLS Status"
   - Select your domain
   - Click "Run AutoSSL"
   - Or install Let's Encrypt certificate

2. **Update NEXTAUTH_URL:**
   - Change to `https://suafast.live`
   - Restart application

---

## 📋 Quick Deployment Checklist

- [ ] Files uploaded to cPanel
- [ ] Node.js application created
- [ ] Dependencies installed (`npm install --production`)
- [ ] Environment variables set
- [ ] Application started
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] Application accessible at suafast.live
- [ ] Test payment flow
- [ ] Configure Paystack webhook

---

## 🔧 Troubleshooting

### Issue: Application won't start
**Solution:**
- Check Node.js version (needs 18.x+)
- Check environment variables are set
- Check logs in Node.js Selector
- Verify `server.js` is in correct location

### Issue: Port conflicts
**Solution:**
- Use port assigned by Node.js Selector
- Configure reverse proxy
- Or use different port in `.env.local`

### Issue: Module not found errors
**Solution:**
- Run `npm install --production` again
- Check `package.json` is uploaded
- Verify `node_modules/` exists

### Issue: Environment variables not working
**Solution:**
- Set in Node.js Selector (recommended)
- Or create `.env.local` file
- Restart application after setting

### Issue: Application stops after SSH disconnect
**Solution:**
- Use Node.js Selector (keeps running)
- Or use PM2: `pm2 start server.js --name suafast`

---

## 📊 File Sizes (Approximate)

- `.next/` folder: ~333 MB
- `public/` folder: Varies (images, etc.)
- `node_modules/` (after install): ~200-300 MB

**Total**: ~500-600 MB (without node_modules)

---

## 🎯 Recommended: Use Node.js Selector

**Best Method for cPanel:**
1. Use "Node.js Selector" in cPanel
2. Creates application automatically
3. Manages environment variables
4. Keeps app running
5. Easy to restart/stop

---

## ⚠️ Important Notes

1. **Don't upload `node_modules/`**
   - Too large (200-300 MB)
   - Install on server instead

2. **Set environment variables in cPanel**
   - Don't commit `.env` files
   - Use Node.js Selector or `.env.local`

3. **Keep application running**
   - Use Node.js Selector or PM2
   - Don't use `npm run start` directly in SSH

4. **Check hosting limits**
   - Some shared hosting has resource limits
   - May need VPS or dedicated server for production

---

## 🚀 Alternative: If cPanel Doesn't Support Node.js

If your cPanel doesn't have Node.js support:

1. **Contact hosting provider** to enable Node.js
2. **Or switch to:**
   - Vercel (Best for Next.js) ⭐
   - Railway
   - Render
   - DigitalOcean App Platform

---

## ✅ Your Build is Ready!

**Build Location**: `/Users/newuser/TutorMe/.next/`  
**Build Status**: ✅ Success  
**Ready for**: cPanel deployment  

Follow the steps above to deploy to cPanel!

---

## 📞 Need Help?

1. Check cPanel documentation
2. Contact your hosting provider
3. Review application logs in Node.js Selector
4. Check error logs in cPanel

Good luck with your deployment! 🎉

