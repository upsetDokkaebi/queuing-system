# Lineflow Queue System

Lineflow is a browser-based queue management prototype for Northstar Clinic. It provides a staff dashboard, a visitor registration flow, and a public queue display that share queue updates in the browser.

## Features

- Staff sign-in with selectable service windows 01-04
- Live queue dashboard with waiting count, served count, wait times, and service status
- Call the next visitor or call a specific ticket
- Update a window's status and clear its serving number
- Visitor registration with generated queue tickets and people-ahead count
- Public display of active windows and the next tickets in line
- Light and dark dashboard themes
- Shared state across pages and browser tabs through `localStorage`

## Run Locally

This is a static HTML, CSS, and JavaScript project with no build step or package installation required.

Open `index.html` directly in a browser, or serve the project directory with any static web server. For example, with Python installed:

```bash
python -m http.server 8000
```

Then open:

- Staff dashboard: `http://localhost:8000/index.html`
- Visitor registration: `http://localhost:8000/register.html`
- Public display: `http://localhost:8000/display.html`

Using a local server is recommended when testing the pages together in multiple tabs.

## Demo Staff Accounts

All accounts use the same dashboard. Choose any available service window during sign-in.

| Email | Password |
| --- | --- |
| `admin01@northstar.ph` | `lineflow01` |
| `admin02@northstar.ph` | `lineflow02` |
| `admin03@northstar.ph` | `lineflow03` |
| `admin04@northstar.ph` | `lineflow04` |
| `admin@admin.com` | `admin` |

These credentials are for demonstration only. Authentication is client-side and is not suitable for production use.

## Typical Demo Flow

1. Open `register.html` and register a visitor.
2. Open `index.html`, sign in, and choose a service window.
3. Call the visitor from the dashboard.
4. Open `display.html` to see the updated window and queue state.

Queue state is stored under the `lineflow-queue-v2` browser storage key. Use **Reset queue** in the staff dashboard to restore the initial demo queue.

## Project Structure

```text
index.html          Staff login and queue dashboard
register.html       Visitor registration and ticket view
display.html        Public queue display
scripts/
  accounts.js       Demo staff accounts
  app.js            Dashboard state and queue controls
  display.js        Public display rendering and refresh
  login.js          Staff authentication and sign-out
  queue-data.js     Initial queue and service-window data
  register.js       Visitor registration and ticket tracking
  wait-time.js      Queue wait-time calculations
styles/
  style.css         Staff dashboard styles
  register.css      Visitor registration styles
  display.css       Public display styles
```

## Notes

- Queue updates are simulated locally; there is no backend or network synchronization service.
- The public display refreshes shared state every two seconds.
- The display page loads Font Awesome from its CDN reference for icons.
- Edit `scripts/queue-data.js` to change the initial demo queue and window setup.
