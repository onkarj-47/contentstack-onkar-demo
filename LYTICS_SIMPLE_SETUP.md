# 🎯 Simple Lytics Setup (One Token Solution)

## 🚨 If You Only Have One Lytics Token

Don't worry! Many Lytics accounts work with a single token. Here's the simplified setup:

### 📋 Environment Variables (.env.local)

```bash
# Your existing Contentstack config
NEXT_PUBLIC_CONTENTSTACK_API_KEY=your_api_key_here
NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token_here
NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT=your_environment_here
NEXT_PUBLIC_CONTENTSTACK_REGION=EU
NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_PROJECT_UID=your_personalization_project_uid_here

# Lytics - Simplified Setup
NEXT_PUBLIC_LYTICS_ACCOUNT_ID=880b1840768b4b500cd86076f03fff3f
LYTICS_API_KEY=your_single_lytics_token_here
NEXT_PUBLIC_PATHFORA_ENABLED=true

# Leave JS Token empty - system will use API key
# NEXT_PUBLIC_LYTICS_JS_TOKEN=
```

### 🔑 Where to Get Your Token

In your Lytics dashboard:
1. **Security → Access Tokens**
2. **Create New Token** with these settings:
   ```yaml
   Name: "Insight Hub Integration"
   Description: "Full access for blog personalization"
   Expiration: "No expiration"
   Roles: "All necessary permissions"
   ```
3. **Copy the generated token** → Use it for `LYTICS_API_KEY`

### 🧪 Test Your Setup

```bash
npm run dev
```

**Check browser console for:**
```bash
✅ 🎯 Lytics Integration: Initialized successfully
✅ 🎨 Pathfora: Initialized successfully
✅ 🔀 Hybrid: User data synced successfully
```

### 🎯 Alternative: Try Without Any Token First

If you're having trouble with tokens, temporarily test the basic integration:

```bash
# .env.local - Minimal setup
NEXT_PUBLIC_LYTICS_ACCOUNT_ID=880b1840768b4b500cd86076f03fff3f
NEXT_PUBLIC_PATHFORA_ENABLED=true

# Leave tokens empty for now
# LYTICS_API_KEY=
# NEXT_PUBLIC_LYTICS_JS_TOKEN=
```

This will:
- ✅ Initialize the Lytics tracking (basic)
- ✅ Enable Pathfora widgets
- ✅ Show how the integration works
- ⚠️ Limited functionality without tokens

### 🔍 Troubleshooting

#### No Token at All?
- Some Lytics accounts work with just Account ID
- The integration will attempt basic tracking
- Pathfora may still work for widget display

#### Still Getting Errors?
1. Check Account ID is correct: `880b1840768b4b500cd86076f03fff3f`
2. Verify Lytics account is active
3. Try creating a new token with "All Permissions"
4. Contact Lytics support with your Account ID

### 🎯 What Will Work

Even without tokens, you'll get:
- ✅ Hybrid personalization manager
- ✅ Contentstack personalization (existing)
- ✅ Interest tracking (local)
- ✅ Smart recommendations
- ✅ Basic Pathfora widgets (if account allows)

### 🚀 Next Steps

1. **Try the minimal setup first**
2. **Get console logs working**
3. **Add token when available**
4. **Test full functionality**

**The integration is designed to gracefully degrade - it will work even with limited Lytics access!** 🎯
