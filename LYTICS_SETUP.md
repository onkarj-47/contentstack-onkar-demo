# 🎯 Lytics + Pathfora Integration Setup Guide

## 🔧 Environment Variables

Add these to your `.env.local` file:

```bash
# Existing Contentstack Configuration
NEXT_PUBLIC_CONTENTSTACK_API_KEY=your_api_key_here
NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token_here
NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT=your_environment_here
NEXT_PUBLIC_CONTENTSTACK_REGION=EU
NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_PROJECT_UID=your_personalization_project_uid_here

# NEW: Lytics Configuration
NEXT_PUBLIC_LYTICS_ACCOUNT_ID=880b1840768b4b500cd86076f03fff3f
NEXT_PUBLIC_LYTICS_JS_TOKEN=your_lytics_js_token_here
NEXT_PUBLIC_PATHFORA_ENABLED=true
LYTICS_API_KEY=your_lytics_api_key_here
```

## 🎯 Lytics Dashboard Setup Required

### 1. Get Your Lytics Tokens

Go to your Lytics dashboard:
1. **Settings** → **API Keys** 
2. Copy your **JavaScript Token** → Add to `NEXT_PUBLIC_LYTICS_JS_TOKEN`
3. Copy your **API Key** → Add to `LYTICS_API_KEY`

### 2. Configure Data Schema

#### User Attributes:
Create these in **Data** → **Schema** → **User Attributes**:

```yaml
email: string - "User email address"
interests: array - "User content interests" 
engagement_score: number - "User engagement rating 0-100"
contentstack_uid: string - "Contentstack user ID"
primary_interest: string - "Top user interest"
skill_level: string - "beginner|intermediate|advanced"
```

#### Event Schema:
Create these in **Data** → **Schema** → **Events**:

```yaml
blog_engagement:
  - content_uid (string)
  - content_title (string) 
  - content_tags (array)
  - read_time_seconds (number)
  - completion_percentage (number)

newsletter_signup:
  - email (string)
  - source (string)
  - signup_timestamp (datetime)

interest_interaction:
  - interest (string)
  - action (string)
  - page_context (string)
```

### 3. Create Audience Segments

#### JavaScript Developers:
```sql
SELECT user FROM user 
WHERE (
  interests CONTAINS "javascript" OR
  interests CONTAINS "react" OR 
  interests CONTAINS "typescript"
) AND (
  blog_engagement.read_time_seconds > 30 AND
  page_view.count > 2
)
```

#### High Engagement Users:
```sql
SELECT user FROM user
WHERE engagement_score > 80
AND page_view.count > 10
AND blog_engagement.completion_percentage > 70
```

#### Newsletter Subscribers:
```sql
SELECT user FROM user
WHERE newsletter_signup.email IS NOT NULL
AND last_visit > (NOW() - INTERVAL 30 DAY)
```

### 4. Pathfora Campaign Setup

Go to **Experiences** → **Pathfora** → **Create Campaign**:

#### Campaign 1: Developer Welcome
```yaml
Name: "JavaScript Developer Personalization"
Type: "Content Recommendation"
Trigger: Page Load
Audience: "JavaScript Developers"

Widget Settings:
  Layout: "Slideout"
  Position: "Bottom Right"
  Headline: "🚀 JavaScript Content for You"
  Message: "Discover latest JS articles and tutorials"
  CTA: "Explore Now"
```

#### Campaign 2: Newsletter Signup
```yaml
Name: "Smart Newsletter Signup"
Trigger: "Exit Intent" OR "3+ Page Views"
Audience: "Non-subscribers with high engagement"

Widget:
  Layout: "Modal"
  Headline: "Stay in the Loop!"
  Message: "Get personalized content delivered weekly"
  Form: Email input
  CTA: "Subscribe Now"
```

## 🚀 What This Integration Provides

### ✅ Enhanced Tracking:
- **Dual tracking**: Events go to both Contentstack and Lytics
- **Cross-session persistence**: Lytics maintains user profiles
- **Advanced segmentation**: Dynamic audience creation
- **Behavioral analytics**: Deep user journey insights

### ✅ Dynamic Personalization:
- **Pathfora widgets**: Real-time personalized overlays
- **Interest-based recommendations**: Enhanced by Lytics segments
- **Exit-intent campaigns**: Smart user retention
- **A/B testing**: Built-in optimization

### ✅ Audience Insights:
- **Segment analytics**: Who are your users?
- **Content performance**: What resonates with each segment?
- **User journey mapping**: Complete cross-session behavior
- **Predictive insights**: Who's likely to convert?

## 🔍 Testing Your Setup

### 1. Check Console Logs:
```bash
🎯 Lytics Integration: Initialized successfully
🎨 Pathfora: Initialized successfully  
🔀 Hybrid: User data synced successfully
```

### 2. Verify Data Flow:
1. Visit homepage → Check Lytics dashboard for page_view event
2. Read a blog post → Check for blog_engagement event
3. Sign up for newsletter → Check for newsletter_signup event
4. Check **Real-time** tab in Lytics for live data

### 3. Test Pathfora Widgets:
1. Browse 2+ pages → Should see interest-based widget
2. Try exit intent → Should see retention widget  
3. High engagement users → Should see premium content offers

## 🛠️ Troubleshooting

### No Lytics Data?
- Check `NEXT_PUBLIC_LYTICS_ACCOUNT_ID` matches your dashboard
- Verify JavaScript token in `NEXT_PUBLIC_LYTICS_JS_TOKEN`
- Check browser console for JavaScript errors

### Pathfora Not Showing?
- Ensure `NEXT_PUBLIC_PATHFORA_ENABLED=true`
- Check if you've dismissed widgets recently (localStorage)
- Verify audience segments are active in Lytics

### Hybrid Tracking Issues?
- Check both Contentstack and Lytics console logs
- Verify environment variables for both systems
- Test individual systems separately first

## 🎯 Your Hybrid Architecture

```
User Interaction
       ↓
   Hybrid Manager
       ↓
  ┌─────────────┬─────────────┐
  ↓             ↓             ↓
Contentstack   Lytics    Pathfora
Personalize     CDP      Widgets
  ↓             ↓             ↓
Content      Analytics   Dynamic
Delivery     & Segments  Experiences
```

**Result**: Enhanced personalization that combines the best of both platforms! 🚀
