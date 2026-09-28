AI Ride Matcher — Technology Stack & Step-by-Step Build Plan

1. Final Stack

Frontend

Next.js

TypeScript

REST API client

Simple responsive UI

Backend

Node.js

Express

TypeScript

REST API

Database

MongoDB

Native MongoDB driver or a lightweight database abstraction

No ORM

Validation

Zod

Authentication

JWT

Password hashing

AI

TypeSafe/Jev for structured ride-matching decisions

DeepSeek-V4.1-Flash for general AI/coding/model experiments

DeepSeek API model identifier: deepseek-flash

DeepSeek's current API documentation identifies deepseek-flash as DeepSeek-V4.1-Flash. It supports JSON output and tool calls, but the ride-matching decision itself should remain a TypeSafe/Jev responsibility.

2. Why This Stack

Express

Chosen because the project is an experiment in backend + AI decision integration. Express keeps the REST layer straightforward.

Next.js

Provides the frontend and a clean React-based application structure.

MongoDB

Fits the selected document-oriented data model and avoids adding ORM abstractions to a project whose purpose is learning the AI/backend boundary.

Zod

Provides runtime validation at the most important boundaries:

HTTP input
AI output
Environment variables

JWT

Simple authentication for the MVP without introducing a larger authentication framework.

REST

Keeps the API explicit and easy to inspect with Postman/Insomnia/curl.

Fake coordinates

Avoids map-provider complexity while preserving the actual matching problem.

3. Repository Structure

Use two independent applications:

ai-ride-matcher/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── README.md
└── .gitignore

4. Build Order

Do not build everything at once.

Follow this order.

Phase 1 — Project Setup

Step 1

Create the repository.

ai-ride-matcher/

Step 2

Create:

frontend/
backend/

Step 3

Initialize Next.js in frontend.

Step 4

Initialize TypeScript + Express in backend.

Step 5

Configure strict TypeScript.

Recommended:

{
  "compilerOptions": {
    "strict": true
  }
}

Step 6

Create .env.example files.

Do not commit real secrets.

Phase 2 — Backend Foundation

Build:

src/app.ts
src/server.ts
src/config/
src/middlewares/
src/routes/

Implement:

Express app;

JSON parsing;

CORS;

environment validation;

centralized error handling;

health endpoint.

Health endpoint:

GET /api/health

Expected:

{
  "status": "ok"
}

Phase 3 — MongoDB

Create MongoDB connection logic.

Collections:

users
drivers
rides
rideMatches

Do not introduce an ORM.

Create repository functions for database operations.

Examples:

createUser()
findUserById()
findAvailableDrivers()
createRide()
findRideById()
createRideMatch()
updateRide()

Keep MongoDB operations out of controllers.

Phase 4 — Authentication

Implement:

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

Flow:

Register
  ↓
Validate with Zod
  ↓
Hash password
  ↓
Save user

Login:

Credentials
  ↓
Validate
  ↓
Compare password
  ↓
Create JWT
  ↓
Return token

Create authentication middleware.

The middleware should attach the authenticated user's identity to the request.

Phase 5 — Driver Module

Implement:

GET   /api/drivers/me
GET   /api/drivers/available
PATCH /api/drivers/me/availability
PATCH /api/drivers/me/location

Driver data:

vehicleType
rating
isAvailable
latitude
longitude

Use Zod for every incoming request.

Phase 6 — Ride Module

Implement:

POST /api/rides
GET  /api/rides/:id
POST /api/rides/:id/accept
POST /api/rides/:id/cancel

Create the ride status machine:

REQUESTED
    ↓
MATCHING
    ↓
MATCHED
    ↓
ACCEPTED
    ↓
IN_PROGRESS
    ↓
COMPLETED

Cancellation should be explicitly validated against the current status.

Phase 7 — Distance Utility

Because MVP uses fake coordinates, implement a distance utility.

Input:

latitude1
longitude1
latitude2
longitude2

Output:

distance in kilometers

Use a standard geographic distance formula such as Haversine.

Do not call an external maps API.

Phase 8 — Deterministic Driver Filtering

Create:

services/matching/

The first stage is normal backend logic.

Example:

available === true
AND
vehicleType matches
AND
price <= maxPrice
AND
ETA <= maxWaitTime

Only eligible drivers should reach TypeSafe.

This creates a clean separation:

Backend rules → eliminate impossible candidates

TypeSafe → choose among valid candidates

Phase 9 — TypeSafe Integration

Create a dedicated service:

services/typesafe/

Do not call TypeSafe from controllers.

Create something conceptually like:

matchDriversWithTypeSafe()

Input:

ride requirements
+
eligible drivers

Output:

selectedDriverId
matchType
confidence

The service should have its own typed request/response contracts.

Phase 10 — AI Response Validation

This is critical.

Never do:

const result = await ai();
assignDriver(result.driverId);

Instead:

TypeSafe response
       ↓
Zod schema
       ↓
Validation
       ↓
Business verification
       ↓
Database mutation

Validate:

selectedDriverId
matchType
confidence

Then verify that selectedDriverId belongs to the exact eligible-driver list used for that request.

Phase 11 — Matching Endpoint

Implement:

POST /api/rides/:id/match

Complete flow:

1. Authenticate passenger
2. Load ride
3. Verify ride status
4. Load available drivers
5. Calculate distance/ETA/price
6. Filter invalid candidates
7. If none → no_match
8. Send candidates to TypeSafe
9. Validate response with Zod
10. Verify selected driver
11. Save ride match
12. Assign driver
13. Change ride status to MATCHED
14. Return result

Phase 12 — Frontend

Build only the necessary pages.

Public

/
 /login
 /register

Passenger

/dashboard
/rides/new
/rides/[id]

Driver

/driver
/driver/rides
/driver/settings

Keep UI simple.

The frontend is not the main experiment.

Phase 13 — API Client

Create a small frontend API layer:

src/lib/api/

Functions:

register()
login()
getMe()

createRide()
getRide()
matchRide()
acceptRide()
cancelRide()

getDriverProfile()
updateAvailability()
updateLocation()

Do not scatter raw fetch() calls throughout components.

Phase 14 — Test Data

Create a seed script.

Generate:

1 passenger
10 drivers

Drivers should intentionally have different:

ratings;

distances;

prices;

vehicle types;

availability.

Create scenarios where:

1 obvious match
multiple valid matches
no valid match
low-confidence/human-review scenario

Phase 15 — Testing

Test deterministic matching first.

Then test the AI boundary.

Required cases:

✓ Valid driver selected
✓ Unknown driver rejected
✓ Unavailable driver rejected
✓ Wrong vehicle rejected
✓ Price constraint respected
✓ Wait-time constraint respected
✓ Invalid confidence rejected
✓ Malformed AI output rejected
✓ No candidates handled
✓ AI timeout handled
✓ AI API failure handled

The most important test is:

Can an incorrect AI response ever assign an invalid driver?

The answer must be no.

Phase 16 — Observability

For each matching attempt, log:

rideId
candidateCount
selectedDriverId
confidence
matchType
duration
AI success/failure

Do not log sensitive secrets.

This makes it easier to understand how the AI behaves.

Phase 17 — Deployment

Frontend

Deploy to:

Vercel

Backend

Deploy to:

Render

Database

Use:

MongoDB Atlas

Set production environment variables through the deployment provider.

Never commit:

.env
API keys
JWT secrets
database credentials

5. AI Architecture

There are two separate AI technologies in this project.

TypeSafe/Jev

Purpose:

Ride matching decision

It should answer the structured decision.

Transport (verified against the live API): TypeSafe/Jev is served through OpenRouter as the model `typesafe/jev-router`. The backend calls OpenRouter's chat completions endpoint with `TYPE_SAFE_API_KEY` and `TYPE_SAFE_MODEL`. OpenRouter is only the transport; TypeSafe/Jev remains the decision engine. The Jev Router selects its own underlying model per request.

DeepSeek Flash

Purpose:

General AI experimentation
development assistance
optional natural-language features

Use the current DeepSeek API model identifier:

deepseek-flash

DeepSeek's current API documentation lists this identifier as DeepSeek-V4.1-Flash and documents JSON output/tool-call support. citeturn0search4turn0search6

Do not use DeepSeek as a replacement for the TypeSafe experiment. Keep the two roles separate.

6. Recommended AI Experiment

After the normal TypeSafe version works, create an optional experiment:

Same ride
Same candidates
        ↓
 ┌───────────────┐
 │ TypeSafe/Jev  │
 └───────────────┘
        ↓
    Decision A

        VS

 ┌───────────────┐
 │ DeepSeek      │
 └───────────────┘
        ↓
    Decision B

Compare:

structured-output reliability;

invalid selections;

latency;

cost;

consistency;

implementation complexity.

Do not make the comparison part of the initial MVP.

7. Development Rule

Build in this order:

Setup
 ↓
Database
 ↓
Auth
 ↓
Drivers
 ↓
Rides
 ↓
Distance
 ↓
Deterministic filtering
 ↓
TypeSafe
 ↓
AI validation
 ↓
Matching
 ↓
Frontend
 ↓
Tests
 ↓
Deployment

Never start by building the UI.

The core experiment is the backend matching pipeline.

8. Definition of Done

The project is complete when you can demonstrate:

Passenger logs in
      ↓
Creates ride
      ↓
Backend finds eligible drivers
      ↓
TypeSafe selects a driver
      ↓
Zod validates result
      ↓
Backend verifies result
      ↓
Ride becomes MATCHED
      ↓
Driver accepts
      ↓
Ride becomes ACCEPTED

And, most importantly:

AI cannot bypass backend rules.

That is the main engineering lesson of this project.