# Visual assets for the Play Store listing

Everything the Play Store listing needs that isn't text. I can't create images — this file tells you exactly what to build, at what size, and what to put in each one.

All files go in `store/assets/` (create the folder) when you generate them. They're not checked into the repo via this commit because they don't exist yet.

---

## 1. App icon (required)

- **Format:** 32-bit PNG with alpha
- **Dimensions:** exactly 512 × 512 pixels
- **Filename suggestion:** `store/assets/play-store-icon.png`

**Good news:** you already have `assets/images/icon.png`. If it's 512×512 or larger, upscale/downscale with no loss. If it's smaller, export a new version from your source file at 512×512.

**Test before uploading:** drop the 512×512 into a circle-crop preview online (just search "circle crop image") to confirm nothing important gets clipped. Adaptive icon safe zone applies: the important content should be inside the middle ~66% of the canvas.

---

## 2. Feature graphic (required, the one almost everyone forgets)

- **Format:** 24-bit PNG (no alpha) or JPG
- **Dimensions:** exactly 1024 × 500 pixels
- **Filename suggestion:** `store/assets/feature-graphic.png`

This is the landscape banner at the top of your Play Store listing. Google uses it in promotional surfaces too.

**What to put on it:**
- The VitaMood name (large, brand font — DM Sans 600 or 700)
- A gentle tagline — suggested: `A kind friend in your pocket.`
- A single visual element — I'd recommend the breathing circle from the box breathing exercise, or the VitaMood sage color `#7BA68A` as a soft gradient background
- **No screenshots in the feature graphic** — Play Store shows real screenshots separately; the feature graphic is for brand

**Colors:** stick to the PLAN.md §8 palette — `#F7F5F2` (warm off-white background) with `#7BA68A` (sage) accent, or the inverse for dark mode.

**Don't:** add ratings, prices, "Free!" callouts, store badges, or legal notices. Google rejects feature graphics with any of those.

---

## 3. Phone screenshots (required — minimum 2, maximum 8)

- **Format:** 24-bit PNG or JPG
- **Dimensions:** any 16:9 or 9:16 ratio between 320px and 3840px on the longest side. Common sizes:
  - **1080 × 1920** (most common, matches a Pixel 4/5)
  - **1080 × 2340** (Pixel 6/7/8)
- **Filename suggestions:** `store/assets/screenshot-01.png` through `screenshot-08.png`

**Recommended set of 6 screenshots, in this exact order:**

| # | Screen | Why this one |
|---|---|---|
| 1 | Home tab with today's check-in card + weekly dots | The "first moment" — shows the core ritual |
| 2 | Check-in modal with the mood + energy sliders | Shows what the ritual actually looks like |
| 3 | Exercises tab list | Shows breadth of practices available |
| 4 | Box breathing player mid-breath (inhale phase, circle expanded) | Shows depth, the calm motion language |
| 5 | Chat tab with a few messages | Shows the AI companion (warn: caption should note "beta placeholder responses" since the real AI isn't on) |
| 6 | Insights tab with the tag correlation card | Shows the "quiet pattern" insight feature |

**Don't screenshot:**
- The crisis screen — policy-sensitive, better to leave it as a surprise users discover
- The delete account flow — not marketing content
- Any screen where the placeholder text still says something like "Loading…"
- The settings / Account tab — boring for a store listing

**How to capture them:**

Once you have a dev client running on a phone or emulator:
1. Run `bunx expo start --dev-client`
2. Navigate to each target screen
3. Use Android's built-in screenshot (Power + Volume Down) or Android Studio's device manager screenshot tool
4. Transfer the PNGs to your computer
5. Optional: add a small caption overlay at the top of each screenshot using a tool like Figma, Canva, or even Preview — Google allows up to 10% caption overlay

**Caption copy suggestions** (optional, add these overlays in a design tool):

1. "A 30-second check-in, every day"
2. "Mood and energy, no scorecards"
3. "Five small practices for when you need them"
4. "Breathe in, four. Hold, four. Out, four."
5. "A kind friend in your pocket" _(or: "Talk it out with Aria, privately")_
6. "Quiet patterns, only when they're real"

---

## 4. Device-specific screenshots (optional but recommended)

Play Store also supports:
- **7-inch tablet** (600dp × 1024dp) — skip unless you care about tablet installs
- **10-inch tablet** (720dp × 1280dp) — skip unless you care about tablet installs
- **Wear OS, Android TV, Chromebook** — skip entirely

VitaMood is Android phone first. Phone screenshots are enough for v1.

---

## 5. Promotional video (optional)

- **Format:** YouTube URL (Google pulls from YouTube, not a file upload)
- **Length:** 30–120 seconds
- **Aspect ratio:** 16:9 preferred

**Skip this for v1 closed beta.** A bad promo video is worse than no promo video. Revisit if you pursue public launch.

---

## How to produce everything quickly

If you don't have design tools set up, here's the minimum viable path for each asset:

| Asset | Easiest tool | Time |
|---|---|---|
| 512×512 app icon | **ImageMagick** on the command line (`convert icon.png -resize 512x512 store/assets/play-store-icon.png`) if your source is already close | 30 sec |
| 1024×500 feature graphic | **Canva** (free) has a "Play Store feature graphic" template. Search for it and plug in your name + tagline | 10 min |
| Phone screenshots (raw) | Run the dev client on your phone, use Power+Volume Down | 5 min |
| Phone screenshots (with captions) | **Figma** (free) or **Canva** with a 1080×1920 artboard, drop the screenshot in, add a text layer at the top | 20 min total for 6 screenshots |

**Total time to produce all required visuals: ~30–45 minutes** once you have a working dev client to screenshot from.

---

## When everything is ready

Stash the files in `store/assets/` so the repo has a single place to look. You don't need to commit them — they're build artifacts, not source. But committing is fine if you want them versioned.

Then in the Play Console:

1. **App icon** → upload `play-store-icon.png`
2. **Feature graphic** → upload `feature-graphic.png`
3. **Phone screenshots** → upload `screenshot-01.png` through `screenshot-06.png` in order
4. **Promo video** → leave blank

After that, every visual slot on the store listing is filled.
