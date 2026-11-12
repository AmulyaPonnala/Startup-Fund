# Startup-Fund

A platform that matches early-stage startups with investors. A founder fills in a startup profile, and a learning-to-rank model orders investor firms by how likely they are to be a fit. Built with Ramanjit Singh in April 2025.

## How it works

```
Next.js app (profile, dashboard, investor network, chat)
      │                         │
Firebase Auth + Data Connect    POST /predict
(users, startup profiles)       │
                                Flask service ── XGBoost ranker ── investor dataset (CSV)
```

- The web app (`app/`) has sign-up and login, a startup profile form (industry, stage, funding required and more), a dashboard, an investor network page and a chat page. UI is built with shadcn/ui.
- Firebase Authentication handles accounts, and Firebase Data Connect stores startup profiles (GraphQL schema in `dataconnect/schema/schema.gql`).
- The ranking service (`app/investor-network/app.py`) is a Flask API on port 5000. It filters the investor dataset, builds one feature row per firm from the startup's industry, stage and funding need, label-encodes the categorical fields, and scores every firm with an XGBoost ranking model (`xgb_startup_investor_ranker.model`). The model was evaluated with NDCG. The response is investor firms ordered by score.

## Run it

Web app:

```bash
npm install
npm run dev            # http://localhost:3000
```

Set these in `.env.local`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, plus `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` for the admin SDK.

Ranking service:

```bash
cd app/investor-network
pip install flask flask-cors pandas numpy scikit-learn xgboost joblib
python app.py          # http://localhost:5000/predict
```

## Stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Firebase Auth and Data Connect, Python, Flask, XGBoost, scikit-learn.
