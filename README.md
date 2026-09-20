# RepeatPilot MVP

**Put repeat revenue on autopilot.**

RepeatPilot imports historic customer/service data, calculates when each customer should return, surfaces overdue and upcoming revenue, sends recall emails, tracks booking-link clicks, and attributes recovered bookings.

## V1 scope

- Password-protected pilot dashboard
- PostgreSQL schema designed for multiple businesses
- CSV customer/service import
- Automatic next-due calculation
- Dashboard: overdue, due soon, contacted, booked, recovered revenue, 90-day opportunity
- Customer/service views
- Manual “mark booked” attribution
- 30-day reminder email worker using the Resend HTTP API
- Click tracking through `/r/:subscriptionId`
- Synthetic 1,000-customer heat-pump demo seed

## Local setup

1. Copy `.env.example` to `.env.local` and add a PostgreSQL `DATABASE_URL`.
2. Install packages: `npm install`
3. Apply schema: `npm run db:migrate`
4. Seed demo: `npm run db:seed`
5. Start: `npm run dev`
6. Open `http://localhost:3000` and use `ADMIN_PASSWORD`.

## CSV format

Recommended columns:

```csv
Customer,Email,Service,Last Serviced,Interval Months,Service Value
Jane Smith,jane@example.com,Annual Heat Pump Service,12/10/2025,12,249
```

Common variants such as `Client`, `Job Type`, `Completed Date`, `Email Address`, and `Repeat Months` are recognised.

## Railway

Create one web service from this repo and one PostgreSQL service.

Web service variables:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `ADMIN_PASSWORD=<strong password>`
- `SESSION_SECRET=<random secret>`
- `BUSINESS_SLUG=demo-heat-pumps`
- `APP_BASE_URL=https://<railway-domain>`
- `RESEND_API_KEY=<optional until live sending>`
- `FROM_EMAIL=<verified sender>`

Before first deploy, run `npm run db:migrate` as Railway's pre-deploy command. After deploy, run `npm run db:seed` once for the demo.

For automated reminder processing, create a second Railway service from the same repo with start command `npm run send:due` and a daily cron schedule, or run the script manually during early pilots.

## V1 guardrails

Do not addCRM pipelines, invoicing, staff scheduling, inventory, quoting, mobile apps or broad AI features until the first real customer has been recovered and attributed.


## Pilot infrastructure note

The current Railway demo can run against a PostgreSQL container on Railway's private network. **Do not load production customer data until PostgreSQL has persistent storage** (a Railway managed PostgreSQL database or an attached persistent volume). The application is designed to use a standard `DATABASE_URL`, so the database can be swapped without changing application code.

Normal production deploys should run only:

`node scripts/migrate.mjs`

The synthetic heat-pump seed is for demonstrations only and must not be part of recurring production deploys.
