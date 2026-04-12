# Smart Ledger

Smart Ledger is a React + Vite frontend for managing business finance workflows, including expenses, vehicle orders, transactions, reports, and exports.

## Repository

- Frontend repo: `Smart-Ledger`
- Paired backend repo: `SmartLedger-Backend`

## Tech Stack

- React 19
- React Router
- Vite
- React Toastify
- jsPDF + jspdf-autotable
- Google Translate widget integration (English/Japanese UI support)

## Core Features

- Token-based login flow
- Dashboard summary cards and latest invoices
- Expense management with categories, transaction linking, restaurant/shop linkage, and PDF exports
- Revenue and order management with filtering, create/edit/delete, invoice generation, and payment status updates
- Car categories and vehicle collection management
- Customer and saler management
- Auction and company account management
- Transaction management
- Financial data export (Excel report download)
- Profile settings and account details update

## API Integration

- API base is configured in `src/config.js` with default value `/api`.
- The project expects backend routes such as `/api/account/*`, `/api/revenue/*`, `/api/expenses`, `/api/categories`, `/api/restaurants`, and `/api/spare-parts`.
- Vercel rewrite is configured in `vercel.json` to proxy `/api/*` to `https://huzaifanasirfab.pythonanywhere.com/api/*`.

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Run

```bash
npm install
npm run dev
```

App starts on Vite dev server (typically `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
src/
  components/        # Feature screens (dashboard, orders, expenses, etc.)
  api.js             # Authenticated fetch wrapper
  config.js          # API base URL
  translator.js      # Backend translation helpers
  translations.js    # UI translation dictionary
```

## Notes

- Authentication token is stored in browser `localStorage`.
- On unauthorized API response (`401`), local session is cleared and app reloads.
- Pagination is supported across most data screens.

License
This project is open-source under the MIT License, unless specified otherwise.

Contact
For any questions or suggestions, feel free to reach out:

Email: huzaifanasirbutt@gmail.com
LinkedIn: Huzaifa Nasir
