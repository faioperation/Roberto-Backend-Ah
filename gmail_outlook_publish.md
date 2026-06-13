# Gmail এবং Outlook Integration পাবলিশিং ও মাল্টি-ইউজার কনফিগারেশন গাইড

এই ডকুমেন্টে জিমেইল (Google OAuth) এবং আউটলুক (Microsoft Entra ID/Azure OAuth) ইন্টিগ্রেশনকে পাবলিক করার এবং মাল্টিপল ইউজার যাতে কানেক্ট করতে পারে সেটির বিস্তারিত গাইডলাইন দেওয়া হলো।

---

## ১. Gmail Integration (Google Auth Platform)

গুগল ওথ (Google OAuth) এর মাধ্যমে জিমেইল ইনবক্স রিড/রাইট করা একটি **Restricted Scope** (সংবেদনশীল অ্যাক্সেস)। সাধারণ ইউজারদের কোনো প্রকার ওয়ার্নিং ছাড়া এটি ব্যবহার করতে দিতে হলে অ্যাপটিকে ভেরিফাই করতে হবে।

### ক. প্রয়োজনীয় তথ্যাদি (Prerequisites/Information Required)
গুগল থেকে অ্যাপ ভেরিফাই করার জন্য এবং পাবলিক করার জন্য নিচের বিষয়গুলো রেডি রাখতে হবে:
1. **ভেরিফাইড ডেমো ওয়েবসাইট:** আপনার অ্যাপের ল্যান্ডিং পেজ বা মেইন ওয়েবসাইট।
2. **ডোমেইন ভেরিফিকেশন:** আপনার ডোমেইনটি অবশ্যই [Google Search Console](https://search.google.com/search-console)-এ ওনারশিপ ভেরিফাইড (Domain Ownership Verified) হতে হবে।
3. **প্রাইভেসি পলিসি (Privacy Policy Link):** একটি লাইভ প্রাইভেসি পলিসি লিঙ্ক যেখানে স্পষ্ট লেখা থাকবে আপনি ইউজারের জিমেইল ডাটা কিভাবে হ্যান্ডেল করছেন।
4. **টার্মস অফ সার্ভিস (Terms of Service Link):** অ্যাপ ব্যবহারের শর্তাবলীর লাইভ লিঙ্ক।
5. **ইউটিউব ডেমো ভিডিও (YouTube Demo Video):** একটি স্ক্রিন রেকর্ডিং ভিডিও (যা ইউটিউবে আনলিস্টেড/পাবলিক অবস্থায় থাকবে)। ভিডিওতে দেখাতে হবে:
   - ইউজার কিভাবে আপনার অ্যাপে লগইন করছে বা কানেক্ট বাটনে ক্লিক করছে।
   - গুগল ওথ কনসেন্ট স্ক্রিনে কি কি পারমিশন চাওয়া হচ্ছে (যেমন: Gmail Readonly)।
   - পারমিশন দেওয়ার পর অ্যাপটি কিভাবে জিমেইল ডাটা ব্যবহার করছে (যেমন: ইনবক্সের মেইল রিড করছে)।
   - ওথ ক্লায়েন্ট আইডি (Client ID) যেন ব্রাউজারের ইউআরএল বারে স্পষ্ট দেখা যায়।

---

### খ. ওথ কনসোল সেটিংস (Step-by-Step Guide)

[Google Cloud Console](https://console.cloud.google.com/)-এ গিয়ে আপনার প্রজেক্ট সিলেক্ট করুন এবং **Google Auth Platform** বা **APIs & Services > OAuth consent screen**-এ যান।

#### ১. Audience (পূর্বে User Type/Consent Screen)
* **User Type:** এটিকে **External** হিসেবে সিলেক্ট করুন যেন যেকোনো গুগল ইউজার (ব্যক্তিগত বা প্রাতিষ্ঠানিক) কানেক্ট করতে পারে।
* **Publishing status:** অ্যাপটি সবার জন্য ওপেন করতে **"Publish App"** বাটনে ক্লিক করুন। স্ট্যাটাসটি **In Production** এ পরিবর্তিত হবে।
* *নোট:* যতক্ষণ ভেরিফিকেশন সম্পন্ন না হচ্ছে, নতুন ব্যবহারকারীরা ওথ পেজে একটি লাল ওয়ার্নিং স্ক্রিন দেখতে পাবেন। ভেরিফিকেশন সম্পূর্ণ হলে এই ওয়ার্নিং চলে যাবে।

#### ২. Data Access (Scopes Configuration)
* **Scopes** সেকশনে গিয়ে **Add or Remove Scopes** বাটনে ক্লিক করুন।
* জিমেইল ইনবক্স রিড করার জন্য নিচের স্কোপগুলো সিলেক্ট করুন:
  - `https://www.googleapis.com/auth/gmail.readonly` (মেইল পড়ার জন্য)
  - `https://www.googleapis.com/auth/gmail.modify` (মেইল রিড, লেবেল পরিবর্তন ও রিড/আনরিড করার জন্য)
* জিমেইল স্কোপগুলো Restricted হওয়ায় গুগল টিম আপনার অ্যাপটি রিভিউ করার পর অ্যাপ্রুভ করবে।

#### ৩. Branding
* আপনার অ্যাপের নাম (App name), সাপোর্ট ইমেইল (User support email), এবং লোগো আপলোড করুন।
* আপনার ওয়েবসাইটের **Privacy Policy Link** এবং **Terms of Service Link** যুক্ত করুন।

#### ৪. Verification Center
* আপনার অ্যাপটির ভেরিফিকেশন স্ট্যাটাস দেখতে এবং রিভিউ সাবমিট করতে এখানে যান।
* প্রয়োজনীয় সকল তথ্য (ভিডিও লিঙ্ক ও ব্যবহারের বর্ণনা) দিয়ে **Submit for Verification** ক্লিক করুন। রিভিউ প্রসেস সফল হতে ৩ থেকে ৭ কার্যদিবস লাগতে পারে।

---

🛑🛑🛑🛑## ২. Outlook Integration (Microsoft Azure Portal / Entra ID)

আউটলুক বা মাইক্রোসফট ইন্টিগ্রেশনের ক্ষেত্রে ভেরিফিকেশন প্রসেস গুগলের মতো কঠিন নয়, তবে একাধিক বাইরের ইউজারকে কানেক্ট করতে দিতে হলে অ্যাপটিকে **Multitenant (মাল্টি-টেন্যান্ট)** করতে হবে।

### ক. প্রয়োজনীয় তথ্যাদি (Prerequisites/Information Required)
1. **ডেলিগেটেড পারমিশন (Delegated Permissions):** মাইক্রোসফট গ্রাফ এপিআই (Microsoft Graph API)-এর ইমেইল রিড পারমিশন।
2. **রিডাইরেক্ট ইউআরআই (Redirect URI):** ওথ রিডাইরেক্ট সম্পন্ন হওয়ার জন্য ব্যাকএন্ডের ইউআরএল কনফিগার করা।
3. **ভেরিফাইড মাইক্রোসফট পার্টনার আইডি (MPN ID - ঐচ্ছিক):** এটি অ্যাপের ওথ কনসেন্ট স্ক্রিনে "Unverified Publisher" ওয়ার্নিং দূর করতে সাহায্য করে।

---

### খ. পোর্টাল সেটিংস (Step-by-Step Guide)

[Azure Portal](https://portal.azure.com/)-এ লগইন করে **Microsoft Entra ID** (বা Azure Active Directory) > **App registrations**-এ যান এবং আপনার তৈরি করা আউটলুক অ্যাপটি সিলেক্ট করুন।

#### ১. Authentication (ইউজার টাইপ সেট করা)
* বাম পাশের মেনু থেকে **Authentication**-এ ক্লিক করুন।
* স্ক্রোল করে নিচে **Supported account types** সেকশনে যান।
* আপনার প্রয়োজন অনুযায়ী নিচের অপশনটি সিলেক্ট করুন:
  * **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**
    *(এটি সিলেক্ট করলে যেকোনো বিজনেস/অফিসের অ্যাকাউন্ট এবং ব্যক্তিগত আউটলুক/হটমেইল অ্যাকাউন্ট কানেক্ট করতে পারবে।)*
* নিচে **Save** বাটনে ক্লিক করুন।

#### ২. API Permissions (গ্রাফ এপিআই পারমিশন)
* বাম পাশের মেনু থেকে **API permissions**-এ ক্লিক করুন।
* **Add a permission** > **Microsoft Graph** > **Delegated permissions**-এ যান।
* সার্চ বারে **Mail** লিখে খুঁজুন এবং নিচের পারমিশনগুলো সিলেক্ট করুন:
  - `Mail.Read` (মেইল পড়ার জন্য)
  - `Mail.ReadWrite` (মেইল রিড/রাইট করার জন্য)
* পারমিশন যোগ করার পর নিচে **Add permissions** বাটনে ক্লিক করুন।

#### ৩. Branding & properties (পাবলিশার ভেরিফিকেশন)
* বাম পাশের মেনু থেকে **Branding & properties**-এ যান।
* আপনার কোম্পানির নাম, লোগো এবং প্রাইভেসি পলিসি লিঙ্ক যুক্ত করুন।
* যদি আপনার মাইক্রোসফটের কোনো ভেরিফাইড অর্গানাইজেশন অ্যাকাউন্ট থাকে, তবে **Publisher verification** সেকশনে গিয়ে **MPN ID** কানেক্ট করুন। এতে ওথ স্ক্রিনের ওপরে ব্রাউন কালারের ওথ ভেরিফাইড ব্যাজ শো করবে।

---

## ৩. কোড ও ব্যাকএন্ডে লক্ষণীয় বিষয় (For Code Integration)

অ্যাপগুলো সবার জন্য উন্মুক্ত করার পর আপনার কোডের কনফিগারেশন ফাইল বা `.env` ফাইলে কিছু পরিবর্তন নিশ্চিত করতে হবে:

1. **গুগল ওথ রিডাইরেক্ট ইউআরএল (Google Redirect URL):**
   * লোকালহোস্টের পরিবর্তে আপনার লাইভ ব্যাকএন্ড ডোমেইন বা ngrok লিঙ্কটি গুগল কনসোলে রিডাইরেক্ট ইউআরআই (Redirect URIs) লিস্টে যুক্ত করুন (যেমন: `https://accustomed-maryalice-bubbleless.ngrok-free.dev/api/v1/auth/google/callback`).

2. **মাইক্রোসফট ওথ এন্ডপয়েন্ট (Microsoft Endpoint / Tenant ID):**
   * ব্যাকএন্ডে ওথ এন্ডপয়েন্টের ভেতরে কোনো নির্দিষ্ট টেন্যান্ট আইডি (Tenant UUID) যেন হার্ডকোড করা না থাকে।
   * মাল্টিপল ইউজার কানেক্ট করতে টেন্যান্ট আইডির জায়গায় **`common`** ব্যবহার করুন।
   * **Authorization Endpoint:** `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
   * **Token Endpoint:** `https://login.microsoftonline.com/common/oauth2/v2.0/token`
