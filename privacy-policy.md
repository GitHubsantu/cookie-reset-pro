# Privacy Policy - Cookie Reset Pro

**Last Updated:** June 2026  
**Version:** 2.0.0  

---

## Overview

Cookie Reset Pro ("we," "us," "our," or "the extension") is committed to protecting your privacy. This Privacy Policy explains how our Chrome/Firefox/Edge extension handles information.

**TL;DR:** We don't collect any data. Period.

---

## What Data We Collect

### ✅ What We Don't Collect

❌ **NO personal information**
- No names
- No email addresses
- No IP addresses
- No location data

❌ **NO browsing data**
- No browsing history
- No websites visited
- No pages viewed
- No search history

❌ **NO telemetry**
- No crash reports
- No analytics
- No usage statistics
- No event tracking

❌ **NO identifiers**
- No user IDs
- No device IDs
- No advertising IDs
- No fingerprinting

---

## What the Extension Does

### Local Operations Only

Everything happens **entirely on your device**:

1. **Analyze Cookies** — Examines cookies on the current website
2. **Identify Tracking** — Uses 150+ patterns to detect tracking cookies
3. **Preserve Auth** — Protects authentication cookies
4. **Remove Trackers** — Deletes tracking cookies locally
5. **Clear Storage** — Removes localStorage, sessionStorage, IndexedDB (user-initiated only)
6. **Report Stats** — Shows cleanup statistics (stored locally)

### Zero External Transmission

- ✅ No data sent to servers
- ✅ No cloud synchronization
- ✅ No API calls with user data
- ✅ No third-party integrations

---

## Permissions We Request

### Why We Need Each Permission

| Permission | Used For | Necessity |
|-----------|----------|-----------|
| `cookies` | Analyze and remove tracking cookies | **REQUIRED** |
| `storage` | Save your settings locally (browser storage API) | **REQUIRED** |
| `tabs` | Detect your current website | **REQUIRED** |
| `scripting` | Clean website storage (localStorage, etc.) | **REQUIRED** |
| `webNavigation` | Auto-clean cookies on navigation | **OPTIONAL** |
| `browsingData` | Clear browser cache and site data | **REQUIRED** |
| `<all_urls>` | Operate on all websites | **REQUIRED** |

### What Each Permission Does

**cookies**
- Reads cookies to detect trackers and auth sessions
- Removes tracking cookies
- Preserves authentication cookies
- Does NOT read cookie content (only name/attributes)

**storage**
- Saves your extension settings
- Stores cleanup statistics
- Saves user preferences
- All stored locally on your device

**tabs**
- Identifies which website you're visiting
- Required to know where to apply cleanup
- Does NOT send tab URL anywhere

**scripting**
- Injects cleanup scripts into pages
- Clears localStorage, sessionStorage, IndexedDB
- Only runs when you click cleanup buttons
- Does NOT modify page content

**webNavigation**
- Monitors when you navigate to a new site
- Enables auto-cleanup feature
- Does NOT track navigation history

**browsingData**
- Clears browser cache
- Removes service worker data
- Removes site storage
- Only when you use "Nuke All" option

---

## Data Storage

### What We Store Locally

All data stored on **your device only**:

**Extension Settings**
- Enable/disable toggle
- Auto-cleanup preference
- Debug mode status
- Theme preference

**Statistics (Optional)**
- Number of cookies removed (cumulative)
- Number of trackers detected (cumulative)
- Domains cleaned (list)
- Last cleanup time (timestamp)

**Status Data**
- Current session detection status
- Current cookie analysis results
- Current cleanup operation status

### How We Store It

- **Browser Storage API** — Stored in browser's local storage
- **Not Synchronized** — Does not sync across devices
- **Not Backed Up** — Lost if you uninstall or clear data
- **Encrypted by Browser** — Browser handles encryption
- **Accessible Only by Extension** — Other websites cannot access

---

## Session Detection

### How We Detect Login Sessions

Cookie Reset Pro uses intelligent analysis to detect when you're logged in:

**Detection Methods**
1. **Cookie Name Analysis** — Checks for 150+ authentication patterns (session, auth_token, JWT, etc.)
2. **Cookie Attributes** — Analyzes HttpOnly, SameSite, expiration dates
3. **Pattern Matching** — Recognizes platform-specific cookies (Google, GitHub, Facebook, etc.)

**Examples**
- GitHub: `user_session` cookie → Detected as auth
- Google: `SID` cookie → Detected as auth
- Facebook: `c_user` cookie → Detected as auth

**All Local** — This analysis happens entirely on your device. No data is sent anywhere.

---

## Third-Party Services

### Services We DON'T Use

❌ Analytics (Google Analytics, Segment, Mixpanel, etc.)  
❌ Crash Reporting (Sentry, Crashlytics, etc.)  
❌ User Tracking (Amplitude, Heap, etc.)  
❌ Error Monitoring (Rollbar, Bugsnag, etc.)  
❌ Advertisement Networks  
❌ CDNs with tracking  

### Services We Use

**GitHub**
- Hosts source code (public repository)
- Hosts release notes
- Hosts this privacy policy
- GitHub logs are not controlled by us

**Browser Extension Stores**
- Chrome Web Store (Google)
- Firefox Add-ons (Mozilla)
- Edge Add-ons (Microsoft)
- These stores may collect analytics about downloads/installs

---

## Your Data Rights

### What You Can Do

✅ **Request Data**
- All your data is stored locally on your device
- Access it via browser DevTools → Application → Local Storage
- See exactly what we store

✅ **Delete Data**
- Uninstall the extension (deletes all stored data)
- Clear browser data (deletes all stored data)
- Your data is immediately deleted

✅ **View Source Code**
- Extension is open source (MIT License)
- View all code on GitHub
- Audit exactly what we do

✅ **Disable Features**
- Disable auto-cleanup anytime
- Turn off the extension
- No data collection even when disabled

### Data Portability

Because all data is stored locally:
- Export your settings (copy from DevTools)
- Transfer between browsers (manual backup)
- No central account or cloud sync

---

## Security

### How We Protect Privacy

**Architecture**
- Manifest V3 security (Chrome/Edge)
- Manifest V2 compatibility (Firefox)
- No remote code execution
- No external script loading

**Code Quality**
- No hardcoded API keys
- No credentials in code
- No telemetry endpoints
- All URLs are HTTPS

**Updates**
- Updates come from official stores only
- No auto-update from unknown sources
- You control when to update

**Open Source**
- Source code publicly available
- Anyone can audit the code
- MIT License (fully transparent)

---

## Changes to This Policy

### Updates

We may update this Privacy Policy occasionally. When we do:
- Updated date will change at top of this file
- Significant changes will be announced in release notes
- Continued use means you accept changes

### Current Version
- Version: 2.0.0
- Updated: June 2026
- Status: Current

---

## Children's Privacy

Cookie Reset Pro is not intended for children under 13. We do not knowingly collect data from children.

If you believe we have collected data from a child under 13, please contact us immediately.

---

## International Users

### Data Location

All data stays on your device, regardless of location. Your device's country is where your data resides.

### GDPR Compliance

**Data Retention:** You control all data (stored locally)  
**Data Access:** You have immediate access  
**Data Deletion:** Delete anytime by uninstalling  
**Data Processing:** No processing beyond local cleanup  
**Data Transfer:** No transfers (stays on device)  

---

## California Privacy Rights

### CCPA Compliance

**Right to Know**
- All your data is stored locally
- You can view it anytime (DevTools)
- We don't collect or sell data

**Right to Delete**
- Delete anytime by uninstalling
- Clear browser data anytime
- Immediate deletion

**Right to Opt-Out**
- Disable extension anytime
- Uninstall anytime
- No account needed

---

## Contact Us

### Questions About Privacy

📧 **Email**  
dharani@imdevops.in

🐙 **GitHub Issues**  
https://github.com/imdevops/cookie-reset-pro/issues

🌐 **Website**  
https://imdevops.in

---

## Legal

### MIT License

Cookie Reset Pro is released under the MIT License:

```
Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction...
```

See LICENSE file for full terms.

---

## Certification

**I certify that the following disclosures are true:**

✅ I do not sell or transfer user data to third parties  
✅ I do not use user data for unrelated purposes  
✅ I do not use user data for creditworthiness/lending decisions  

---

## Summary

**Cookie Reset Pro:**
- Collects NO data
- Sends NO data anywhere
- Stores NO data externally
- Uses NO analytics
- Uses NO tracking
- Uses NO telemetry
- Uses NO third-party services (except official stores)

**Your privacy is guaranteed.** 🔒

---

**Made with ❤️ by Dharanidhar Mahata (imdevops)**

Last Updated: June 2026
