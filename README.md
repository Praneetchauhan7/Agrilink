# KisanSetu — From Farm Gate to Better Markets

KisanSetu is a digital agricultural marketplace connecting farmers, FPOs (Farmer Producer Organizations), institutional buyers, and other participants in the agricultural supply chain through a transparent, technology-driven platform.

The platform focuses on improving market access for farmers, reducing dependency on intermediaries, and making agricultural trade more transparent and efficient — combining multi-farmer stock aggregation with real-time market price discovery sourced from official government data.

**Live Website:** [https://kisansetu-0cjn.onrender.com/](https://kisansetu-0cjn.onrender.com/)
**Repository:** [https://github.com/Praneetchauhan7/Agrilink](https://github.com/Praneetchauhan7/Agrilink)

## 1. Project Information

| Field | Details |
|---|---|
| Project Title | KisanSetu – From Farm Gate to Better Markets |
| Project Type | Full-stack web application (responsive) |
| Domain | Smart Agriculture / AgriTech |
| Live Website | https://kisansetu-0cjn.onrender.com/ |
| Repository | https://github.com/Praneetchauhan7/Agrilink |
| Primary Goal | Connect agricultural producers with markets and improve transparency in agricultural trade, via multi-farmer stock aggregation and real-time price discovery |

> **Note:** KisanSetu is currently a single responsive web application — there is no separate native or mobile-app codebase in the repository at this time. It works on mobile browsers through responsive design, but "Mobile Application" should not be listed as a distinct deliverable until a dedicated mobile client exists.

## 2. Problem Statement

Farmers often face difficulties accessing reliable markets and receiving fair value for their produce. Traditional agricultural supply chains involve multiple intermediaries, limited price transparency, fragmented buyer access, and inefficient communication between producers and buyers.

These challenges reduce farmer income while making the agricultural trading process less transparent and efficient — a problem that is compounded when individual farmers have too little volume on their own to interest institutional buyers.

## 3. Proposed Solution

KisanSetu provides a centralized digital platform that bridges the gap between agricultural producers and markets. It is built around moving agricultural trade closer to the farm gate, enabling better connectivity between farmers and buyers — including FPOs and institutional buyers — through a modern digital interface, multi-farmer stock aggregation, and real-time market price discovery backed by official government pricing data.

**Core objectives**
- Improve direct market access for farmers
- Reduce unnecessary dependency on intermediaries
- Increase transparency in agricultural transactions
- Make agricultural products easier for buyers, including FPOs and institutional buyers, to discover
- Aggregate stock from multiple farmers to meet institutional order volumes
- Support a more efficient farm-to-market workflow with real-time, government-sourced price discovery
- Create a scalable digital ecosystem for agricultural trade

## 4. Key Features

- **Farmer-Centric Market Access** — helps agricultural producers reach potential markets digitally instead of depending entirely on traditional offline channels.
- **Agricultural Marketplace** — a digital marketplace where agricultural products are presented to potential buyers, including FPOs and institutional buyers.
- **Multi-Farmer Stock Aggregation** — pools produce from multiple farmers so smaller growers can meet the volume requirements of larger, institutional buyers.
- **Real-Time Market Price Discovery** — pulls live APMC (mandi) commodity prices from the official data.gov.in dataset published by the Government of India, giving farmers and buyers a transparent, verifiable reference price.
- **AI-Assisted Insights** — integrates Google's Gemini API to support features such as AI-generated guidance and recommendations within the platform.
- **Secure Authentication** — account creation and login are handled with password hashing (bcrypt) and JSON Web Token (JWT)–based sessions.
- **Product Discovery** — buyers can discover agricultural products through a centralized interface.
- **Farmer–Buyer Connectivity** — creates a direct digital connection between producers and buyers.
- **Transparent Agricultural Trade** — improves visibility and transparency across transactions.
- **Farm-to-Market Approach** — follows a farm-gate-to-market approach for the produce journey.

## 5. How KisanSetu Works

```
FARMER
  |
  v
List / Present Produce
  |
  v
AGRILINK (aggregates stock across farmers)
  |
  +-----------+-----------+
  |                       |
  v                       v
Product Discovery    Market Access +
                      Price Discovery
  |                       |
  +-----------+-----------+
              |
              v
BUYER (incl. FPOs / institutional buyers)
              |
              v
       Agricultural Trade
```

## 6. User Flow

**Farmer**
- Access the KisanSetu platform
- Present agricultural produce/products
- Make products available to potential buyers (individually or pooled with other farmers)
- Connect with market opportunities at transparent, real-time prices
- Participate in the digital trading process

**Buyer (including FPOs and institutional buyers)**
- Access the marketplace
- Discover agricultural products, including aggregated multi-farmer stock
- Review available produce and current, government-sourced market prices
- Identify suitable suppliers/products
- Connect with producers for agricultural trade

## 7. Technology Stack

KisanSetu is a single full-stack TypeScript application: a React frontend served by an Express backend, built and bundled with Vite.

**Frontend**
- React 19
- Vite 6 (build tool / dev server)
- Tailwind CSS 4
- Framer Motion (`motion`) for animation
- Lucide React for icons

**Backend**
- Node.js with Express
- TypeScript, run in development via `tsx` and bundled for production with `esbuild`
- PostgreSQL, accessed through Drizzle ORM (`drizzle-orm` / `drizzle-kit`), with `sql.js` available for lightweight/local SQLite-compatible use
- JWT-based authentication (`jsonwebtoken`) with `bcryptjs` for password hashing

**External integrations**
- Google Gemini API (`@google/genai`) for AI-assisted features
- data.gov.in Open Government Data Platform — official APMC mandi price dataset, used for real-time commodity price discovery

**Deployment**
- Currently deployed on Render: https://kisansetu-0cjn.onrender.com/
- The project was originally scaffolded from Google's AI Studio app template, so some Google Cloud Run-oriented environment variables (e.g. `APP_URL`) remain from that origin even though the live instance runs on Render.

## 8. System Architecture

```
                              USERS
                     Farmers / FPOs / Buyers
                              |
                              v
                KisanSetu Web Application (React)
                              |
                              v
                     Express API Server
                              |
      +--------+--------+--------+--------+
      |        |        |        |        |
      v        v        v        v        v
  Auth (JWT) Products/  Market /  Gemini  PostgreSQL
             Listings   Price      AI     (Drizzle
             (aggreg.)  Discovery Assist    ORM)
                              |
                              v
                   data.gov.in APMC
                   Mandi Price Dataset
```

## 9. Repository Structure

Based on the current GitHub repository:

```
Agrilink/
├── README.md
├── package.json / package-lock.json / bun.lock
├── index.html          # Vite entry point
├── metadata.json       # AI Studio app metadata
├── tsconfig.json
├── vite.config.ts
├── server.ts           # Express server entry point
├── seed.ts             # Database seeding script
├── test-api.js         # API test script
├── .env.example        # Environment variable template
├── .gitignore
├── assets/
│   └── .aistudio/      # Assets from the original AI Studio template
├── scripts/            # Build/utility scripts
└── src/                # React frontend (and shared) source code
```

This is the actual top-level layout of the repository at the time of writing. If the project is later split into separate frontend/backend workspaces or a monorepo, update this section to match.

## 10. Live Demo

KisanSetu Live Website: https://kisansetu-0cjn.onrender.com/

The live deployment provides an accessible demonstration of the KisanSetu platform.

## 11. Installation

Clone the project repository:

```bash
git clone https://github.com/Praneetchauhan7/Agrilink.git
cd Agrilink
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example` and fill in the required values:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Required for Google Gemini AI API calls |
| `DATA_GOV_API_KEY` | Required to fetch live APMC mandi prices from data.gov.in (register at data.gov.in → My Account → API Key) |
| `JWT_SECRET` | Secret key used to sign authentication JWTs |
| `APP_URL` | Base URL of the running app (used for self-referential links / callbacks) |

A PostgreSQL connection is also required for Drizzle ORM; add the relevant database connection variable(s) to `.env` and confirm the exact variable name(s) against `server.ts` / the Drizzle config before deploying.

## 12. Run Locally

Start the development server:

```bash
npm run dev
```

This runs the Express server via `tsx` with the Vite dev server. The application can then be accessed at the local URL printed in the terminal.

Other available scripts:

```bash
npm run build     # Builds the frontend with Vite and bundles the server with esbuild
npm start         # Runs the production build (dist/server.cjs)
npm run preview   # Previews the built frontend
npm run lint      # Type-checks the project (tsc --noEmit)
```

## 13. Deployment

```
GitHub Repository
        |
        v
       Render
        |
        v
  Production Build
 (vite build + esbuild)
        |
        v
KisanSetu Live Website
```

## 14. Benefits

**For Farmers**
- Better access to potential buyers, including institutional buyers via aggregated stock
- Greater visibility for agricultural produce
- Reduced dependence on traditional intermediaries
- Improved access to digital markets
- Price transparency backed by official government mandi data

**For Buyers (incl. FPOs and institutional buyers)**
- Easier product discovery
- Access to aggregated volumes from multiple farmers in one transaction
- Direct access to agricultural producers
- Centralized marketplace experience
- Better visibility into available produce and current, verifiable prices

**For the Agricultural Ecosystem**
- More transparent agricultural commerce
- Improved digital connectivity
- More efficient farm-to-market interactions
- Foundation for future data-driven agricultural services

## 15. Future Scope

KisanSetu can be extended with additional technology and services, including:

- A dedicated native or PWA mobile application (Android/iOS)
- Expanded/broader mandi and commodity price coverage
- Multilingual farmer interface
- Secure online payments
- Order and inventory management
- Logistics and delivery tracking
- Product quality verification
- Digital crop/product traceability
- Farmer and buyer ratings
- Analytics dashboards
- Government scheme and subsidy information
- Weather and crop intelligence
- Push notifications and offline mode (once a mobile client exists)

## 16. Security & Privacy

Implemented and recommended practices:

- Password hashing via bcrypt (`bcryptjs`)
- JWT-based session authentication (`jsonwebtoken`)
- Environment variables for API keys and secrets (see `.env.example`)
- Input validation on API endpoints
- Secure API communication (HTTPS in production via Render)
- Role-based access where applicable, to be extended as the platform grows

> Never commit passwords, API keys, access tokens, `.env` files containing secrets, or other confidential credentials to GitHub.

## 17. Project Impact

KisanSetu aims to contribute to a more connected and transparent agricultural ecosystem by bringing farmers, FPOs, and buyers closer together through digital technology.

The central idea is simple: **From Farm Gate to Better Markets.**

By improving market connectivity, enabling multi-farmer stock aggregation, and reducing information and access barriers — with pricing grounded in official government data — KisanSetu can help create a more efficient, transparent, and farmer-focused agricultural trading ecosystem.


