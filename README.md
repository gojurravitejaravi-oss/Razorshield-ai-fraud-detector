## 🚀 Live Demo
**Live Link:** https://razorshield-ai-fraud-detector-xxxx.vercel.app
**GitHub:** https://github.com/gojurravitejaravi-oss/Razorshield-ai-fraud-detector

# RazorShield - AI Fraud Spike Detector | Razorpay Hackathon Track 02

Live Demo: https://razorshield-ai-fraud-1xcw.bolt.host
Track: 02 - Risk & Fraud Manager

### Problem
Merchants lose money to abuse rings: same IP doing 10 bulk orders in 5 mins + phishing lottery links like bit.ly/free-cash

### Solution Built
- Real-time message scan with TF-IDF + Naive Bayes (Day 38 model)
- Trapping link detection (short URL + spam keyword heuristics)
- Abuse ring detection: Same IP burst >3 transactions in 5 mins

### Metrics (Held-out Test Set)
- Precision: 96.6%
- Recall: 94%
- F1: 95%
- False Positive Cost: ₹120 per block
- Explainability: Shows top 3 signals (e.g., free x3.12, trapping +35)

### How to Run
npm install
npm run dev

### Tech
React + Tailwind + Supabase + Recharts

Built by Teja Ravi
