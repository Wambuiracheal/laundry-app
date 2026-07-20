# Laundry App Wireframe Prompts

Use these prompts in Figma AI, Uizard, Framer AI, or any UI generator.

How to use:
1. Copy one prompt at a time.
2. Generate low-fidelity wireframes first.
3. Regenerate with your design system after layout is approved.

## Prompt 1: Public Landing Page
Design a responsive landing page for a laundry service app called Panda Laundry. Include a top navigation with logo, Services, Pricing, Login, and Sign Up. Create a hero section with value proposition, pickup/delivery illustration, and CTA buttons for Book Pickup and Browse Services. Add a trust section with 3 cards: Fast Turnaround, Tracked Orders, Secure Payments. Include testimonials, a pricing teaser, and a footer with contact info and social links. Style should be clean, modern, and service-focused. Create both desktop and mobile wireframes.

## Prompt 2: Login Screen
Design a mobile-first login screen for Panda Laundry. Include email and password fields, show/hide password toggle, remember me checkbox, forgot password link, and primary login button. Include secondary action for creating an account. Add inline validation and error state area for invalid credentials. Provide loading and success states. Keep layout simple and conversion-focused.

## Prompt 3: Signup Screen
Design a signup page for a laundry app with fields: full name, email, phone, password, and optional role selector. Include password strength indicator, terms checkbox, and primary Create Account button. Add duplicate email error state and successful account creation confirmation state. Include link back to login. Show desktop and mobile versions.

## Prompt 4: Customer Dashboard
Design a customer dashboard for Panda Laundry. Include a welcome header, summary cards for Active Orders, Next Pickup, Amount Due, and Completed Orders. Add a section for Recent Orders with status chips and quick actions: Track, Pay, Review. Include primary CTA for New Order. Provide empty state when user has no orders. Create responsive desktop and mobile layouts.

## Prompt 5: Services Catalog
Design a services catalog page with filter chips (Wash and Fold, Dry Clean, Ironing, Express), search bar, and service cards showing name, description, turnaround time, and starting price. Add Add to Order button on each card. Include selected services drawer on mobile and side panel on desktop. Include no results state and loading skeleton.

## Prompt 6: New Order Multi-Step Wizard
Design a 4-step order wizard for Panda Laundry:
Step 1 select services and quantities,
Step 2 pickup details (address, date, time),
Step 3 price summary (deposit, total, remaining),
Step 4 review and confirm.
Include top progress stepper, Previous and Continue buttons, field validation, and save draft option. Add success confirmation screen with order ID and Track Order button.

## Prompt 7: Orders List (Customer)
Design a customer orders page with tabs or filters for All, In Progress, Completed, and Cancelled. Each order card should show order number, created date, service summary, payment status, and order status. Include sorting and date filter. Provide empty state for each tab and a sticky New Order button on mobile.

## Prompt 8: Order Details + Timeline
Design an order details screen containing:
- Order summary card
- Pickup and delivery details
- Itemized order items table
- Payment block (deposit paid or pending)
- Status timeline (Placed, Picked Up, Processing, Out for Delivery, Delivered)
- Action buttons based on status: Pay Balance, Contact Support, Leave Review
Include mobile-first timeline design and desktop split layout.

## Prompt 9: Payments Screen
Design a payments page showing amount due, next payment deadline, payment method selector, and Pay Now button. Include payment history list with statuses (Paid, Pending, Failed), transaction IDs, and dates. Add failed payment retry flow and success receipt modal.

## Prompt 10: Transactions and Receipts
Design a transactions page with table columns: Date, Order ID, Method, Amount, Status, Receipt. Add filters for date range and status. Include Download Receipt action and detail drawer for full transaction info. On mobile, convert rows into stacked transaction cards.

## Prompt 11: Reviews Screen
Design a reviews interface where users can submit a star rating (1 to 5) and comment for completed orders. Include a list of previously submitted reviews with date and linked order. Add empty state for users with no completed orders and success toast after submission.

## Prompt 12: Profile and Account Settings
Design a profile page with editable fields: name, email, phone, saved addresses, and notification preferences. Include security section with Change Password and active session management. Add save confirmation and inline validation errors.

## Prompt 13: Admin Dashboard
Design an admin dashboard for laundry operations with cards for Total Orders Today, Pending Assignments, Revenue Today, and Failed Payments. Include an orders activity chart and a recent alerts panel. Add quick links to Orders, Users, Services, Payments, and Reviews moderation.

## Prompt 14: Admin Orders Management
Design an admin orders management page with data table columns: Order ID, Customer, Pickup Time, Status, Payment Status, Assigned Rider, Actions. Include filters for status, rider, and date. Add bulk actions and order details side drawer. Include Assign Rider modal and Update Status modal.

## Prompt 15: Admin Services CRUD
Design an admin services management page with a services table and Create/Edit Service modal. Fields include name, category, price, turnaround time, and active status toggle. Include delete confirmation dialog and success/error toast messages.

## Prompt 16: Admin Users Management
Design an admin users page with searchable table showing name, email, phone, role, account status, and created date. Include actions for view profile, change role, and deactivate account. Add role badges with clear color coding and confirmation dialogs for critical actions.

## Prompt 17: Admin Payments and Reconciliation
Design an admin payments page with filters for pending, paid, and failed transactions. Include daily totals summary, unpaid orders list, and retry status workflow. Add export CSV button and transaction detail panel.

## Prompt 18: Rider Assigned Orders
Design a rider app screen for assigned orders with list cards showing pickup address, customer phone, time window, and order status. Include map preview and Start Pickup button. Add pull-to-refresh and offline retry state for mobile.

## Prompt 19: Rider Order Progress Update
Design a rider order detail page with large, tappable status actions: Picked Up, At Facility, Out for Delivery, Delivered. Include proof-of-delivery upload area and notes field. Add confirmation dialog before final Delivered status.

## Prompt 20: Global Design System Prompt
Create a component library for Panda Laundry including typography scale, color tokens, spacing scale, buttons, inputs, chips, cards, tables, modals, toasts, and timeline components. Use a professional blue and warm accent palette, high contrast, and accessible form patterns. Provide desktop and mobile component variants and interaction states: default, hover, active, disabled, loading, error, success.

## Prompt 21: Empty, Error, and Loading States Pack
Design a complete state pack for the laundry app covering:
- No orders yet
- No services found
- Payment failed
- Unauthorized access
- Server unavailable
- Loading skeleton for list and detail screens
Include clear CTA buttons for each state such as Retry, Go to Dashboard, Create Order, and Contact Support.

## Prompt 22: End-to-End Interactive Prototype
Create an interactive prototype covering this path:
Landing -> Sign Up -> Dashboard -> New Order Wizard -> Order Confirmation -> Order Tracking Timeline -> Pay Balance -> Leave Review.
Include realistic microcopy for success and error states, mobile transitions, and desktop responsive behavior.

## Quick Prompt Enhancers (Optional)
Append any of these to improve output quality:
- Use 8-point spacing system and WCAG AA contrast.
- Prioritize thumb-friendly controls for mobile.
- Keep key CTA visible above the fold.
- Include realistic empty, loading, and error states.
- Use concise microcopy suitable for East African users.
