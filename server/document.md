# Laundry App UI Design Guide

This document helps you design a complete UI for the Laundry App backend in this project.

## 1) Product Scope You Should Design For

Your backend currently supports:
- Authentication: signup, login, token verify, refresh, logout
- Users
- Services
- Orders
- Order items
- Payments
- Transactions
- Order status history
- Reviews

Design your UI around three role experiences:
- Customer
- Admin / Staff
- Rider (if assignment and delivery tracking are needed)

## 2) UX Goals

- Fast order creation in less than 3 minutes
- Clear order status at all times
- Frictionless payment and receipts
- Strong trust signals: history, review, transparent pricing
- Mobile-first experience for customers and riders

## 3) Information Architecture (Sitemap)

## Public
- Landing
- Services Catalog
- Pricing
- Login
- Sign up

## Customer App
- Dashboard
- New Order
- My Orders
- Order Details
- Payments
- Transactions / Receipts
- Reviews
- Profile

## Admin App
- Admin Dashboard
- Orders Management
- Services Management
- Users Management
- Payments and Transactions
- Order Status Timeline
- Reviews Moderation

## Rider App
- Assigned Orders
- Order Details
- Status Update Flow
- Earnings / Completed Jobs (optional)

## 4) Core User Flows to Design First

## Flow A: New Customer Order
1. Customer signs up or logs in.
2. Customer selects services and items.
3. Customer enters pickup details and preferred time.
4. Customer sees price summary (deposit, total, remaining).
5. Customer confirms order.
6. Customer tracks status timeline.

## Flow B: Payment Completion
1. Customer opens order details.
2. Customer pays deposit or balance.
3. UI confirms payment status.
4. Receipt appears in transactions.

## Flow C: Admin Fulfillment
1. Admin reviews incoming orders.
2. Admin assigns rider.
3. Admin updates lifecycle statuses.
4. Admin monitors payment and completion.

## Flow D: Review Submission
1. Customer opens completed order.
2. Customer rates service and writes review.
3. Review appears in customer history and admin moderation panel.

## 5) Screen-by-Screen Design Checklist

## 5.1 Auth Screens
- Login form: email, password
- Signup form: full name, email, phone, password, role (optional by policy)
- Feedback states: invalid credentials, duplicate email, loading, success
- Session UX: persistent login, clear logout action

## 5.2 Dashboard (Customer)
- Greeting and active orders summary
- Next pickup and delivery cards
- Payment due card
- Quick actions: New Order, Track Order, Pay Now

## 5.3 Services Catalog
- Service categories grid/list
- Price display and estimated turnaround
- Add-to-order interactions
- Empty and no-results states

## 5.4 New Order Wizard
- Step 1: Services and items
- Step 2: Pickup address and schedule
- Step 3: Price and payment preview
- Step 4: Confirm and submit
- UX requirements:
  - Progress indicator
  - Save draft (optional)
  - Inline validation and clear error text

## 5.5 Orders List + Details
- List filters: status, date range, payment status
- Detail view sections:
  - Order summary
  - Items
  - Status timeline
  - Payment block
  - Review block
- Contextual actions based on status

## 5.6 Payments and Transactions
- Payment card with amount due
- Payment history table
- Transaction receipts with date, amount, method, status
- Failed payment recovery flow

## 5.7 Reviews
- Rating input (1 to 5)
- Comment text area
- Review history per customer
- Admin moderation table (if required)

## 5.8 Admin Panels
- Orders board (table or Kanban)
- Assign rider modal
- Service CRUD forms
- User list with role badges
- Payment reconciliation view

## 6) Data-to-UI Mapping (From Backend Routes)

Use these route groups to drive your page modules:
- auth.js -> login, signup, token/session handling UI
- services.js -> services catalog + admin service CRUD
- orders.js -> order list/detail/create/update views
- order-items.js -> itemized order forms and details
- payments.js -> payment actions and payment history UI
- transactions.js -> receipt and transaction list UI
- order-status-history.js -> timeline components
- reviews.js -> review submission and moderation UI
- users.js -> profile and user management pages

## 7) Visual Design Direction (Practical Starting Point)

Choose one clear direction and keep it consistent:

- Brand feel: clean, reliable, local-service friendly
- Color system:
  - Primary: deep blue
  - Secondary: warm orange
  - Success: green
  - Warning: amber
  - Neutral grayscale for text/surfaces
- Typography:
  - Headings: Poppins or Space Grotesk
  - Body: Source Sans 3 or Manrope
- UI shape language:
  - Rounded cards
  - Soft shadows
  - Strong status chips for order state

## 8) Component Library You Should Build

Create reusable components early:
- App shell (top bar + side nav)
- Role-aware navigation
- Status chip
- Stepper
- Data table with filters
- Empty state block
- Alert/toast
- Modal and drawer
- Timeline item
- Payment summary card
- Order card

## 9) Responsive Strategy

Breakpoints:
- Mobile: 320 to 767
- Tablet: 768 to 1023
- Desktop: 1024+

Mobile priorities:
- One-handed actions for order tracking and payment
- Sticky primary CTA on critical screens
- Collapse dense tables into cards

Desktop priorities:
- High-density management tables for admin
- Multi-column detail views

## 10) States You Must Design Explicitly

For every key screen, create designs for:
- Loading
- Empty
- Success
- Error
- No permission (role-restricted)
- Offline / request retry (optional but recommended)

## 11) Suggested Design File Structure (Figma or Similar)

- 00 Foundations
  - Colors
  - Typography
  - Spacing
  - Grid
- 01 Components
  - Inputs, buttons, cards, chips, tables, timeline, modals
- 02 Customer Flows
  - Auth, New Order, Tracking, Payment, Reviews
- 03 Admin Flows
  - Orders, Users, Services, Payments
- 04 Rider Flows
  - Assigned Orders, Status Updates
- 05 Prototypes
  - End-to-end clickable flows

## 12) API-Driven UI Integration Tips

- Keep auth tokens in a safe client storage strategy
- Create one API service layer per domain (auth, orders, payments, etc.)
- Normalize server errors to a standard UI message format
- Use optimistic UI only for safe actions
- Add retry UI for network failures

## 13) Delivery Plan (Recommended)

Week 1
- Define design system foundations
- Complete Auth, Services, New Order flow wireframes

Week 2
- Complete Orders, Status Timeline, Payments screens
- Build high-fidelity customer flows

Week 3
- Complete Admin and Rider flows
- Build interactive prototype and usability pass

Week 4
- Handoff specs, responsive redlines, and component states
- Support frontend implementation QA

## 14) Handoff Checklist

Before implementation starts, ensure:
- Every endpoint group has a corresponding screen/module
- Every critical action has loading/success/error behavior
- Role-based visibility rules are documented
- Component variants and tokens are complete
- Mobile and desktop designs are both covered

---

Use this guide as your blueprint. Start with the New Order and Order Tracking experience first, because they create the core customer value and validate most of your data model early.
