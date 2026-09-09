# AushadhiSetu — Mobile Packaging Guide (Capacitor)

This guide details packaging the `www` web application into a native Android and iOS application using **Capacitor**.

---

## 1. Prerequisites
- Node.js (v18+)
- Android Studio (for Android builds)
- Xcode & CocoaPods (macOS only, for iOS builds)

---

## 2. Installation & Setup

```bash
cd aushadhisetu-frontend

# Install dependencies
npm install

# Initialize Capacitor platforms
npx cap add android
npx cap add ios
```

---

## 3. Synchronizing Web Assets

Every time you update files in `www/`:
```bash
npx cap sync
```

---

## 4. Running on Device / Emulator

### Android
```bash
npx cap open android
```
In Android Studio:
1. Ensure your connected device or emulator is selected.
2. Click **Run** (Green play icon).

### iOS
```bash
npx cap open ios
```
In Xcode:
1. Select target device / simulator.
2. Click **Build and Run**.
