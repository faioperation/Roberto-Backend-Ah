# Facebook Messenger Integration Guide (Bangla)

এই ডকুমেন্টটি নতুন ডেভেলপারদের জন্য তৈরি করা হয়েছে যাতে তারা খুব সহজেই বুঝতে পারে সিস্টেমে Facebook Messenger কিভাবে ইন্টিগ্রেট করা হয়েছে এবং এর ফ্লো (Flow) কিভাবে কাজ করে।

---

## ১. Meta Developer Console থেকে Credentials সংগ্রহ
সিস্টেমটি কাজ করার জন্য প্রথমে Facebook (Meta) Developer portal থেকে কিছু ক্রেডেনশিয়াল বা ডাটা নিতে হবে:

1. [Meta for Developers](https://developers.facebook.com/) এ গিয়ে একটি নতুন App তৈরি করুন (Business type)।
2. **App Dashboard** থেকে **App Settings > Basic** এ যান।
   - সেখানে **App ID** এবং **App Secret** পাবেন। এগুলো প্রোজেক্টের `.env` ফাইলে দিতে হবে।
3. **Messenger** প্রোডাক্টটি আপনার অ্যাপে অ্যাড করুন।
   - **Webhooks** সেকশনে গিয়ে `Callback URL` হিসেবে আপনার ngrok বা লাইভ সার্ভারের লিংকটি দিন (যেমন: `https://your-domain.com/api/v1/webhook/facebook`)।
   - **Verify Token** হিসেবে একটি সিক্রেট পাসওয়ার্ড দিন (যেমন: `roberto_webhook_verify_2026`)।
   - সাবস্ক্রিপশন ফিল্ডে `messages`, `messaging_postbacks`, `messaging_optins` সিলেক্ট করুন।

---

## ২. Environment Variables (.env) ও কনফিগারেশন
আপনার প্রোজেক্টের `.env` ফাইলে নিচের ভ্যালুগুলো যোগ করতে হবে:

```env
# Meta Account Credentials
META_APP_ID=আপনার_ফেসবুক_অ্যাপ_আইডি
META_APP_SECRET=আপনার_ফেসবুক_অ্যাপ_সিক্রেট
META_GRAPH_VERSION=v23.0

# Messenger Integration Env
FACEBOOK_REDIRECT_URI=https://your-domain.com/api/v1/auth/facebook/callback
FACEBOOK_VERIFY_TOKEN=roberto_webhook_verify_2026
```
> 💡 **কোথায় লোড হচ্ছে?** এই ভ্যালুগুলো `src/app/config/env.js` ফাইলে লোড করা হয়েছে যাতে পুরো অ্যাপে যেকোনো জায়গা থেকে সিকিউর ভাবে ব্যবহার করা যায়।

---

## ৩. ডাটাবেস আর্কিটেকচার (Prisma)
ফেসবুকের ডাটা সেভ করার জন্য `prisma/schema.prisma` ফাইলে ৩টি নতুন মডেল তৈরি করা হয়েছে এবং `Business` ও `Branch` এর সাথে রিলেশন করা হয়েছে:

- **`SocialConnection`**: যখন কোনো Business Owner তাদের ফেসবুক পেজ কানেক্ট করবে, তখন ওই পেজের ID, Name এবং Access Token এই টেবিলে সেভ হবে। পরবর্তীতে মেসেজ পাঠানোর সময় এই টোকেনটি কাজে লাগবে।
- **`Conversation`**: কাস্টমার এবং পেজের মধ্যে হওয়া চ্যাটের থ্রেড বা লিস্ট এখানে সেভ হয়। শেষ মেসেজটি (`lastMessage`) এখানে সেভ থাকে যাতে ফ্রন্টএন্ডে চ্যাটলিস্ট দেখানো সহজ হয়।
- **`Message`**: প্রতিটি সিঙ্গেল মেসেজ এই টেবিলে সেভ হয়। মেসেজটি কাস্টমার দিয়েছে নাকি পেজ থেকে দেওয়া হয়েছে সেটা `senderType` (`business` নাকি `customer`) দিয়ে বোঝা যায়।

*(নোট: নতুন মডেল অ্যাড বা এডিট করার পর অবশ্যই `npm exec prisma migrate dev --name <migration_name>` কমান্ড রান করতে হবে)*

---

## ৪. কোড স্ট্রাকচার ও ফাইল পরিচিতি
পুরো মেসেঞ্জার লজিকটি `src/app/modules/messenger/` ফোল্ডারে মডিউলার আর্কিটেকচারে রাখা হয়েছে:

### 📄 `facebook.service.js`
এই ফাইলে Facebook Graph API এর সাথে কথা বলার জন্য ফাংশন লেখা আছে।
- `getLongLivedToken()`: শর্ট-টাইম টোকেন দিয়ে লং-টাইম (৬০ দিন মেয়াদি) টোকেন আনা।
- `getPageTokens()`: ইউজার কোন কোন পেজের অ্যাডমিন, সেই পেজগুলোর ডাটা এবং অ্যাক্সেস টোকেন আনা।
- `subscribeAppToPage()`: ফেসবুক পেজের সাথে আমাদের অ্যাপের ওয়েবহুক অটোমেটিক কানেক্ট করা।

### 📄 `webhook.service.js`
ফেসবুক যখন কোনো নতুন মেসেজের নোটিফিকেশন (Webhook event payload) পাঠায়, তখন এই ফাইলটি সেটা রিসিভ করে। মেসেজটি ভ্যালিড কি না চেক করে এবং ইকো মেসেজ (পেজ নিজে মেসেজ দিলে যে নোটিফিকেশন আসে) ইগনোর করে।

### 📄 `messenger.service.js`
এটি ডাটাবেস এবং মেসেজ পাঠানোর মেইন সার্ভিস।
- `handleIncomingMessage()`: কাস্টমার মেসেজ দিলে সেটি ডাটাবেসে `Conversation` এবং `Message` টেবিলে সেভ করে।
- `sendMessageToUser()`: সিস্টেম থেকে কাস্টমারকে রিপ্লাই দেওয়ার জন্য ফেসবুকের API কল করে এবং পাঠানো মেসেজটি ডাটাবেসে সেভ করে।

### 📄 `messenger.controller.js`
এখানে সবগুলো API এর রিকোয়েস্ট এবং রেসপন্স হ্যান্ডেল করা হয়।
- `authFacebook` & `authFacebookCallback`: ফেসবুক লগইন এবং পেজ কানেক্ট করার ফ্লো কন্ট্রোল করে।
- `verifyWebhook`: ফেসবুক যখন প্রথমবার ওয়েবহুক সেটআপের সময় ভেরিফাই করে, তখন টোকেন মিলিয়ে `hub.challenge` রিটার্ন করে।
- `handleWebhookEvent`: ফেসবুকের ওয়েবহুক ইভেন্ট রিসিভ করে।
- `sendMessengerMessage`: আমাদের প্ল্যাটফর্ম থেকে মেসেজ পাঠানোর API কন্ট্রোলার।

### 📄 `messenger.route.js`
এখানে API এর রাউটগুলো ডিফাইন করা হয়েছে:
- `GET /api/v1/auth/facebook?businessId=...` (লগইন লিংক)
- `GET /api/v1/auth/facebook/callback` (লগইন সাকসেস হওয়ার পর ফেসবুক এখানে রিডাইরেক্ট করে)
- `GET /api/v1/webhook/facebook` (ফেসবুকের ওয়েবহুক ভেরিফিকেশন)
- `POST /api/v1/webhook/facebook` (কাস্টমারের মেসেজ রিসিভ করার রাউট)
- `POST /api/v1/messages/send` (কাস্টমারকে মেসেজ সেন্ড করার রাউট)

---

## ৫. পুরো সিস্টেমটি কিভাবে কাজ করে? (Step-by-Step Flow)

1. **পেজ কানেক্ট করা (OAuth):** 
   Business Owner ফ্রন্টএন্ড থেকে একটি বাটনে ক্লিক করবে যা তাকে `GET /api/v1/auth/facebook?businessId=123` এ নিয়ে যাবে।
2. **লগইন ও পারমিশন:** 
   ইউজার ফেসবুকে লগইন করে পেজের পারমিশন দিবে।
3. **টোকেন সেভ ও ওয়েবহুক সাবস্ক্রাইব:** 
   ফেসবুক ইউজারকে আমাদের `callback` রাউটে পাঠাবে। আমাদের সিস্টেম তখন পেজগুলোর টোকেন এনে `SocialConnection` টেবিলে সেভ করবে এবং পেজের ওয়েবহুক অটোমেটিক চালু করে দিবে।
4. **মেসেজ রিসিভ করা:** 
   কোনো কাস্টমার পেজে মেসেজ দিলে ফেসবুক আমাদের `POST /api/v1/webhook/facebook` এ হিট করবে এবং আমরা মেসেজটি ডাটাবেসে সেভ করব।
5. **মেসেজ রিপ্লাই দেওয়া:** 
   সিস্টেমের ফ্রন্টএন্ড থেকে `POST /api/v1/messages/send` এ হিট করে (payload এ `businessId`, `recipientId`, `message` দিয়ে) কাস্টমারকে রিপ্লাই দেওয়া যাবে।
