# 🎮 Telegram Games Hub

منصة ألعاب تنافسية داخل تيليجرام

## الخطوات السريعة للنشر

### 1. احصل على Bot Token من @BotFather
### 2. انشر على Vercel:
```bash
npm install -g vercel
vercel login
npm install --legacy-peer-deps
vercel --prod
```

### 3. أضف في Vercel Dashboard (Settings > Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL=https://calbwuogyjoghtvyupqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhbGJ3dW9neWpvZ2h0dnl1cHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDY0MDEsImV4cCI6MjA5Mjg4MjQwMX0.QV2NFmKZyjVF-_BLn2gc9JBqVpZRP9rjvOUbahQovO0
TELEGRAM_BOT_TOKEN=TOKEN_من_BotFather
NEXT_PUBLIC_APP_URL=https://YOUR-APP.vercel.app
SETUP_SECRET=اختر_كلمة_سر
```

### 4. فعّل الـ Webhook:
```
https://YOUR-APP.vercel.app/api/setup?token=كلمة_السر
```

### 5. أضف البوت لمجموعتك واكتب /start
