# Cookie Reset Pro

Cookie Reset Pro is a Chrome Manifest V3 extension designed to help users manage browser privacy by clearing cookies and site storage data for websites they visit.

## Features

### Cookie Management

* Remove cookies for the current website
* Support for HTTP and HTTPS cookies
* Handle domain and subdomain cookies
* Clear cookies using Chrome Cookies API

### Storage Cleanup

* Clear Local Storage
* Clear Session Storage
* Clear IndexedDB databases
* Clear Cache Storage
* Unregister Service Workers
* Remove accessible site storage data

### Navigation Monitoring

* Monitor tab navigation events
* Detect domain changes
* Perform cleanup operations when configured
* Track cleanup statistics

### Popup Dashboard

* Enable/Disable extension
* Display current domain
* Clear current site data
* Clear browser cookies
* Clear storage data
* View cleanup statistics

### Statistics Tracking

* Cookies removed
* Domains cleaned
* Storage items removed

### Logging System

* Debug mode support
* Action logging
* Error reporting
* Cleanup summaries

---

## Folder Structure

```text
cookie-reset-pro/
├── manifest.json
├── background.js
├── content.js
├── injected.js
├── popup.html
├── popup.css
├── popup.js
├── README.md
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Installation

### Method 1 — Load Unpacked Extension

1. Open Chrome.
2. Navigate to:

```text
chrome://extensions
```

3. Enable:

```text
Developer Mode
```

4. Click:

```text
Load unpacked
```

5. Select the:

```text
cookie-reset-pro
```

folder.

6. The extension should now appear in the extensions list.

---

## Usage

### Enable Extension

1. Click the extension icon.
2. Turn on the Enable toggle.

### Clear Current Website

1. Open a website.
2. Click the extension icon.
3. Press:

```text
Clear Current Site
```

### Clear Browser Cookies

1. Open the popup.
2. Click:

```text
Clear All Cookies
```

### Clear Storage

1. Open the popup.
2. Click:

```text
Clear All Storage
```

---

## Permissions Used

| Permission    | Purpose                       |
| ------------- | ----------------------------- |
| cookies       | Manage website cookies        |
| storage       | Save extension settings       |
| tabs          | Access active tab information |
| scripting     | Inject cleanup scripts        |
| webNavigation | Detect navigation changes     |
| browsingData  | Remove browser data           |

### Host Permissions

```json
"<all_urls>"
```

Allows the extension to operate on supported websites.

---

## Browser Compatibility

### Supported

* Google Chrome (MV3)
* Microsoft Edge (Chromium)
* Brave Browser
* Opera

### Partial Support

* Other Chromium-based browsers

---

## Debug Mode

Enable debug logging within the extension settings.

Example console output:

```text
[CookieResetPro] Domain detected
[CookieResetPro] Cookies removed: 12
[CookieResetPro] Storage cleared
[CookieResetPro] Cleanup completed
```

---

## Security Notes

* Uses Manifest V3 architecture.
* No remote code execution.
* No external scripts.
* No user data is transmitted to third parties.
* All cleanup operations occur locally within the browser.

---

## Known Browser Limitations

Modern browsers intentionally restrict certain privacy-sensitive operations.

Limitations may include:

* Some third-party cookies may not be accessible.
* Cross-origin iframe storage cannot always be cleared.
* Browser partitioned storage may remain isolated.
* Certain Service Worker data may require browser-level removal.
* Extensions cannot guarantee complete removal of all website identifiers.

These restrictions are imposed by browser security policies.

---

## Manifest Version

```text
Manifest Version 3 (MV3)
```

Built using Chrome Extension Manifest V3 standards.

---

## Author

Dharanidhar Mahata (imdevops)

Website:
https://imdevops.in

---

## Version

```text
Version 1.0.0
```

---

## License

MIT License

Copyright (c) 2026 Dharanidhar Mahata

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files to deal in the Software without restriction.
