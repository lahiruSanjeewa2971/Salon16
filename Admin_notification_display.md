Salon16 Admin PWA – Notification Handling Architecture & Flow
1. Purpose of This Document

This document describes the end-to-end architecture and flow for handling system notifications in the Salon16 Admin PWA, including:

Push notification delivery

App opening from notifications

Authentication handling

Offline handling

Safe redirection to the Bookings screen

Consistent user experience across cold starts and active sessions

The goal is to ensure reliable, secure, and predictable behavior when an admin opens the app from a notification.

2. Context & Constraints
Application Type

Platform: Progressive Web App (PWA)

Audience: Admin users only

Frontend: React (Web)

Authentication: Firebase Auth

Database: Firebase (Firestore)

Deployment: Netlify (planned)

Routing

Welcome Screen: App entry point

Login Screen: Authentication

Bookings Screen:

/bookings


No customer-specific booking routes

Bookings screen already defaults to today’s bookings

3. Notification Use Case
Trigger Condition

A new booking is placed for today

Expected Behavior

Admin receives a system notification

Clicking the notification:

Opens the PWA

Prompts login if session expired

Redirects to /bookings

Shows today’s bookings

If device is offline:

App should not redirect

Show a toast:
“You are offline. Please connect to the internet.”

4. High-Level Design Decision
✅ Key Architectural Choice

WelcomeScreen acts as the single orchestration layer for all app entry flows.

This means:

No direct navigation logic in the service worker

No deep routing bypass

All decisions are centralized

This approach:

Prevents edge-case bugs

Handles cold starts safely

Scales for future notification types

5. App Entry Scenarios

The PWA can be opened in three meaningful ways:

1️⃣ Normal App Launch

User opens app from home screen or browser

No special navigation intent

2️⃣ Notification Click

User opens app by clicking a system notification

App must navigate to /bookings

3️⃣ Offline Launch

App opened without network connectivity

No redirection should occur

6. Core Signals Used for Decision Making

WelcomeScreen evaluates the following signals:

Signal	Purpose
Notification intent	Detect navigation request (e.g., bookings)
Authentication state	Check admin session validity
Network status	Prevent offline redirects

These signals are evaluated in a strict order.

7. WelcomeScreen Responsibilities

The WelcomeScreen is not a UI screen, but an orchestration layer.

It is responsible for:

Detecting how the app was opened

Checking network availability

Validating authentication state

Resolving navigation intent

Redirecting to the correct screen

8. Step-by-Step Flow
STEP 1: App Launch → WelcomeScreen

All entry points (normal open, notification click, refresh) land on:

WelcomeScreen

STEP 2: Detect Notification Intent

Determine whether the app was opened via a notification.

Conceptually:

Notification click provides a navigation intent

Example intent:

targetRoute = "/bookings"


Normal app launches have no intent.

STEP 3: Check Network Connectivity

Connectivity is checked before any redirect.

If Offline:

Show toast notification:

"You are offline. Please connect to the internet."


Stop further execution

Do NOT redirect

Remain on WelcomeScreen

If Online:

Continue flow

STEP 4: Check Authentication State

Only evaluated if online.

If NOT authenticated:

Redirect to Login screen

Preserve the navigation intent (if any)

Example preserved intent:

afterLoginRedirect = "/bookings"


After successful login:

Redirect to preserved route

STEP 5: Resolve Navigation Intent

If:

User is authenticated

User is online

App was opened via notification

👉 Redirect to:

/bookings


The Bookings screen:

Automatically defaults to today

Displays today’s bookings

STEP 6: Default App Flow

If:

User is authenticated

Online

No notification intent

👉 Redirect to:

Admin Dashboard (existing behavior)

9. Decision Tree (Single Source of Truth)
WelcomeScreen
 ├─ Is Offline?
 │   └─ Show offline toast → STOP
 │
 ├─ Is Authenticated?
 │   └─ NO → Login (preserve intent)
 │
 ├─ Has Notification Intent?
 │   └─ YES → /bookings
 │
 └─ Default → Admin Dashboard


This guarantees:

No broken redirects

No unauthorized access

No offline navigation bugs

10. Why Redirects Are NOT Handled in Service Worker

Redirecting directly from the service worker is intentionally avoided because:

Authentication state may be unavailable

App may be offline

React app may not be initialized

Session restoration may fail

By delegating all routing decisions to WelcomeScreen:

The app remains stable

Behavior is deterministic

Debugging is easier

11. Offline Handling Philosophy

Offline state is detected early

Redirects are blocked

User is informed immediately

No loading broken screens

This improves:

UX

Trust

Error transparency

12. Security & Stability Guarantees

This design ensures:

/bookings is never accessed without authentication

Expired sessions are handled cleanly

Notification deep-links are safe

Offline users are not redirected into broken states

13. Scalability Considerations

This architecture supports future enhancements such as:

Multiple notification types

Deep links to other admin screens

Role-based routing

Retry logic on reconnect

Analytics on notification opens

No structural changes are required.

14. Interview-Ready Summary

We use a WelcomeScreen as a centralized orchestration layer to handle app entry, notification intent resolution, authentication validation, and network availability checks. This allows us to safely support deep-linking from push notifications in a PWA while preventing offline navigation issues and unauthorized access.

15. Final Notes

The current /bookings route structure fits perfectly

Default “today bookings” logic is reused cleanly

No routing duplication exists

UX is predictable and professional

If you want, next we can:

Convert this into a sequence diagram

Add a QA test checklist

Design a notification payload contract

Prepare a README section for GitHub

Just tell me 👍