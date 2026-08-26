# 🛡️ RazorShield - AI Fraud Spike Detector
### Razorpay Hackathon 2025 | Track 02 - Risk & Fraud Management

## 🚀 Live Demo / Live Website
**https://razorshield-ai-fraud-1xcw.bolt.host**

## 💻 GitHub Repository
**https://github.com/gojurravitejaravi-oss/Razorshield-ai-fraud-detector**

## 🎥 Demo Video
[https://drive.google.com/file/d/1YhcgNbPOKBhvnLsFdaD_Thl8TLT5EV8I/view?usp=drivesdk]

---

### 📌 Problem Statement
Razorpay merchants face sudden fraud spikes:
- Same IP doing 10+ bulk orders in 5 minutes (Abuse Ring)
- Phishing SMS/Email with trapping links like bit.ly/offer
- Bot transactions vs genuine customers

### 💡 Our Solution
RazorShield detects fraud in real-time using AI + Heuristics:

1. **Message Scam Detection** - TF-IDF + Naive Bayes model (trained on 200+ phishing samples) detects scam SMS/email
2. **Trapping Link Detector** - Flags short URLs + spam keywords (free gift, urgent KYC, win prize)
3. **Abuse Ring / Velocity Check** - Flags if same IP/email does >3 transactions in 5 mins
4. **Risk Scoring** - Returns Risk % + Reason (Safe / Review / Block)

### 🧠 Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Python FastAPI
- **ML Model:** Scikit-learn TF-IDF Vectorizer + Naive Bayes (Day 38 model)
- **Deployment:** Bolt.host
- **Version Control:** GitHub

### ⚙️ How It Works
1. User pastes transaction message / SMS in Live Demo
2. Frontend sends to `/predict` API
3. ML model checks for phishing keywords + URL
4. Velocity check checks IP burst
5. Returns: `{"risk_score": 92%, "status": "BLOCK", "reason": "Phishing + Trapping Link"}`

### 🧪 How to Test (For Judges)
1. Open Live Demo: https://razorshield-ai-fraud-1xcw.bolt.host
2. Test Case 1 - Phishing: Paste `Your KYC blocked! Click bit.ly/rzp-update urgently`
   - Expected: Risk 90%+ BLOCK
3. Test Case 2 - Safe: Paste `Your order #1234 confirmed for Rs. 499`
   - Expected: Risk <10% SAFE
4. Test Case 3 - Abuse Ring: Try same IP 4 times quickly
   - Expected: Flagged as Abuse Ring


