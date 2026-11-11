# ElderCare Companion — ताज़ा launch diagnosis

> **ऐतिहासिक snapshot:** यह 10 नवंबर 2026 की pre-Firebase-auth स्थिति बताता है। इसके login/API implementation वाले निष्कर्ष बाद के source changes से superseded हैं। मौजूदा स्थिति के लिए [`LAUNCH-READINESS.md`](LAUNCH-READINESS.md) और [`FIREBASE-AUTH-SETUP.md`](FIREBASE-AUTH-SETUP.md) देखें। Cloudflare/Render live-status संबंधी सीमाएँ अभी भी लागू हो सकती हैं और fresh checks से अलग से verify करनी होंगी।

**जाँच की तारीख:** 10 नवंबर 2026
**जाँचा गया source:** GitHub `main`, commit `021adc1dc7ea41bdec499eb8f458ae509ebebaf5`
**निष्कर्ष:** GitHub push और Render deployment हुए हैं, लेकिन अभी वास्तविक user sign-in या care workflows चलाने वाला production app नहीं है। Website, API और Expo app के source अलग हैं; deploy होना इन तीनों को एक-दूसरे से जोड़कर usable product नहीं बना देता।

## सीधे जवाब: login क्यों नहीं हो रहा?

यह मौजूदा code में जानबूझकर बंद है—यह network bug मात्र नहीं है। Expo app का `app/index.tsx` वाला Log in/Create account बटन कोई login form, Firebase OTP request, account creation या OAuth portal launch नहीं करता। वह एक सूचना खोलता है: secure sign-in अभी तैयार नहीं है; कोई OTP नहीं भेजा गया। इस कारण user login कर ही नहीं सकता।

सर्वर पर पुराना Manus OAuth/session आधार मौजूद है, पर mobile welcome screen उस sign-in को शुरू नहीं करती। API router में auth के लिए अभी `/me` और `/logout` हैं; Firebase phone OTP/email-password sign-in, signup और Firebase ID-token verification routes नहीं हैं। App protected tabs केवल `parent`, `child` या `staff` जैसे verified role स्वीकारते हैं, जबकि मौजूदा SQL schema/server path का user-role model `user`/`admin` है। इसलिए केवल OAuth account होना भी care dashboard access के लिए पर्याप्त नहीं है।

**Firebase status की भ्रामक लग सकने वाली बात:** deployed `/api/integrations/status` ने `configuredCount: 1` दिखाया और Firebase entry में `configured: true` था; उसी live response ने Firebase को `implementation: "not-implemented"` और `productionReady: false` कहा। `configured` का अर्थ environment variable मौजूद है—यह OTP, Firestore, role या account linking काम करने का प्रमाण नहीं।

## Website app जैसी क्यों दिख सकती है?

Repository में public website और Expo mobile app अलग हैं:

- Public landing page: `website/index.html`, `website/styles.css`, `website/site.js`.
- Mobile app: Expo Router के `app/` routes; यह अलग installable application है।
- `website/admin.html` restricted admin dashboard नहीं है; यह अभी unavailable notice है।

Local Pages build में marketing landing page, अलग admin notice और public API config बने। Website में responsive cards हैं, इसलिए फोन पर कार्ड-जैसी शैली mobile app जैसी लग सकती है; लेकिन source में app tabs/sign-in shell नहीं है। यदि live Cloudflare URL पर Home/Meds/SOS/Family app screens दिख रहे हैं, तो सबसे सम्भावित कारण Cloudflare Pages का गलत project/output या गलत URL है—यह इस audit से live hostname पर सत्यापित नहीं हो सका, क्योंकि exact `pages.dev`/custom-domain URL उपलब्ध नहीं है।

Cloudflare Pages के सही settings यह होने चाहिए:

```text
Production branch: main
Root directory: website
Build command: node build.mjs
Build output directory: dist
VITE_API_URL: https://eldercare-api-vaee.onrender.com
PUBLIC_DOWNLOAD_URL: खाली रखें जब तक वैध APK link न बने
```

इन settings के साथ build `website/dist/index.html` serve करे, Expo `build/web` नहीं। वेबसाइट के source में APK CTA default रूप से disabled है; वर्तमान local build config में `downloadUrl` खाली है।

## API/Render की वर्तमान स्थिति

- `main` के commit `021adc1` के लिए GitHub deployment record में Render state **success** है।
- Live `GET /api/integrations/status` ने HTTP 200 दिया।
- `GET /api/health` पहली कोशिश में 25 सेकंड timeout हुआ, फिर retry पर HTTP 200 और JSON `{ "ok": true }` लगभग 3.1 सेकंड में मिला। इससे API कभी-कभी धीमा/अस्थिर दिखा; अभी उपलब्ध प्रमाण से timeout का सटीक कारण तय नहीं किया जा सकता। Render Free पर cold start/sleep संभावित कारण है, लेकिन यह अकेला root cause सिद्ध नहीं हुआ।
- API process चल रहा है; पर care product API पूरा नहीं है। मौजूदा auth routes `/me` और `/logout` हैं। Parent/Child/Staff role lifecycle, Firestore care records, family invites/consent, medication schedule, booking/visit workflows, health ingestion, SOS delivery और admin dashboard endpoints मौजूद/verified नहीं हैं। Provider adapters होना इन workflows के बराबर नहीं।
- Current Render plan Blueprint में Free है; critical-time SOS या medication escalation इस hosting tier पर निर्भर नहीं होनी चाहिए।

अर्थात “API deploy है” सही है; “API से login/care features चल रहे हैं” सही नहीं है।

## APK क्यों नहीं बना/क्यों live नहीं है?

Android app की source project मौजूद है और `eas.json` में preview APK तथा production AAB profiles हैं। लेकिन इससे APK अपने-आप नहीं बनता। इस checkout में:

1. Expo/EAS project link ID (`extra.eas.projectId`) नहीं मिला।
2. EAS CLI इस environment में उपलब्ध/authorized नहीं था; कोई EAS build job नहीं चलाया गया।
3. Android SDK/ADB और `ANDROID_HOME` उपलब्ध नहीं थे; local native build नहीं किया जा सका।
4. Actual `.apk` artifact या physical Android device validation प्रमाणित नहीं है।
5. `PUBLIC_DOWNLOAD_URL` खाली है, इसलिए website जानबूझकर APK download नहीं दिखाती।
6. APK बन भी जाए तो उसके अंदर login अभी unavailable ही रहेगा—APK बनना auth implementation नहीं है।

Preview APK के लिए Expo account में EAS project link/init, approved Android package ID, public API URL और EAS build credentials चाहिए; फिर `npx eas-cli build --platform android --profile preview` चलाकर artifact download/install करना होगा। Expo/Google Play credentials केवल उनके secure dashboards में दें; chat या GitHub में नहीं।

## अभी क्या-क्या पूरा है और क्या नहीं

| हिस्सा | जाँचा हुआ | बाकी मुख्य काम |
|---|---|---|
| GitHub | UI commit `021adc1` `main` पर है | कोई नहीं; push पूरा |
| Render | deployment success; health retry और integrations endpoint जवाब देते हैं | धीमे health response की monitoring; असली auth/care routes अभी बनें |
| Cloudflare source | अलग, professional landing-page source और static Pages build मौजूद; local build pass | live Pages URL/settings verify करना; अगर app screens दिखें तो Pages root/output सही करना |
| Mobile UI | Expo app अलग; fail-closed UI और protected screens | वास्तविक sign-in/account flows, trusted roles और backend-connected care data |
| APK | EAS profiles source में हैं | EAS project/account/build, artifact और physical-device QA |
| Download link | safe disabled placeholder | validated APK upload के बाद ही URL configure करना |

## अगला सही क्रम

1. **पहले दो non-secret जवाब दें:** (a) आपका exact Cloudflare live URL, और वहाँ अभी कौन-सा page दिख रहा है; (b) sign-in किससे चाहिए—Firebase phone OTP, email/password, या पुराने Manus OAuth को रखना है। अगर live URL साझा करें तो मैं सही Pages output verify कर सकता हूँ।
2. **Roles तय करें:** Parent, Child/Family, Care Partner/Staff में कौन पहले release में होगा; signup खुला होगा या invitation/admin approval से; account linking में दोनों पक्षों की consent कैसी होगी। Client को स्वयं अपना role चुनने नहीं देना है।
3. **Database/identity निर्णय:** Firebase Auth + Firestore migration को मंजूरी दें या Manus OAuth/MySQL path रखें। दोनों को बिना स्पष्ट migration plan मिलाकर न चलाएँ।
4. इन decisions के बाद वास्तविक auth token verification, role model, consented care APIs और चुने गए Phase-1 workflows implement करें। Firebase/provider secrets आप अपने Firebase/Render dashboards में रखें—secret chat में न भेजें।
5. API deploy और sign-in/role-denial/data-isolation tests के बाद EAS project link करके internal APK बनाएँ; physical Android phone पर install/QA करें। फिर ही approved APK URL Cloudflare `PUBLIC_DOWNLOAD_URL` में दें।

**Bottom line:** अभी यह “एक key जोड़कर live” वाली स्थिति नहीं है। Deployments हुए हैं और UI/API scaffolding मौजूद है, पर login और care behavior इसलिए dummy/unavailable लगते हैं क्योंकि production auth/roles/domain workflows अभी code में implemented नहीं; website और mobile app अलग artifacts हैं; APK build/artifact भी अभी बना/verify नहीं हुआ।
