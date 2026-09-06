---
type: store
updated: 2026-09-05
---
# Release

How a version gets from this repo to the App Store. Two halves: what happens on the Mac in this repo, and what the owner does in App Store Connect. Do them in order.

## Versioning

- `MARKETING_VERSION` in the Xcode project and `version` in `extension/manifest.json` are the same string, `MAJOR.MINOR.PATCH`. Bump both in the same commit.
- `CURRENT_PROJECT_VERSION` is the build number. It goes up by one for every upload, never down, never reused.
- Tag the commit `v1.0.0` after the build is approved.

## Before the first upload, once

1. Enrolled team: Vinayak Sankaranarayanan, `VSTTF2AM22`. Already set in the project.
2. Xcode is signed in to that Apple ID under Settings, Accounts. Automatic signing registers the App ID `com.vinayaksankaranarayanan.inkover` on first archive.
3. App Store Connect agreements are in order. Free needs nothing extra; the later switch to $5.99 needs the paid apps agreement, banking and tax, which take a day to clear, so do them early.
4. GitHub Pages is on, so the privacy policy and marketing URLs in [[listing]] resolve.

## On the Mac, every release

1. Run the acceptance lists on the iPad and set specs to `verified`. Nothing ships with a `built` spec.
2. Bump the version and build number. Update What's new in [[listing]].
3. Regenerate the index and commit.
4. Archive and upload:

```bash
scripts/release.sh
```

The script archives with the release configuration, exports for App Store Connect and uploads. It needs Xcode signed in to the team. On success the build appears in App Store Connect under TestFlight within about fifteen minutes, then under the version page once processing ends.

## In App Store Connect, first release

Each step is one screen. Do not skip ahead; later screens depend on earlier ones.

1. Go to https://appstoreconnect.apple.com and sign in with the Apple ID that owns team `VSTTF2AM22`.
2. Open **Business**, then **Agreements**. The **Free Apps** agreement is active by default and is all the launch needs. Also accept **Paid Apps** now and fill in **Bank** and **Tax** on the same page, so the later switch to $5.99 is one click. This can take a day to clear and does not block a free release.
3. Open **Apps**, press the **+** at the top left, choose **New App**.
   - Platforms: **iOS** only.
   - Name: **Inkover**.
   - Primary Language: **English (U.S.)**.
   - Bundle ID: choose **com.vinayaksankaranarayanan.inkover**. If it is not in the list, the first archive has not run yet; run `scripts/release.sh` first, or register it at https://developer.apple.com/account/resources/identifiers.
   - SKU: **inkover-ios-1**.
   - User Access: **Full Access**.
   - Press **Create**.
4. In the left column open **App Information**.
   - Subtitle: copy from [[listing]].
   - Category: **Utilities**, secondary **Productivity**.
   - Content Rights: **does not contain, show, or access third-party content**.
   - Age Rating: press **Edit**, answer **No** or **None** to every question, save. It will show **4+**.
   - Privacy Policy URL: copy from [[listing]].
   - Save.
5. Open **Pricing and Availability**.
   - Press **Add Pricing**, base country United States, choose **Free** (the $0.00 tier), press Next and confirm.
   - Availability: all countries and regions.
   - Pre-orders: off.
   - Save.
6. Open **App Privacy**.
   - Press **Get Started**. Answer **No, we do not collect data from this app**. Press **Publish**.
7. Open the **1.0 Prepare for Submission** page under iOS App.
   - Screenshots: drag the five 13-inch iPad images from [[listing]] into the iPad slot, in order.
   - Promotional Text, Description, Keywords, Support URL, Marketing URL: copy each from [[listing]].
   - Version: **1.0.0**. Copyright: from [[listing]].
   - Build: press **Add Build** or the **+** next to Build and choose the uploaded build. If none is listed, wait for processing.
   - App Review Information: your name, phone, email. Sign-in required: unchecked. Notes: copy from [[listing]].
   - Version Release: **Manually release this version**, so approval does not publish before you are ready.
   - Save.
8. Press **Add for Review**, then **Submit to App Review**.
9. Review usually answers within one to three days. If rejected, the message names a guideline; fix, upload a new build with the next build number, and resubmit from the same version page.
10. After approval, press **Release This Version**. Then tag the commit `v1.0.0`.

## Later releases

Steps 1, 2, 3, 4, 5 and 6 are done once. For each new version: press **+** next to iOS App in the left column, enter the new version number, and repeat only step 7 onward.

## Switching from free to paid

Open **Pricing and Availability**, press **Edit** next to the price, pick the tier that shows **$5.99** in the United States, choose an effective date, save. Existing users keep the app. Update the price row in [[listing]] the same day.

## Privacy manifest

Inkover uses no required-reason API and no third-party SDK, so no `PrivacyInfo.xcprivacy` is needed. Revisit if the wrapper ever reads `UserDefaults` or file timestamps.
