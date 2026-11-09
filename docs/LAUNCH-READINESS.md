# ElderCare Companion — Go-live readiness

**स्थिति जाँच:** 9 नवंबर 2026

**राय:** यह प्रोजेक्ट अभी public production launch या वास्तविक medical/emergency care के लिए तैयार नहीं है। इस समय कोई API key डालकर OTP, परिवार linking, SOS, care records या admin dashboard अपने-आप चालू नहीं होंगे। उन सुविधाओं का authentication/data/workflow code अभी बनना बाकी है।

इस working copy में अतिरिक्त backend सुरक्षा/readiness बदलाव तैयार हैं, लेकिन वे अभी GitHub `main` पर push नहीं हुए हैं और Render पर live नहीं हैं। इनके बाद TypeScript check, lint, 46 automated tests (1 पहले से skipped), server build, Cloudflare Pages build, Expo web export और local API smoke check सफल हुए। Repository में Render `autoDeploy: true` है; इसलिए इन backend बदलावों को `main` पर push करना production API redeploy करेगा।

## अभी क्या तैयार है

- Cloudflare Pages के लिए अलग static website source और build command मौजूद है। Website Render API को environment से call कर सकती है; APK link default रूप से बंद रहता है और `/admin.html` केवल स्पष्ट unavailable notice दिखाता है—fake login या demo dashboard नहीं।
- React Native/Expo app अलग है और ElderCare branding रखता है। Mock direct-login और fixture dashboard के बजाय यह sign-in/care screens को fail-closed रखता है। `eas.json` में Android preview APK तथा Play Store AAB profiles हैं, लेकिन actual EAS build अभी नहीं बना।
- पिछले `main` commit `164908d8166d386f7030463b2670c07e2057dfc4` के लिए GitHub पर Render deployment status `success` है। फिर भी इस जाँच में `GET https://eldercare-api-vaee.onrender.com/api/health` ने 25 सेकंड तक कोई response नहीं दिया। इसलिए API को अभी live/healthy प्रमाणित नहीं माना जा सकता—Render logs और endpoint को फिर जाँचना होगा।
- Website का build setup है; Cloudflare Pages deployment URL/status इस session में verify नहीं हुआ।
- इस checkout में Firebase app config (`google-services.json` / `GoogleService-Info.plist`), कोई वास्तविक service-account credential, native release artifact या Firebase OTP implementation नहीं मिला।
- Local API smoke check में `/api/health` ने HTTP 200 दिया, Firebase status `not-implemented`/`productionReady: false` था, और public storage proxy ने private vault path को 404 किया। यह केवल local bundle का परीक्षण है, deployed Render API का नहीं।

## Live launch को रोकने वाली असली कमियाँ

| भाग | अभी की स्थिति | केवल key जोड़ना क्यों पर्याप्त नहीं |
|---|---|---|
| Sign-in | Current API Manus OAuth/session code पर आधारित है; Firebase phone OTP/email-password flow नहीं है। | App Firebase ID token नहीं बनाता और API उसे verify नहीं करती। |
| Roles | Existing SQL user schema केवल `user`/`admin` रखता है। Trusted Parent, Child/Family और Care Partner/Staff accounts/permissions नहीं हैं। | Frontend या environment variable को role देने का अधिकार नहीं मिल सकता; server role resolution और lifecycle बनाना होगा। |
| Firebase/Firestore | Local follow-up code integration inventory में इसे `not-implemented` दिखाता है; यह बदलाव अभी deployed नहीं है। | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` मौजूद होने पर भी कोई OTP, Firestore query/rules, FCM या family data workflow नहीं बनेगा। |
| Care data/linking | Linked elders, consent, one-time invite, booking, visit, medication schedule/outcome, SOS/escalation, audit और account suspension के production routes/schema नहीं हैं। | ये server-side schema, rules, authorization, idempotency और failure/delivery handling मांगते हैं। |
| Medical files | Signed-URL adapter है, पूरा vault नहीं। | Relationship sharing, upload size/content validation, consent, metadata, retention और deletion policy अभी चाहिए। |
| Notifications/SOS | Twilio/WhatsApp/voice जैसी कुछ provider-call adapters हैं; schedule, consent, retries, delivery receipts और audit workflow नहीं। | Provider key से API call संभव हो सकती है, मगर सुरक्षित care workflow नहीं बनता; Render Free को time-critical SOS के लिए भरोसेमंद नहीं मानना चाहिए। |
| Payments | Razorpay/Stripe adapter मौजूद हो सकता है, लेकिन server-priced catalog, signed webhook verification, idempotency और entitlement ledger नहीं। | Client/provider का “success” subscription/payment state का प्रमाण नहीं है। |
| Admin | Real admin auth/API/dashboard नहीं; static notice जानबूझकर बंद है। | Firebase/server-enforced admin authorization और auditable endpoints पहले चाहिए। |
| Legal/support | Privacy, Terms, support/contact के final owner-approved pages/details अभी नहीं। | Legal entity, region, data-controller/contact, retention, processors और emergency disclaimer owner से चाहिए। |
| Mobile release | EAS profiles हैं, EAS project/linking और physical-device validation प्रमाणित नहीं। | Store signing/build credentials, approved app IDs, APK/AAB build और वास्तविक Android/iOS परीक्षण चाहिए। |

## मुझसे आगे काम शुरू कराने के लिए आपकी तरफ़ से क्या चाहिए

कृपया **secret/API key chat में न भेजें**। पहले ये non-secret फैसले/जानकारी भेजें:

1. **Website origin:** Cloudflare का exact `https://….pages.dev` URL और, यदि होगा, custom domain। उदाहरण: `https://eldercare.pages.dev` तथा `https://eldercare.in`।
2. **App identity:** अभी Android/iOS दोनों का provisional bundle ID `space.manus.eldercare.t263687757812581` है। इसे approve करें या नया reverse-domain ID दें। Store में पहली बार publish होने के बाद ID बदलने से नया app listing बन सकता है। साथ में final display name भी confirm करें।
3. **पहले release के login/roles:** Phone OTP ही, या phone + email/password? पहले release में Parent, Child/Family, Staff/Care Partner और Admin में से कौन होंगे? कौन-सा role self-signup कर सकता है और कौन invite/approval से आएगा?
4. **पहले release में features:** family linking, private vault, bookings/visits, medication reminders, SOS, keypad-phone calls, payments, admin dashboard—कौन-से Phase 1 में सच में चालू चाहिए? SOS/voice के लिए contact consent और provider delivery policy कौन तय करेगा?
5. **Region और content:** launch country/currency, app/website languages, कानूनी business name, support email/phone, privacy/terms URL या final policy text, और emergency disclaimer। इनमें से कोई चीज़ तय नहीं है तो उसे “अभी तय नहीं” लिखें—placeholder legal text को live नहीं करेंगे।
6. **Store accounts:** Google Play Console तथा Apple Developer account कौन-से owner/team के हैं? Android पहले या Android+iOS दोनों?
7. **पुराना auth/database:** क्या लक्ष्य मौजूदा Manus OAuth + MySQL user-table को पूरी तरह Firebase Auth + Firestore से बदलना है (मूल project लक्ष्य), या launch में Manus OAuth/MySQL अस्थायी रूप से रखना है? Render Blueprint केवल web service बनाता है, MySQL नहीं। Firebase migration मंजूर हो तो अभी नया MySQL paid plan न खरीदें।

इसके बाद **secrets स्वयं provider dashboard में** डालें; मुझे केवल इतना बताना पर्याप्त है कि कौन-सी setting पूरी हुई है।

## कौन-सी value कहाँ डालनी है

### 1. Render — server-only values

Render Dashboard → **eldercare-api service → Environment**:

- केवल अगर मौजूदा Manus OAuth/MySQL path रखना है: `MANUS_PROJECT_ID`, `MANUS_OAUTH_API_URL`, `MANUS_JWT_SECRET` और `DATABASE_URL` (MySQL/Drizzle-compatible)। Render Blueprint MySQL बनाता नहीं है। अगर Firebase migration चुना है तो पहले code migration करें; बिना आवश्यकता नया database न खरीदें। पहले जाँचें कि existing service में values पहले से हैं; values chat में न भेजें।
- Website CORS: `PUBLIC_APP_URL` में एक exact canonical HTTPS origin, या `PUBLIC_APP_URLS` में comma-separated exact origins। कोई path, wildcard या trailing slash न डालें। उदाहरण: `https://eldercare.pages.dev,https://eldercare.in`।
- R2 के लिए: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`—पर इन्हें तभी activate करें जब consent/metadata/access/retention workflows भी deploy और review हो चुके हों।
- Firebase: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` **अभी डालने से OTP चालू नहीं होगा**। Firebase client + API ID-token verification/Firestore code पहले बने; फिर private key केवल Render Environment में डालें।
- Google TTS/STT का मौजूदा adapter `GOOGLE_CLOUD_ACCESS_TOKEN` पढ़ता है; साधारण OAuth access token अस्थायी होता है। इसे permanent credential न मानें—production में refresh/workload identity का code और provider setup चाहिए।

### 2. Cloudflare Pages — केवल public build settings

Cloudflare Dashboard → **Workers & Pages → Pages → ElderCare project → Settings → Builds & deployments**:

- Root directory: `website`
- Build command: `node build.mjs`
- Build output directory: `dist`
- Production branch: `main`
- Environment variables: `VITE_API_URL=https://eldercare-api-vaee.onrender.com`
- `PUBLIC_DOWNLOAD_URL` केवल सफल EAS APK/AAB distribution के बाद दें; तब तक खाली छोड़ें।

Pages में Firebase private key, Render secret, R2/Stripe/Twilio credentials या admin secret **कभी न डालें**। API origin बदलने पर Render CORS में वही exact website origin भी जोड़ें।

### 3. Expo/EAS — native builds

Expo account/EAS dashboard में repository/project link करें, `npx eas-cli build:configure` चलाएँ और build environment में public `EXPO_PUBLIC_API_BASE_URL=https://eldercare-api-vaee.onrender.com` रखें। Native signing/Play Store credentials Expo/EAS के secure credential flow में दें। Firebase client setup, Android/iOS app IDs और Google services files code integration तथा IDs की approval के बाद ही जोड़ें। इन्हें GitHub या chat में upload न करें।

## सुरक्षित क्रम

1. ऊपर के owner decisions भेजें; कोई secret भेजने की जरूरत नहीं।
2. मैं चुने हुए Phase 1 के लिए Firebase client + API token verification, trusted role model, Firestore rules/routes और वास्तविक feature workflows लागू करूँगा; keys को “काम करता है” कहकर पहले से सक्षम नहीं दिखाऊँगा।
3. आप secrets Render/Cloudflare/EAS के सही स्थान पर स्वयं डालें। Firebase/R2/payment keys Pages या Expo public config में नहीं जाएँगी।
4. Staging deploy के बाद API health, Firebase OTP, role-denial, family isolation, upload/download access और provider failure handling जाँची जाएगी।
5. EAS preview APK बनाकर कम-से-कम एक वास्तविक Android phone पर sign-in, account linking, offline recovery, permissions और SOS/reminder flow verify करें। फिर ही approved download URL और production store build दें।

**महत्वपूर्ण:** वेबसाइट अभी app नहीं है; installable Android/iOS application अलग Expo project है। Build/profile files मौजूद हैं, पर API timeout, अधूरा Firebase/domain workflow और वास्तविक device build/testing के कारण यह अभी “एक-दो keys डालते ही live” स्थिति में नहीं है।
