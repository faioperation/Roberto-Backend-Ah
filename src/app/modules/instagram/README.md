# Instagram মডিউল - Robarto Omnichannel Backend

এই মডিউলটি Robarto Omnichannel System এর সাথে **Instagram Graph API (Messaging)** এর ইন্টিগ্রেশন হ্যান্ডেল করে। এর মাধ্যমে যেকোনো বিজনেস তাদের Instagram Business বা Creator অ্যাকাউন্ট কানেক্ট করে কাস্টমারদের পাঠানো মেসেজগুলোর রিপ্লাই সরাসরি Robarto ড্যাশবোর্ড থেকে দিতে পারবে।

---

## ১. পূর্বশর্ত বা Prerequisites (Environment Variables)
এই মডিউলটি চালানোর আগে আপনার `.env` ফাইলে নিচের ভেরিয়েবলগুলো অবশ্যই থাকতে হবে:

```env
# Meta App Credentials
META_APP_ID="your_meta_app_id"
META_APP_SECRET="your_meta_app_secret"
META_GRAPH_VERSION="v23.0"

# Webhook Verification
META_WEBHOOK_VERIFY_TOKEN="robarto_instagram_verify_2026"

# Frontend / App URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="https://your-ngrok-url.ngrok-free.dev" # Webhook এর জন্য অবশ্যই HTTPS হতে হবে
```

---

## ২. Meta Developer Dashboard সেটআপ

এই মডিউলটি সঠিকভাবে কাজ করানোর জন্য [Meta Developer Dashboard](https://developers.facebook.com/)-এ আপনার অ্যাপটি নিচের মতো করে কনফিগার করা থাকতে হবে।

### A. App Type & Use Cases
১. অ্যাপের Type অবশ্যই **Business** হতে হবে।
২. নিচের **Use Cases** গুলো অ্যাড করতে হবে:
   - *Manage messaging and content on Instagram*
   - *Facebook Login for Business*

### B. প্রয়োজনীয় Permissions
**App Review > Permissions and Features** (বা Use Cases > Permissions) এ গিয়ে নিচের পারমিশনগুলো অ্যাড করে নিন:
- `instagram_basic`
- `instagram_manage_messages`
- `pages_show_list`
- `pages_manage_metadata`

*(নোট: অ্যাপটি Development mode এ থাকা অবস্থায় আপনি যেকোনো কাউকে মেসেজ দিতে পারবেন না। শুধুমাত্র App Roles এ "Instagram Testers" হিসেবে অ্যাড করা অ্যাকাউন্টেই মেসেজ আদান-প্রদান করা যাবে। প্রডাকশনের জন্য আপনাকে এই পারমিশনগুলোর **Advanced Access** নিতে App Review রিকোয়েস্ট সাবমিট করতে হবে)।*

### C. Webhook কনফিগারেশন
১. Meta App Dashboard থেকে **Webhooks** প্রোডাক্টে যান।
২. ড্রপডাউন থেকে **Instagram** সিলেক্ট করুন।
৩. **Edit Subscription** এ ক্লিক করে নিচের তথ্যগুলো দিন:
   - **Callback URL:** `<BACKEND_URL>/api/v1/webhook/instagram`
   - **Verify Token:** `<META_WEBHOOK_VERIFY_TOKEN>` (যেমন: `robarto_instagram_verify_2026`)
৪. `messages` ফিল্ডটিতে সাবস্ক্রাইব (Subscribe) করে দিন।

---

## ৩. Database (Prisma)
এই মডিউলের জন্য আপনার Prisma Schema (`schema.prisma`)-তে নিচের মডেলগুলো থাকা প্রয়োজন:

- **`SocialConnection`**: বিজনেসের Instagram Account ID (`igAccountId`), Access Token (`accessToken`), এবং Provider (`instagram`) সেভ করে রাখার জন্য।
- **`Conversation`**: বিজনেস এবং কাস্টমারের মধ্যকার চ্যাট ট্র্যাকিং করার জন্য।
- **`Message`**: প্রতিটি আলাদা মেসেজ (টেক্সট, ছবি, অডিও ইত্যাদি) সেভ করার জন্য।

---

## ৪. API Endpoints কীভাবে কাজ করে

### A. অ্যাথেনটিকেশন এবং কানেকশন (OAuth)
- **`GET /api/v1/instagram/auth/facebook`**
  এটি Facebook এর লগিন URL জেনারেট করে। ফ্রন্টএন্ড থেকে ইউজারকে এই লিংকে রিডাইরেক্ট করতে হবে, যাতে সে তার অ্যাকাউন্ট সিলেক্ট করে পারমিশন দিতে পারে।
- **`GET /api/v1/instagram/auth/facebook/callback`**
  লগিন সাকসেসফুল হওয়ার পর Meta এই রাউটে ডেটা পাঠায়। এটি শর্ট-লিভড টোকেন দিয়ে লং-লিভড টোকেন তৈরি করে এবং ইউজারের Instagram Business অ্যাকাউন্টগুলো ডাটাবেইজে (`SocialConnection`) সেভ করে।

### B. Webhooks (ইনকামিং মেসেজ)
- **`GET /api/v1/webhook/instagram`**
  Meta ড্যাশবোর্ড থেকে Webhook ভেরিফাই করার জন্য এটি ব্যবহার হয়।
- **`POST /api/v1/webhook/instagram`**
  কাস্টমার মেসেজ দিলে তা রিয়েল-টাইমে এই রাউটে আসে। ব্যাকএন্ড সেটি ডাটাবেইজে সেভ করে।

### C. মেসেজ পাঠানো (আউটগোয়িং)
- **`POST /api/v1/instagram/messages/send`**
  Instagram ইউজারকে শুধু টেক্সট মেসেজ পাঠানোর জন্য।
  - **Body (JSON):** 
    ```json
    {
      "recipientId": "<IGSID_OF_CUSTOMER>",
      "message": "Hello from Robarto!"
    }
    ```
- **`POST /api/v1/instagram/messages/media`**
  ছবি, ভিডিও বা অডিও পাঠানোর জন্য। 
  - **Body (Form-Data):**
    - `recipientId`: `<IGSID_OF_CUSTOMER>`
    - `type`: `image`, `video`, অথবা `audio`
    - `file`: (আপনার এটাচমেন্ট ফাইলটি)

### D. ডেটা রিট্রিভ (লিস্ট দেখা)
- **`GET /api/v1/instagram/status`**
  কোনো বিজনেসের Instagram কানেক্ট করা আছে কিনা এবং কোন অ্যাকাউন্টে কানেক্ট করা আছে তা জানার জন্য।
- **`GET /api/v1/instagram/conversations`**
  বিজনেসের সব Instagram কনভারসেশনের লিস্ট পাওয়ার জন্য।
- **`GET /api/v1/instagram/messages/:conversationId`**
  নির্দিষ্ট কোনো কনভারসেশনের ভেতরের সব মেসেজ দেখার জন্য।

---

## ৫. টেস্টিং এবং ডিবাগিং (গুরুত্বপূর্ণ এরর)
- **`(#3) Application does not have the capability to make this API call:`**
  এর মানে হলো আপনার ডাটাবেইজে থাকা টোকেনটিতে মেসেজ পাঠানোর পারমিশন নেই (হয়তো আপনি পরে পারমিশন অ্যাড করেছেন কিন্তু নতুন করে লগিন করেননি)। আবার নতুন করে OAuth লিংকে গিয়ে লগিন করলে এররটি ঠিক হয়ে যাবে।
- **`(#200) App does not have Advanced Access...:`**
  Development Mode এ থাকা অবস্থায় অপরিচিত কাউকে মেসেজ পাঠানো যায় না। যাকে মেসেজ পাঠাবেন, তার Instagram অ্যাকাউন্টটিকে অবশ্যই Meta Dashboard এর **App Roles > Roles > Instagram Testers** এ অ্যাড করতে হবে। এরপর তাকে নিজের Instagram অ্যাপের `Settings > Apps and websites > Tester Invites` থেকে ইনভাইটটি Accept করতে হবে।
- **Endpoint এর নিয়ম:** Instagram এ মেসেজ পাঠানোর জন্য Facebook Page এর Access Token ব্যবহার করে `https://graph.facebook.com/<VERSION>/me/messages` এপিআই-তে হিট করতে হয় এবং `recipient.id` হিসেবে ইউজারের Instagram-Scoped ID (IGSID) দিতে হয়।
