# 🔐 How to Generate NEXTAUTH_SECRET

## Quick Method

### Option 1: Using OpenSSL (Recommended)

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (Git Bash or WSL):**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Option 2: Online Generator

Visit: https://generate-secret.vercel.app/32
- Click "Generate"
- Copy the secret

### Option 3: Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ Generated Secret (Ready to Use)

I've generated one for you:

```
WiiXZznsfi+EpL3y+aZpTzDdKkVRfzlev4EAvCA9FJ8=
```

**Copy this and use it as your NEXTAUTH_SECRET value**

---

## 📝 How to Use

1. **Copy the generated secret**
2. **In cPanel Node.js Selector:**
   - Environment Variables section
   - Name: `NEXTAUTH_SECRET`
   - Value: Paste the generated secret
   - Click "DONE"

---

## ⚠️ Important

- ✅ Use a long, random string (32+ characters)
- ✅ Keep it secret (don't share publicly)
- ✅ Use the same secret for production
- ✅ Don't change it after deployment (users will be logged out)

---

## 🔄 Generate New Secret

If you need a new one, run:
```bash
openssl rand -base64 32
```

---

**Use the secret above or generate a new one using any method above!**

