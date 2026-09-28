AI Ride Matcher — Project Specification

1. Project Overview

AI Ride Matcher is a full-stack ride-matching application built to test TypeSafe/Jev as a decision engine inside a real TypeScript application.

A passenger creates a ride request. The backend finds currently available drivers, prepares the relevant driver/request data, sends the decision problem to TypeSafe/Jev, receives a structured decision, and then the backend applies that decision.

Core flow

Passenger → Ride Request → Backend → Available Drivers → TypeSafe/Jev → Structured Match Decision → Backend → Ride Assignment

2. Main Goal

The primary goal is not to build a complete Uber/Bolt clone.

The primary goal is to learn and demonstrate:

How TypeSafe/Jev can make structured decisions.

How an AI decision can safely enter backend business logic.

How to validate AI output before using it.

How AI can work alongside deterministic application logic.

How to separate AI reasoning from database mutations.

3. MVP Scope

Passenger

Create a ride request.

Provide pickup and destination.

Set maximum price.

Select preferred vehicle type.

Set maximum waiting time.

View the matched driver.

Accept/cancel the ride.

Driver

Create/manage driver profile.

Set vehicle type.

Set availability.

Have a rating.

Store current fake coordinates.

Accept or reject an assigned ride.

Matching

Find available drivers.

Filter obviously incompatible drivers using deterministic backend rules.

Send eligible candidates to TypeSafe/Jev.

Receive a structured driver selection.

Validate the AI response with Zod.

Save the match.

Assign the ride.

4. What TypeSafe/Jev Should Decide

TypeSafe should decide among already-validated candidates.

Example decision:

{
  "selectedDriverId": "driver_42",
  "matchType": "best_match",
  "confidence": 0.94
}

The AI should NOT directly:

modify MongoDB;

change driver availability;

charge money;

call arbitrary application endpoints;

invent a driver ID;

bypass backend validation.

The backend remains the authority.

5. Matching Inputs

Passenger requirements

maxPrice

preferredVehicleType

maxWaitTime

pickup coordinates

destination coordinates

Driver data

driverId

distanceFromPickup

estimatedArrivalMinutes

price

rating

vehicleType

availability

6. Deterministic Filtering

Before calling TypeSafe:

Driver must be available.

Driver must support the requested vehicle type.

Estimated arrival must be within the passenger's maximum wait time.

Estimated price must not exceed the passenger's maximum price.

Driver must have valid coordinates.

This reduces unnecessary AI calls and prevents obviously invalid candidates from reaching the decision layer.

7. AI Matching Criteria

TypeSafe/Jev can consider:

pickup proximity;

estimated arrival;

price;

driver rating;

vehicle compatibility;

passenger constraints.

Do not hard-code an arbitrary hidden weighting formula in the MVP. The purpose is to test how a structured AI decision performs when several valid candidates exist.

8. AI Decision Contract

The backend should request a structured result containing:

{
  selectedDriverId: string;
  matchType: "best_match" | "no_match" | "human_review";
  confidence: number;
}

Recommended confidence range:

0.0 — 1.0

The backend must reject:

unknown driver IDs;

unavailable drivers;

drivers outside the original candidate list;

invalid confidence;

malformed responses.

9. No-Match and Human Review

The system should support:

best_match
no_match
human_review

Example:

No eligible drivers → no_match.

Eligible drivers exist but AI confidence is below the configured threshold → human_review.

Valid high-confidence selection → best_match.

The confidence threshold should be a configurable application setting, not an unexplained constant hidden inside prompts.

10. Location Strategy

MVP: Fake coordinates

Do NOT integrate Google Maps or Mapbox in the first version.

Store latitude/longitude and calculate approximate distance inside the backend.

Example:

Driver A → 1.2 km
Driver B → 0.5 km
Driver C → 2.1 km

This keeps the project focused on TypeSafe.

Real maps can be added later.

11. Suggested Database Collections

users

_id
name
phone
passwordHash
role: passenger | driver
createdAt
updatedAt

drivers

_id
userId
vehicleType
rating
isAvailable
latitude
longitude
createdAt
updatedAt

rides

_id
passengerId
pickup
destination
maxPrice
preferredVehicleType
maxWaitTime
status
assignedDriverId
createdAt
updatedAt

rideMatches

_id
rideId
driverId
confidence
matchType
createdAt

12. Ride Status

Use a controlled status lifecycle:

REQUESTED
MATCHING
MATCHED
ACCEPTED
IN_PROGRESS
COMPLETED
CANCELLED

The backend should enforce valid transitions.

13. API Routes

Auth

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

Drivers

GET   /api/drivers/available
GET   /api/drivers/me
PATCH /api/drivers/me/availability
PATCH /api/drivers/me/location

Rides

POST   /api/rides
GET    /api/rides/:id
POST   /api/rides/:id/match
POST   /api/rides/:id/accept
POST   /api/rides/:id/cancel

14. Authentication

Use JWT authentication.

Passwords must be hashed.

JWT should identify the authenticated user.

Passenger-only and driver-only operations should be protected.

Never trust a user-provided userId when the identity already exists in the JWT.

15. Validation

Use Zod for:

request bodies;

route parameters;

environment variables;

AI response validation;

important database-bound objects.

The TypeSafe response should pass through Zod before application logic uses it.

16. Frontend Pages

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

Keep the UI simple. This is primarily an AI/backend experiment.

17. Frontend Responsibilities

The Next.js frontend should:

collect user input;

call REST endpoints;

display ride status;

display matched driver;

allow driver availability changes;

display useful errors.

The frontend must NOT call TypeSafe/Jev directly.

The AI key stays on the backend.

18. Backend Architecture

Recommended flow:

HTTP Route
   ↓
Controller
   ↓
Validation
   ↓
Service
   ↓
Repository / Database

Matching:

POST /rides/:id/match
        ↓
Match Service
        ↓
Load Ride
        ↓
Load Eligible Drivers
        ↓
Deterministic Filtering
        ↓
TypeSafe/Jev
        ↓
Zod Validation
        ↓
Business Rules
        ↓
Save Match
        ↓
Assign Driver

19. Important Architecture Rule

Do not let TypeSafe become the source of truth.

Use this principle:

AI recommends.
Backend verifies.
Database records.
Application executes.

20. Error Handling

Handle at least:

invalid JWT;

invalid request body;

ride not found;

driver not found;

no available drivers;

AI timeout;

AI API failure;

malformed AI response;

invalid selected driver;

conflicting ride status;

database failure.

Do not expose API keys or internal errors to the frontend.

21. Testing Goals

Create tests for:

Deterministic logic

unavailable drivers are excluded;

wrong vehicle types are excluded;

excessive prices are excluded;

excessive ETA is excluded.

AI boundary

valid driver selection is accepted;

unknown driver selection is rejected;

unavailable selected driver is rejected;

invalid confidence is rejected;

malformed AI response is rejected.

Ride lifecycle

valid transitions work;

invalid transitions fail.

22. Seed Data

Create deterministic development data:

1 passenger;

5–10 drivers;

multiple vehicle types;

different ratings;

different coordinates;

different prices;

available/unavailable states.

This makes TypeSafe testing repeatable.

23. Environment Variables

Expected backend environment variables:

PORT=
MONGODB_URI=
JWT_SECRET=
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash
TYPE_SAFE_API_KEY=

Never commit .env.

Provide .env.example.

24. Security Rules

Hash passwords.

Use JWT securely.

Keep AI API keys server-side.

Validate every external input.

Validate every AI response.

Never allow AI-generated IDs to bypass database checks.

Do not expose sensitive driver/passenger information unnecessarily.

Add basic rate limiting to sensitive endpoints.

25. MVP Non-Goals

Do NOT build initially:

real GPS tracking;

Google Maps;

Mapbox;

payments;

chat;

push notifications;

surge pricing;

real-time WebSockets;

advanced route optimization;

production-scale dispatching;

mobile apps.

These are future extensions.

26. Future Extensions

After the MVP works:

Real maps.

Real distance/routing.

WebSocket ride updates.

Driver ETA.

Notifications.

Better matching analytics.

Match history.

Admin dashboard.

Multiple matching strategies.

A/B testing of AI vs deterministic matching.

27. Success Criteria

The project is successful when:

A passenger can create a ride.

The backend can identify eligible drivers.

TypeSafe/Jev returns a structured decision.

Zod validates that decision.

The backend verifies the selected driver.

A valid match is saved.

The driver can accept it.

Invalid AI decisions cannot corrupt application state.

The entire matching flow can be demonstrated locally.

28. Core Principle

This project exists to answer one question:

Can a TypeSafe/Jev decision become a reliable part of a real backend workflow?

Keep the project focused on answering that question.