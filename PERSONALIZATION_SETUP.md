# Contentstack Personalization Setup Guide

## 🎯 Current Status

✅ **User UID Persistence** - Working perfectly  
✅ **Manifest Fetching** - Working perfectly  
✅ **User Attribute Setting** - Ready to work  
⚠️ **Event Tracking** - Needs events to be configured in Contentstack

## 🔧 Required Setup in Contentstack Personalize

### Step 1: Create Custom Events

You need to create these events in your Contentstack Personalize project:

1. **Log into Contentstack**
2. **Go to Personalize** → **Your Project**
3. **Click "Events"** in the left sidebar
4. **Click "Create Event"**
5. **Create these events:**

#### Event 1: Blog View
- **Event Key**: `blog_view`
- **Display Name**: `Blog View`
- **Description**: `User viewed a blog post`
- **Event Type**: `Custom Event`

#### Event 2: Newsletter Signup
- **Event Key**: `newsletter_signup`
- **Display Name**: `Newsletter Signup`
- **Description**: `User signed up for newsletter`
- **Event Type**: `Conversion Event`

### Step 2: Create Custom Attributes

Create these custom attributes for user tracking:

1. **Go to "Attributes"** in your Personalize project
2. **Create these attributes:**

#### User Email
- **Attribute Key**: `email`
- **Display Name**: `Email`
- **Data Type**: `String`
- **Description**: `User's email address`

#### Newsletter Subscriber
- **Attribute Key**: `newsletter_subscriber`
- **Display Name**: `Newsletter Subscriber`
- **Data Type**: `Boolean`
- **Description**: `Whether user is subscribed to newsletter`

#### Interest Attributes (Dynamic)
The app automatically creates interest attributes based on blog tags:
- **Pattern**: `[tag_name]` (clean, lowercase)
- **Examples**: 
  - `javascript` (for JavaScript tag)
  - `react` (for React tag)
  - `typescript` (for TypeScript tag)

You can create these manually or they'll be created automatically when users read tagged content.

## 🚀 What's Already Working

### ✅ User Identification
```javascript
// User gets unique ID automatically
User UID: 204bf19f-76c4-4631-9c79-c42ed80bc20c
```

### ✅ User Attributes
When you visit blog posts or sign up for newsletter, the app will set:
```javascript
{
  email: "user@example.com",
  newsletter_subscriber: true,
  javascript: true,
  react: true
}
```

### ✅ Graceful Degradation
Even if events fail, user attributes are still tracked!

## 🔍 Current Console Logs to Watch For

### Success Scenario (after event setup):
```javascript
🔮 PersonalizationAPI: Setting user attributes for blog tags: {javascript: true}
🔮 PersonalizationAPI: Successfully set user attributes for blog tags
🔮 PersonalizationAPI: Successfully tracked blog_view event
```

### Current Scenario (before event setup):
```javascript
🔮 PersonalizationAPI: Setting user attributes for blog tags: {javascript: true}
🔮 PersonalizationAPI: Successfully set user attributes for blog tags
🔮 PersonalizationAPI: Could not track blog_view event (may need to be configured in Contentstack)
```

## 📊 Once Events Are Set Up

You'll be able to:

1. **Create Audiences** based on:
   - Blog reading behavior (`blog_view` event)
   - Newsletter subscription (`newsletter_signup` event)
   - Interest attributes (`javascript`, `react`, etc.)

2. **Create Experiences** to show:
   - Personalized blog recommendations
   - Targeted newsletter CTAs
   - Interest-based content

3. **A/B Test** different:
   - Homepage layouts
   - Newsletter forms
   - Content recommendations

## 🎯 Next Steps

1. **Set up events in Contentstack** (see Step 1 above)
2. **Set up attributes in Contentstack** (see Step 2 above)
3. **Test the improved tracking** - you should see success messages
4. **Create your first audience** based on interest attributes
5. **Create your first experience** with personalized content

## 🆘 Troubleshooting

### Events Still Failing?
- Check event keys match exactly: `blog_view`, `newsletter_signup`
- Ensure events are published/active in Contentstack
- Verify your Project UID is correct

### Attributes Not Working?
- Check attribute keys match exactly: `email`, `newsletter_subscriber`, `javascript`, `react`, etc.
- Ensure attributes allow the correct data types

### User UID Issues?
- Check browser localStorage for `contentstack_personalize_user_uid`
- Clear localStorage and refresh to get new UID
- Check console for "User UID saved to localStorage" messages

## 📞 Support

If you need help with Contentstack Personalize setup, contact Contentstack support with:
- Your Project UID: `68906e9d6f1a09b09e9032b4`
- This integration guide
- Console logs showing the specific errors

---

**🚀 Your personalization foundation is ready! Just need the events configured in Contentstack to unlock full tracking capabilities.**