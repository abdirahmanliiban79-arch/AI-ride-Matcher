AI Ride Matcher — OpenCode Project Instructions

1. Your Role

You are the primary AI coding agent for this repository.

Your job is to build, maintain, debug, test, and improve the AI Ride Matcher project according to the project's existing specifications.

You are working inside a real software project, not generating a tutorial or a fictional example.

Before making implementation decisions, inspect the repository and read the project documentation described below.

2. Source of Truth

The repository root contains two project specification files:

/info.md
/stack.md

These files are the primary project documentation.

info.md

Use info.md for:

project purpose;

product requirements;

MVP scope;

business rules;

TypeSafe/Jev responsibilities;

database design;

API routes;

authentication requirements;

ride lifecycle;

matching logic;

validation requirements;

security requirements;

testing requirements;

future scope;

definition of done.

stack.md

Use stack.md for:

technology choices;

architecture;

repository structure;

implementation order;

development phases;

environment variables;

AI integration strategy;

testing strategy;

deployment strategy.

Priority order

When instructions conflict, use this priority:

1. Explicit user request
2. info.md
3. stack.md
4. Existing working project conventions
5. Your own implementation preference

Do not silently change the project's architecture because you prefer another technology.

If a requested change conflicts with the specification, explain the conflict briefly and ask before making a major architectural change.

3. Project Goal

The project is an experimental full-stack ride-matching application.

The primary purpose is to test TypeSafe/Jev as a structured AI decision engine inside a real backend workflow.

The core pipeline is:

Passenger
    ↓
Ride Request
    ↓
Backend
    ↓
Eligible Drivers
    ↓
TypeSafe/Jev
    ↓
Structured Decision
    ↓
Zod Validation
    ↓
Backend Verification
    ↓
Database Mutation
    ↓
Ride Assignment

The most important engineering principle is:

AI recommends. Backend verifies. Database records. Application executes.

Never allow AI output to directly mutate application state without deterministic backend verification.

4. Final Technology Stack

Use the stack already selected for this project:

Frontend:
Next.js
TypeScript

Backend:
Node.js
Express
TypeScript

Database:
MongoDB

Validation:
Zod

Authentication:
JWT

API:
REST

Location:
Fake coordinates for MVP

Frontend deployment:
Vercel

Backend deployment:
Render

Database hosting:
MongoDB Atlas

AI decision engine:
TypeSafe/Jev

General AI / coding model:
DeepSeek V4.1 Flash through OpenRouter

Do not introduce an ORM.

Do not replace REST with tRPC.

Do not introduce real maps into the MVP.

Do not introduce WebSockets, payments, notifications, or other future features unless explicitly requested.

5. AI Model Configuration

The developer intends to use OpenCode with OpenRouter.

The current OpenRouter model identifier for DeepSeek V4.1 Flash is:

deepseek/deepseek-v4.1-flash

Use the current model identifier documented by OpenRouter rather than assuming older DeepSeek V4 Flash identifiers are still current.

For application-level DeepSeek integration, keep the model configurable through environment/configuration rather than hard-coding it throughout the codebase.

Suggested environment variable:

OPENROUTER_API_KEY=
DEEPSEEK_MODEL=deepseek/deepseek-v4.1-flash

Important distinction:

OpenCode + OpenRouter + DeepSeek
        ↓
Development/coding agent

TypeSafe/Jev
        ↓
Application's ride-matching decision engine

Do not replace the TypeSafe experiment with DeepSeek.

DeepSeek may be used for general AI functionality or controlled experiments, but TypeSafe/Jev remains the core decision-engine experiment.

6. Documentation and External References

When you need information about a technology, prefer official documentation.

Use this order:

TypeSafe

Use the official TypeSafe documentation/API documentation and official SDK repository.

Topics include:

System One;

Jev;

Choice;

Score;

Noul;

structured decisions;

SDK usage;

authentication;

API contracts.

Do not invent TypeSafe APIs.

If an API method or parameter is uncertain, check the official documentation before implementing it.

OpenCode

Use official OpenCode documentation for:

configuration;

providers;

OpenRouter integration;

model selection;

project instructions;

commands;

agent behavior.

OpenRouter

Use official OpenRouter documentation for:

model IDs;

provider configuration;

API usage;

structured output;

tool calling;

routing;

model capabilities.

DeepSeek

Use official DeepSeek documentation for:

current model names;

API behavior;

API parameters;

structured output;

tool calling;

compatibility.

Next.js

Use official Next.js documentation.

Express

Use official Express documentation.

MongoDB

Use official MongoDB documentation.

Zod

Use official Zod documentation.

JWT

Use official documentation for the JWT library actually selected in the repository.

Deployment

Use official Vercel, Render, and MongoDB Atlas documentation when deployment behavior matters.

7. How to Work Before Writing Code

Before making significant changes:

Inspect the repository.

Read /info.md.

Read /stack.md.

Inspect the current folder structure.

Inspect existing package files.

Inspect existing environment examples.

Determine what phase of the implementation is already complete.

Avoid rebuilding existing working functionality.

Do not assume the repository is empty.

Do not overwrite existing code without inspecting it first.

8. Work Incrementally

Build the project in phases.

Preferred order:

Phase 1
Project setup
        ↓
Phase 2
Backend foundation
        ↓
Phase 3
MongoDB
        ↓
Phase 4
Authentication
        ↓
Phase 5
Driver module
        ↓
Phase 6
Ride module
        ↓
Phase 7
Distance calculation
        ↓
Phase 8
Deterministic driver filtering
        ↓
Phase 9
TypeSafe integration
        ↓
Phase 10
AI response validation
        ↓
Phase 11
Ride matching endpoint
        ↓
Phase 12
Frontend
        ↓
Phase 13
API client
        ↓
Phase 14
Seed data
        ↓
Phase 15
Testing
        ↓
Phase 16
Observability
        ↓
Phase 17
Deployment

Do not jump to later phases unless necessary.

9. Before Implementing a Feature

For every substantial task:

Step 1 — Understand

Identify:

what the user asked for;

which specification section it affects;

which files should change;

whether it changes the architecture.

Step 2 — Inspect

Read relevant existing files.

Step 3 — Plan

Create a short implementation plan internally before editing.

Step 4 — Implement

Make the smallest coherent change.

Step 5 — Validate

Run appropriate:

type checks;

tests;

linting;

build;

targeted runtime checks.

Step 6 — Report

Briefly state:

what changed;

what was verified;

any remaining issue.

Do not claim something works if it was not verified.

10. Backend Architecture

Keep responsibilities separated:

Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
MongoDB

Recommended responsibilities:

Routes

Define HTTP endpoints.

Controllers

Handle HTTP input/output and call services.

Services

Contain business logic.

Repositories

Contain database access.

Schemas

Contain Zod validation schemas.

Middleware

Handle authentication, errors, and cross-cutting concerns.

Do not place complex business logic directly inside route handlers.

11. TypeSafe/Jev Boundary

Keep TypeSafe integration isolated.

Recommended area:

backend/src/services/typesafe/

The TypeSafe service should:

receive normalized ride/matching data;

construct the decision request;

call TypeSafe;

parse the result;

return a typed result.

It should NOT:

update MongoDB;

assign the driver;

change ride status;

bypass application authorization;

execute arbitrary tools;

trust an unknown driver ID.

The service should return a decision.

The matching service decides whether that decision is valid.

12. Matching Architecture

Use two layers.

Layer 1 — Deterministic filtering

Normal backend code removes impossible candidates.

Examples:

driver is available
vehicle type is compatible
price is within maxPrice
ETA is within maxWaitTime
coordinates are valid

Layer 2 — AI decision

TypeSafe/Jev selects among the remaining valid candidates.

Eligible candidates
        ↓
TypeSafe/Jev
        ↓
selectedDriverId
matchType
confidence

This separation is mandatory.

Do not ask AI to decide whether an unavailable driver is available.

The backend already knows that.

13. AI Response Safety

Never trust AI output.

Every AI response must pass:

AI response
    ↓
Zod schema
    ↓
Type validation
    ↓
Business validation
    ↓
Database operation

For a selected driver, verify:

selectedDriverId exists
AND
selectedDriverId belongs to current candidate set
AND
driver is still available
AND
driver still satisfies constraints

The application must handle the possibility that the driver's state changed between candidate generation and assignment.

14. Concurrency and Race Conditions

Ride matching is inherently vulnerable to race conditions.

Example:

Passenger A matches Driver X
Passenger B matches Driver X

Do not assume the AI decision remains valid after it is produced.

Before assignment, re-check driver availability.

Use an atomic database update or another safe mechanism so that only one ride can successfully claim a driver.

If the assignment fails because the driver was already taken:

do not silently assign anyway

Instead:

re-evaluate
or
return a controlled match failure

15. Authentication Rules

Use JWT.

Rules:

Hash passwords.

Never store plaintext passwords.

Never trust a client-provided user ID when the JWT already identifies the user.

Protect passenger-only endpoints.

Protect driver-only endpoints.

Validate roles.

Keep JWT secrets in environment variables.

Never expose secrets to the frontend.

16. Zod Rules

Use Zod at system boundaries.

Validate:

HTTP request bodies
HTTP route parameters
Environment variables
AI responses
Important database-bound objects

Do not use TypeScript types alone as runtime validation.

Remember:

TypeScript = compile-time
Zod = runtime

17. MongoDB Rules

Keep database access in repositories.

Do not spread MongoDB queries across controllers.

Use indexes where appropriate.

Important candidate indexes may include:

users.email / phone
drivers.userId
drivers.isAvailable
rides.passengerId
rides.assignedDriverId
rideMatches.rideId

Do not prematurely optimize.

Only add indexes that support real query patterns.

18. Location Rules

MVP uses fake coordinates.

Do not add Google Maps or Mapbox.

Store:

latitude
longitude

Use a deterministic distance calculation such as Haversine.

Keep location calculations in a utility/service rather than controllers.

19. API Rules

Use REST.

Keep routes consistent:

/api/auth/...
/api/drivers/...
/api/rides/...

Use appropriate HTTP status codes.

Return predictable JSON responses.

Use a consistent error format.

Example:

{
  "error": {
    "code": "RIDE_NOT_FOUND",
    "message": "Ride was not found"
  }
}

Do not expose stack traces in production responses.

20. Ride State Machine

Valid ride states:

REQUESTED
MATCHING
MATCHED
ACCEPTED
IN_PROGRESS
COMPLETED
CANCELLED

Do not allow arbitrary status changes.

Create explicit transition rules.

For example:

REQUESTED → MATCHING
MATCHING → MATCHED
MATCHED → ACCEPTED
ACCEPTED → IN_PROGRESS
IN_PROGRESS → COMPLETED

Cancellation rules must also be explicit.

21. Frontend Rules

Use Next.js.

The frontend should communicate with the backend REST API.

Do not put:

TypeSafe API keys;

OpenRouter API keys;

DeepSeek API keys;

JWT secrets

inside the frontend.

The frontend should never call TypeSafe/Jev directly.

Keep UI simple and functional.

Do not spend excessive time on visual polish unless requested.

22. Error Handling

Use centralized backend error handling.

Handle:

validation errors
authentication errors
authorization errors
not found
conflict
database errors
AI API errors
AI timeout
invalid AI response
no eligible drivers
driver assignment conflict

Use meaningful internal error codes.

Do not leak provider/API secrets or internal stack traces.

23. Testing Strategy

Prioritize tests around the AI boundary.

Unit tests

Test:

distance calculation;

driver eligibility;

ride state transitions;

Zod schemas;

AI response validation.

Integration tests

Test:

create ride
→ find candidates
→ AI decision
→ validate decision
→ verify driver
→ assign driver

Failure tests

Especially test:

unknown driver ID
unavailable driver
wrong vehicle
price violation
wait-time violation
invalid confidence
malformed AI output
AI timeout
AI provider failure
database failure
concurrent driver assignment

24. Seed Data

Provide predictable development data.

At minimum:

1 passenger
10 drivers

Create different combinations of:

vehicle type
rating
price
distance
availability

Make test scenarios reproducible.

25. Environment Variables

Use .env.example.

Never commit real secrets.

Backend may use:

PORT=
MONGODB_URI=
JWT_SECRET=
OPENROUTER_API_KEY=
DEEPSEEK_MODEL=deepseek/deepseek-v4.1-flash
TYPE_SAFE_API_KEY=

Only add variables that the actual implementation requires.

Never invent provider credentials.

26. OpenCode Behavior

You are allowed to:

inspect files;

create files;

edit files;

run package-manager commands;

run tests;

run type checks;

run builds;

inspect errors;

fix implementation problems;

iterate until the requested task is complete.

When a command changes dependencies, explain what was added and why.

Do not install unnecessary packages.

Prefer existing dependencies when they already solve the problem.

27. Dependency Discipline

Before adding a package:

Check whether the repository already has an equivalent.

Check whether the selected stack requires it.

Prefer small, well-maintained dependencies.

Avoid adding libraries merely for convenience.

Do not introduce an ORM.

Keep the dependency tree intentionally small.

28. Coding Standards

Use TypeScript strict mode.

Prefer:

explicit types at boundaries;

small functions;

clear names;

single responsibility;

reusable services;

typed error handling;

async/await;

centralized validation.

Avoid:

any;

duplicated business logic;

giant controllers;

giant components;

hidden side effects;

magic strings scattered throughout the codebase;

unnecessary abstractions.

Use unknown instead of any when handling untrusted external data.

29. Security Mindset

Treat all external data as untrusted.

That includes:

frontend requests
JWT payloads
database data
AI responses
third-party API responses
environment variables

The AI response is an untrusted external response.

Never allow prompt output to become an executable command or database mutation without validation.

30. Do Not Overbuild

The MVP intentionally excludes:

real GPS
Google Maps
Mapbox
payments
chat
notifications
WebSockets
surge pricing
mobile apps
advanced route optimization
production dispatch algorithms

Do not add these automatically.

If the user requests one, evaluate its impact before implementing it.

31. Documentation During Development

Keep documentation synchronized with meaningful architectural changes.

If you change:

API routes;

database collections;

environment variables;

architecture;

matching logic;

TypeSafe behavior;

installation instructions;

update the relevant documentation.

Do not rewrite info.md or stack.md unnecessarily.

32. Research Rule

When implementation depends on current external documentation:

Prefer official documentation.

Verify the current API/model name.

Do not rely on memory for rapidly changing AI APIs.

Do not invent SDK methods.

If documentation is ambiguous, inspect the actual installed package/types when possible.

For AI provider behavior, current official documentation takes precedence over old examples found elsewhere.

33. Model/Provider Separation

Never confuse these concepts:

OpenCode
= coding agent

OpenRouter
= model gateway/provider

DeepSeek V4.1 Flash
= general AI model used through OpenRouter

TypeSafe/Jev
= application decision engine

The project should keep these responsibilities separate.

34. When Something Fails

Do not immediately rewrite the architecture.

Follow:

Read error
 ↓
Locate failing layer
 ↓
Inspect relevant code
 ↓
Identify root cause
 ↓
Make minimal fix
 ↓
Run verification

If a provider API changed:

verify current documentation;

update the integration;

keep the rest of the architecture stable.

35. Completion Standard

Do not stop after generating code.

A task is complete only when:

Implementation
+
Type checking
+
Relevant tests
+
Build verification
+
No obvious runtime/configuration issue

If something cannot be verified, explicitly say what could not be verified.

Never fabricate test results.

36. Final Project Principle

The most important objective is not:

"Make an AI choose a driver."

It is:

"Demonstrate how an AI decision can safely participate in a production-style backend workflow."

The architecture must therefore remain:

              ┌─────────────────────┐
              │      Passenger      │
              └──────────┬──────────┘
                         ↓
                  Ride Request
                         ↓
              ┌─────────────────────┐
              │      Backend        │
              └──────────┬──────────┘
                         ↓
               Deterministic Rules
                         ↓
                Eligible Drivers
                         ↓
              ┌─────────────────────┐
              │    TypeSafe/Jev     │
              │   Decision Engine   │
              └──────────┬──────────┘
                         ↓
                Structured Output
                         ↓
                    Zod Parse
                         ↓
               Business Validation
                         ↓
                 Database Update
                         ↓
                  Ride Assignment

Keep this architecture intact unless the user explicitly asks for a different design.