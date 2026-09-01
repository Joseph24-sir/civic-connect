# Civic Connect Feature Quick Reference

## 🎯 Feature Overview

| Feature | Component | Button | Keyboard | Real-Time |
|---------|-----------|--------|----------|-----------|
| 👤 User Profiles | `UserProfile.jsx` | "🔒 My Profile" | - | No |
| 💬 Comments | `ReportComments.jsx` | Click Report | Enter to post | ✅ Yes |
| 🔔 Notifications | `NotificationBell.jsx` | 🔔 Bell Icon | - | ✅ Yes |
| 📍 Map | `ReportMap.jsx` | Click Report | - | No |
| 🔍 Filters | `AdvancedFilters.jsx` | Auto visible | - | ✅ Yes |
| 📊 Analytics | `AnalyticsDashboard.jsx` | "📊 STATS" | - | ✅ Yes |
| 🤖 Chat | `AIChat.jsx` | "🤖 Chat" | Enter to send | No |

---

## 🎮 User Interactions

### View User Profile
1. Click "🔒 My Profile" → View full profile
2. Click "✏️ EDIT PROFILE" → Edit your info
3. Update name, phone, avatar URL
4. Click "Save" to persist changes

### Add Report Comment
1. Click on any report to select it
2. Scroll to "💬 COMMENTS" section
3. Type message in text area
4. Click "Post" button
5. Comment appears instantly (real-time)

### Check Notifications
1. Click bell icon (🔔) in header
2. View list of recent notifications
3. Click notification to mark as read
4. Click "Clear All" to remove all

### Use Report Map
1. View "📍 Report Map" section
2. Click on any marker to zoom in
3. Different colors = different statuses
4. Icons show report categories

### Filter Reports
1. Use dropdown filters at top:
   - Status (Pending/Progress/Resolved)
   - Category (Water/Electric/Roads/etc)
   - District (Capricorn/Mopani/etc)
   - Urgency (Low/Med/High/Critical)
2. Set date range if needed
3. Search by description/location
4. Reports update instantly

### View Analytics
1. Click "📊 STATS" button in header
2. See key metrics in cards:
   - Total Reports
   - Resolved Count
   - Pending Count
   - Resolution Rate %
3. View charts:
   - Status pie chart
   - Category line chart
   - District grid

### Chat with AI
1. Click "🤖 Chat" button
2. Type your question
3. Press Enter or click →
4. AI responds with help
5. Click X to close

---

## 🗄️ Database Tables

### profiles
```
user_id (PK) | full_name | phone | avatar_url | created_at
```

### report_comments
```
id (PK) | report_id (FK) | user_id (FK) | content | created_at
```

### notifications
```
id (PK) | user_id (FK) | type | title | message | read | created_at
```

---

## 🔄 Real-Time Features

**Enabled via Supabase subscriptions:**
- ✅ Comments appear instantly for all users
- ✅ Notifications update in real-time
- ✅ Analytics refresh on status changes

**Manual refresh:**
- Map refreshes when report selected
- Filters recalculate on change

---

## 🎨 Color Scheme

| Element | Color | Meaning |
|---------|-------|---------|
| Border Left - Fixed | 🟢 #4caf50 | Resolved |
| Border Left - Progress | 🔵 #2196f3 | In Progress |
| Border Left - Pending | 🟠 #ff9800 | Pending |
| Header | ⬛ #000 / 🟨 #ffd700 | Brand colors |
| Success Button | 🟢 #4caf50 | Action approved |
| Alert Button | 🟡 #ff9800 | Needs attention |

---

## 📱 Responsive Breakpoints

- **Desktop (1024px+):** Full layout, all features visible
- **Tablet (768px-1023px):** Columns adjust, touch-friendly
- **Mobile (<768px):** Single column, stacked elements, optimized touch

---

## ⚡ Performance Tips

1. **Maps:** Renders efficiently up to 100+ markers
2. **Charts:** Smooth animations on data updates
3. **Comments:** Lazy load old comments when scrolling
4. **Filters:** Debounced search (300ms) to reduce queries

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map blank | Check lat/lng in database |
| Comments not showing | Refresh page, check Supabase RLS |
| Notifications missing | Enable real-time in Supabase |
| AI Chat not responding | Check `/api/chat` endpoint or use fallback |
| Filters not working | Clear browser cache, verify data |
| Stats not updating | Ensure analytics calculations are enabled |

---

## 🔐 Security

- User authentication required for all features
- Comments linked to user identity
- Notifications user-specific
- POPIA compliant (SA privacy law)
- RLS policies should be configured in Supabase

---

## 📞 Quick Links

- **Features Doc:** `FEATURES_DOCUMENTATION.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Main App:** `src/App.jsx`
- **Components:** `src/components/*.jsx`

---

## 💾 Build Info

- **Command:** `npm run build`
- **Size:** ~765KB (228KB gzipped)
- **Runtime:** Vite v8.2.2
- **React:** v19.2.8

---

**Quick Ref v1.0 | Updated Sept 2026**
