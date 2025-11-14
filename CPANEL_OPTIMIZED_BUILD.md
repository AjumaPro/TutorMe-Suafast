# 📦 Optimized cPanel Build Package

## ✅ Optimized Build Created

**Package**: `suafast-cpanel-build.tar.gz`  
**Optimization**: Excluded cache files, source maps, and logs  
**Size**: Reduced from original build

---

## 📁 What's Included (Optimized)

### Required Files:
```
✓ .next/              (Build output - cache excluded)
✓ public/             (Static files)
✓ server.js           (Server entry point)
✓ package.json        (Dependencies)
✓ next.config.js      (Next.js config)
```

### Excluded (to reduce size):
```
✗ .next/cache/        (Regenerated on server)
✗ .next/trace         (Build trace file)
✗ *.map               (Source maps - not needed)
✗ *.log               (Log files)
✗ node_modules/        (Install on server)
```

---

## 🚀 Deployment Steps

### Step 1: Upload to cPanel

**Via File Manager:**
1. Log into cPanel
2. Open File Manager
3. Navigate to `public_html/` (or your domain folder)
4. Upload `suafast-cpanel-build.tar.gz`
5. Extract the archive:
   - Right-click → Extract
   - Or use: `tar -xzf suafast-cpanel-build.tar.gz`

**Via FTP/SFTP:**
1. Upload `suafast-cpanel-build.tar.gz`
2. Extract via SSH:
   ```bash
   cd ~/public_html
   tar -xzf suafast-cpanel-build.tar.gz
   ```

### Step 2: Setup Node.js Application

1. In cPanel → "Node.js Selector" or "Setup Node.js App"
2. Create Application:
   - Node.js Version: 18.x+
   - Application Root: `/home/username/public_html`
   - Application URL: `suafast.live`
   - Startup File: `server.js`
3. Click "Create"

### Step 3: Install Dependencies

**In Node.js Selector:**
- Click "Run NPM Install"

**OR via SSH:**
```bash
cd ~/public_html
npm install --production
```

### Step 4: Set Environment Variables

**In Node.js Selector → Environment Variables:**
```
NODE_ENV=production
NEXTAUTH_URL=https://suafast.live
NEXT_PUBLIC_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-generated-secret
PAYSTACK_SECRET_KEY=sk_live_...
PORT=3000
```

### Step 5: Start Application

**In Node.js Selector:**
- Click "Start" or "Restart"

**OR via SSH with PM2:**
```bash
npm install -g pm2
pm2 start server.js --name suafast
pm2 save
```

---

## 📊 Size Comparison

**Original Build**: ~333 MB (uncompressed)  
**Optimized Package**: Reduced size (cache excluded)  
**Compressed**: `suafast-cpanel-build.tar.gz` (smaller file)

---

## ⚠️ Important Notes

1. **Cache will regenerate** on first run (normal)
2. **Source maps excluded** (not needed for production)
3. **Logs excluded** (will be created on server)
4. **node_modules not included** (install on server)

---

## ✅ Verification

After deployment, verify:
- [ ] Application starts successfully
- [ ] No missing module errors
- [ ] Environment variables are set
- [ ] Application accessible at suafast.live
- [ ] SSL certificate installed
- [ ] Paystack webhook configured

---

## 🔧 If Issues Occur

**Missing files error:**
- Cache will auto-regenerate on first run
- This is normal and expected

**Module errors:**
- Run: `npm install --production`
- Verify `package.json` is present

**Build errors:**
- Check Node.js version (needs 18.x+)
- Verify all files extracted correctly

---

## 📦 Package Contents

The optimized package includes:
- ✅ All production build files
- ✅ Static assets
- ✅ Server configuration
- ✅ Application entry point

Excludes:
- ❌ Development files
- ❌ Cache files (regenerated)
- ❌ Source maps
- ❌ Log files
- ❌ node_modules

---

Your optimized build is ready for cPanel deployment! 🚀

