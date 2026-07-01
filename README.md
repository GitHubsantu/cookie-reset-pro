# Cookie Reset Pro

> **Advanced privacy extension that intelligently clears tracking data while preserving your login sessions.**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange)

A privacy-focused Chrome/Firefox extension that automatically detects and removes tracking cookies while protecting your authenticated sessions. Smart session detection means **zero configuration** — the extension just works.

---

## ✨ Key Features

### 🎯 Smart Session Detection (NEW in v2.0.0)
- **Automatic login detection** — recognizes session/auth cookies without any user setup
- **Zero-configuration privacy** — identifies 150+ auth cookie patterns (Google, GitHub, Facebook, OAuth, etc.)
- **Never logs you out** — preserves your active sessions while removing trackers
- Detects auth cookies by:
  - Name patterns (session, auth_token, JWT, platform-specific identifiers)
  - HttpOnly flag (indicates server-set auth cookies)
  - SameSite attributes (Strict/Lax = auth, Lax/None = tracking)
  - Long expiration dates (weeks/months = "remember me" logins)

### 🧹 Cookie Management
- **One-click cleanup** for the current website
- Support for HTTP and HTTPS cookies
- Domain and subdomain cookie removal
- Automatic tracker removal on page navigation
- **Selective session preservation** — removes tracking without logging you out

### 💾 Storage Cleanup
- Clear Local Storage
- Clear Session Storage
- Remove IndexedDB databases
- Clear Cache Storage
- Unregister Service Workers
- Remove accessible website storage data

### 📊 Statistics Dashboard
- Live session detection display (🔒 Logged in status)
- Cookies removed counter
- Domains cleaned counter
- Storage items removed counter
- Real-time cleanup reports

### 🔒 Privacy Controls
- Enable/disable extension functionality
- Quick-access cleanup buttons
- Four cleanup modes:
  - **Auto-clean (on navigate)** — removes trackers only
  - **Clear Current Site** — removes non-auth cookies
  - **Clear All Cookies** — full cleanup with confirmation
  - **Nuke All** — nuclear option, full wipe

### 🐛 Debug & Diagnostics
- Built-in debug mode
- Detailed cleanup reports
- Error logging and diagnostics
- Background activity monitoring

---

## 🔒 Security & Privacy

- ✅ **Manifest V3** — modern, secure extension architecture
- ✅ **No remote code execution** — all code runs locally
- ✅ **No external scripts** — zero dependencies
- ✅ **No data collection** — nothing leaves your browser
- ✅ **No telemetry** — complete privacy
- ✅ **Open source** — MIT licensed, fully auditable

---

## 📥 Installation

### Chrome Web Store
[Install from Chrome Web Store](https://chrome.google.com/webstore)

### Firefox Add-ons
[Install from Firefox Add-ons](https://addons.mozilla.org)

### Edge Add-ons
[Install from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons)

### 🔧 Manual Installation (Development)

#### Chrome/Edge/Brave:
1. Clone or download this repository
2. Open `chrome://extensions` (or `edge://extensions` for Edge)
3. Enable **Developer Mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `cookie-reset-pro` folder
6. Extension will appear in your toolbar

#### Firefox:
1. Clone or download this repository
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select `manifest.json` from the project folder
5. Extension will appear in your toolbar

---

## 🚀 Usage

### Enable the Extension
1. Click the Cookie Reset Pro icon
2. Toggle **Enable** to activate

### Clear Current Website
1. Visit a website
2. Click Cookie Reset Pro icon
3. Click **Clear Current Site** — removes tracking cookies, keeps your login

### Clear All Cookies
1. Click Cookie Reset Pro icon
2. Click **Clear All Cookies** — removes everything (logs you out everywhere)

### Clear Storage Data
1. Click Cookie Reset Pro icon
2. Click **Clear All Storage** — removes Local Storage, Session Storage, IndexedDB, etc.

### Auto-Clean on Navigate
Enable in popup settings — automatically removes trackers as you browse (preserves logins)

### Session Status Display
The popup shows:
- 🔒 **Logged In** — indicates detected auth cookies
- **Tracker count** — number of tracking cookies found
- **Session pills** — shows detected login sessions by domain

---

## ⚙️ Technical Details

### Permissions Used

| Permission      | Purpose                                    |
|-----------------|-------------------------------------------|
| `cookies`       | Manage website cookies                    |
| `storage`       | Save extension settings & stats           |
| `tabs`          | Access active tab information             |
| `scripting`     | Inject cleanup scripts into pages         |
| `webNavigation` | Monitor tab navigation for auto-cleanup   |
| `browsingData`  | Remove browser cache & site data          |

### Host Permissions
```json
"<all_urls>"
```
Allows the extension to operate on all websites.

### Session Detection Algorithm
The extension classifies cookies before cleanup:

**Auth/Session Cookies:**
- Name matches 150+ patterns (session, auth, JWT, PHPSESSID, etc.)
- Has `HttpOnly` flag (never used by trackers)
- Has `SameSite=Strict` or `SameSite=Lax`
- Long expiration (7+ days = "remember me")

**Tracking Cookies:**
- Names like `_ga`, `_fbp`, `_gid`, `__utm*`, `_hjid`, etc.
- Typically lack `HttpOnly` flag
- Often have `SameSite=None`
- Short or medium expiration

### Supported Browsers

| Browser | Support | Version |
|---------|---------|---------|
| Chrome | ✅ Full | 88+ |
| Firefox | ✅ Full | 109+ |
| Edge | ✅ Full | 88+ |
| Brave | ✅ Full | Latest |
| Opera | ✅ Full | Latest |
| Vivaldi | ⚠️ Partial | Latest |

---

## 📁 Project Structure

```
cookie-reset-pro/
├── manifest.json           # Extension configuration
├── background.js           # Service worker (session detection, cleanup logic)
├── content.js              # Content script (page interaction)
├── injected.js             # Injected script (DOM manipulation)
├── popup.html              # Popup UI
├── popup.css               # Popup styling
├── popup.js                # Popup functionality
├── README.md               # This file
└── icons/
    ├── icon16.png          # 16x16 icon
    ├── icon32.png          # 32x32 icon
    ├── icon48.png          # 48x48 icon
    └── icon128.png         # 128x128 icon
```

---

## 🛠️ Development

### Setup
```bash
# Clone the repository
git clone https://github.com/imdevops/cookie-reset-pro.git
cd cookie-reset-pro

# No build process required — just load into your browser
```

### Debug Mode
Edit `background.js` and set:
```javascript
const CONFIG = {
  DEBUG_MODE: true,  // Enable debug logging
  ...
};
```

Monitor the service worker logs in Chrome DevTools:
1. `chrome://extensions`
2. Find Cookie Reset Pro
3. Click **Service Worker** link
4. Check the console

### Testing Session Detection
Visit these sites and verify the popup shows 🔒 **Logged In**:
- GitHub (github.com)
- Google (google.com)
- Facebook (facebook.com)
- Twitter/X (twitter.com)

---

## 📋 Changelog

### v2.0.0 — Smart Session Detection (June 2026)
**Major Release — Zero-Configuration Privacy**

#### ✨ New Features
- **Automatic session detection** — identifies logins without user configuration
- **150+ auth cookie patterns** — recognizes Google, GitHub, Facebook, OAuth, platform-specific sessions
- **Smart cleanup modes:**
  - Auto-clean on navigate (trackers only, preserve logins)
  - Clear current site (preserve auth)
  - Clear all cookies (full logout)
  - Nuke all (nuclear option)
- **Session status display** — shows 🔒 logged-in status and tracker count
- **Multi-browser support** — Chrome MV3 and Firefox MV2 with unified codebase

#### 🎯 Improvements
- Replaced hardcoded domain lists with intelligent cookie analysis
- Significantly reduced false positives in session detection
- Enhanced popup UI to show real-time session detection status
- Improved performance with batch cookie processing
- Better error handling and diagnostics

#### 🔧 Technical
- Manifest V3 architecture with Firefox compatibility layer
- Session detection based on cookie attributes (HttpOnly, SameSite, expiry)
- Configurable cleanup strategies per site

### v1.0.0 — Initial Release (June 2026)
Initial release with basic cookie and storage cleanup functionality.

---

## 📊 Statistics

The extension tracks:
- **Cookies removed** — total tracking cookies cleared
- **Domains cleaned** — unique domains processed
- **Storage items removed** — local storage, session storage, IndexedDB entries
- **Sessions detected** — active logins preserved

Statistics are saved locally in your browser and never transmitted anywhere.

---

## ⚠️ Known Limitations

These limitations are imposed by browser security policies:

- ❌ Some third-party cookies may not be accessible
- ❌ Cross-origin iframe storage cannot always be cleared
- ❌ Browser partitioned storage may remain isolated
- ❌ Certain Service Worker data requires browser-level removal
- ❌ Browser-level identifiers (like client hints) may remain protected

**What this means:** While Cookie Reset Pro removes most tracking data, some browser security features intentionally prevent extensions from clearing absolutely everything. This is by design to protect your browser from malicious extensions.

---

## 🐛 Troubleshooting

### Extension doesn't appear in toolbar
- **Chrome/Edge:** Go to `Extensions` → Find Cookie Reset Pro → Click the pin icon
- **Firefox:** Right-click the extension icon → "Pin to Toolbar"

### "Not Logged In" indicator even though I'm logged in
- The extension uses conservative cookie detection — it may not recognize custom auth implementations
- Use the **Manual Shield** button to mark a site as safe
- Enable debug mode to see which cookies are detected

### Some cookies aren't being removed
- Some cookies are protected by browser security policies
- Partitioned cookies in Chromium browsers may not be accessible
- Check the debug console for detailed removal reports

### Settings not saving
- Check browser privacy settings — storage permission may be restricted
- Try a different browser profile
- Disable conflicting privacy extensions

---

## 🔐 Privacy Policy

**Cookie Reset Pro does not:**
- Collect any user data
- Send information to external servers
- Use analytics or telemetry
- Store your browsing history
- Share data with third parties
- Contain ads or sponsored content

**All operations run entirely within your browser.**

---

## 📄 License

MIT License © 2026 Dharanidhar Mahata

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

---

## 👨‍💻 About the Author

**Dharanidhar Mahata** (imdevops)

- 🌐 Website: https://imdevops.in
- 🐙 GitHub: https://github.com/imdevops
- 🔗 LinkedIn: https://linkedin.com/in/imdevops
- 📧 Contact: founder@imdevops.in

---

## 🤝 Contributing

Found a bug? Have a feature idea? Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Support

If Cookie Reset Pro helps you protect your privacy, please consider:
- ⭐ Star this repository on GitHub
- 📢 Share with privacy-conscious friends
- 💬 Leave a review on your browser's extension store
- 🐛 Report bugs and suggest features via GitHub Issues

---

## 🎯 Roadmap

### v2.1.0 (Coming Soon)
- [ ] Custom whitelist for specific domains
- [ ] Scheduled cleanup tasks
- [ ] Cleanup history/reports export
- [ ] Advanced statistics dashboard
- [ ] Custom cleanup profiles

### v2.2.0 (Planned)
- [ ] Cookie import/export functionality
- [ ] Enhanced performance metrics
- [ ] Multi-profile settings
- [ ] Policy management for organizations

---

**Made with ❤️ for your privacy.**
