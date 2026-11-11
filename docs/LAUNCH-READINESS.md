# ElderCare Companion — Go-live readiness

**स्थिति जाँच:** 11 नवंबर 2026

**सीधा निष्कर्ष:** Firebase authentication का client और server source implementation इस working copy में मौजूद है और code checks pass हुए हैं। लेकिन यह अभी live/production-auth प्रमाण नहीं है: changes अभी uncommitted हैं, Firebase/EAS native files नहीं हैं, device build/test नहीं हुआ, Render API ने इस जाँच में timeout दिया, और Cloudflare Pages अभी repository की website नहीं दिखा रहा। यह platform अभी public care launch या वास्तविक emergency/medical use के लिए तैयार नहीं है।

## इस source में अब क्या implemented है

- Native Expo app में React Native Firebase से Phone OTP और Email/Password flows हैं; email signup पर email verification के बाद ही profile बनती है। Password reset और स्पष्ट SMS consent भी जोड़े गए हैं। Native Firebase config file न होने पर auth बंद रहता है। Expo web preview Firebase authentication का fallback नहीं करता।
- Mobile API requests Firebase ID token भेजती हैं। Express API Firebase Admin से token verify/revocation-check करती है; role client से भरोसेमंद नहीं माना जाता। नया profile server द्वारा Firestore में बनता है और self-signup में केवल `parent` या `child` स्वीकार होते हैं। Email/password के लिए verified-email claim जरूरी है।
- Firestore client rules deny-by-default हैं; शुरुआती user/profile bootstrap ही server-side है। Role मिलने से किसी दूसरे व्यक्ति का care data नहीं खुलता। Account linking, elder/care records, SOS और reminders अलग, अभी-अधूरे domain workflows हैं।
- Auth UI sign-in तब तक रोकता है जब तक native Firebase file और API में Firebase Admin config की readiness दोनों न मिलें। Readiness केवल environment/config की मौजूदगी है—OTP, email, database या care workflow का successful test नहीं।
- Local validation: `pnpm check`, `pnpm lint`, `pnpm test` (8 files, 67 tests), `pnpm build:server`, Expo web export (`pnpm build`), `pnpm build:website`, `pnpm exec expo install --check`, और `git diff --check` pass हुए। ये checks provider/device/live deployment की पुष्टि नहीं करते।

## इस समय live सेवाओं का प्रमाण

- `https://eldercare.pages.dev/` ने HTTP 200 दिया, लेकिन page title `Vite App` है। यह repository के `website/` build का प्रमाण नहीं; Pages अभी गलत project/root/output serve कर रहा है।
- इस जाँच में Render के `GET /api/health` और `GET /api/integrations/status` दोनों 20 सेकंड के भीतर response नहीं दे सके (curl HTTP 000 timeout)। कारण सिद्ध नहीं है; Render Dashboard logs/service health जाँचें। इस समय live API को healthy न मानें।
- Working tree `main` पर है, latest published source commit `021adc1` है। Firebase auth changes और इस readiness update अभी local/uncommitted हैं; इन्हें GitHub या Render पर deploy नहीं किया गया। `render.yaml` में `autoDeploy: true` है, इसलिए `main` पर push से Render deployment trigger होगा।
- कोई EAS project-linked native APK/AAB, physical-device result, successful OTP/email verification, public download link या Cloudflare corrected build प्रमाणित नहीं है।

## Owner के account में आवश्यक setup

1. **Firebase Authentication:** Firebase Console में Phone और Email/Password providers enable करें। Password policy और email-enumeration protections तय करें। SMS region policy में केवल intended countries चुनें; SMS शुल्क/quota और phone-number processing notice स्वीकार करने के बाद ही real-number tests करें।
2. **Firebase app:** provisional package/bundle ID `space.manus.eldercare.t263687757812581` को पहले approve करें। Firebase में Android app register कर `google-services.json` लें; iOS release चाहिए तो iOS app register कर `GoogleService-Info.plist` लें। EAS keystore fingerprints (SHA-1/SHA-256) Android phone verification setup में जोड़ें। Config files को chat/GitHub में न भेजें।
3. **Firestore:** intended region में database provision करें। `firebase/firestore.rules` client read/write बंद रखता है; profile bootstrap Firebase Admin से server पर होता है।
4. **Render:** `eldercare-api` service के Environment में `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` server-side भरें और `PUBLIC_APP_URLS` में exact origin `https://eldercare.pages.dev` रखें। Private key केवल Render में डालें। Render API timeout की वजह से पहले logs और service health ठीक/समझें; secret values chat में न भेजें।
5. **Expo/EAS:** Expo account पर project link/`eas build:configure` पूरा करें। Android के लिए EAS में file-type environment value `GOOGLE_SERVICES_JSON_FILE` और iOS के लिए `GOOGLE_SERVICE_INFO_PLIST_FILE` configure करें। Public API URL `EXPO_PUBLIC_API_BASE_URL=https://eldercare-api-vaee.onrender.com` है; Admin/provider secrets Expo variables में न डालें। Android internal build command `pnpm build:apk:preview` है। Build के बाद physical Android device पर OTP, email signup/verification, logout, role rejection और API failure test करें। Expo Go या web export native Phone OTP validate नहीं करता।
6. **Cloudflare Pages:** project source को repository `drvermasingod-ux/ElderCare`, production branch `main`, root directory `website`, build command `node build.mjs`, output directory `dist` पर सेट करें। Public variable `VITE_API_URL=https://eldercare-api-vaee.onrender.com` दें; `PUBLIC_DOWNLOAD_URL` तब तक खाली रखें जब तक असली APK distribution तैयार और जाँचा न जाए। Pages में कोई private key न डालें।

## अभी launch scope से बाहर

Firestore care-domain schema/API, consented parent-child linking, staff/admin lifecycle, medication schedules/reminders, booking/visits, health-data ingestion, SOS notification/delivery, private medical vault, audit/retention, payments और operational monitoring अभी launch-ready नहीं हैं। Render Free को time-critical SOS या medication escalation के लिए भरोसेमंद नहीं मानें। Legal/privacy/terms/support details और emergency disclaimer भी owner approval मांगते हैं। इन workflows को “key जोड़ने” से live नहीं माना जा सकता।

## अगला सुरक्षित क्रम

पहले Firebase project/app IDs और intended platform की पुष्टि करके provider config तथा Render/EAS values अपने dashboards में रखें। Render health/API और Cloudflare Pages output ठीक होने के बाद source changes को `main` पर publish/deploy करने की अनुमति दें। फिर EAS internal APK बनाकर वास्तविक device पर auth और failure paths जाँचें। Care-domain implementation, legal review और उपयुक्त non-sleeping hosting पूरी होने तक public care/SOS launch न करें।
