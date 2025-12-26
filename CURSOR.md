# GABY-CRM Project Context

## Project Overview

GABY-CRM is a Customer Relationship Management system built for managing customers and invoices, specifically designed for healthcare/care services in Germany. The application handles customer data, invoice generation, budget tracking, and integrates with external services for PDF generation and file uploads.

**Language**: German (UI and content)
**Target Market**: Healthcare/care services (Pflegedienst)

## Tech Stack

### Core Framework
- **Next.js 16.0.10** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety

### Database & ORM
- **Turso (LibSQL)** - SQLite-compatible cloud database
- **Drizzle ORM 0.45.0** - Type-safe SQL ORM
- **Drizzle Kit 0.31.8** - Database migrations and tooling

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI components:
  - Alert Dialog
  - Checkbox
  - Dialog
  - Label
  - Popover
  - Select
- **shadcn/ui** - Component library (customizable Radix UI components)
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **next-themes** - Theme management (dark mode support)

### Forms & Validation
- **React Hook Form 7.68.0** - Form state management
- **Zod 4.1.13** - Schema validation
- **@hookform/resolvers** - Zod integration for React Hook Form

### Utilities
- **PapaParse** - CSV parsing for customer imports
- **UUID** - Unique identifier generation
- **class-variance-authority** - Component variant management
- **clsx & tailwind-merge** - Conditional class utilities
- **cmdk** - Command palette component

### Development Tools
- **ESLint** - Code linting
- **Drizzle Kit** - Database migrations

## Project Structure

```markdown:/Users/till/dev/gaby-crm/CURSOR.md
<code_block_to_apply_changes_from>
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   └── login/               # Login page
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── customers/          # Customer management
│   │   │   ├── [id]/           # Customer detail/edit pages
│   │   │   ├── import/         # CSV import page
│   │   │   ├── new/            # New customer form
│   │   │   └── page.tsx        # Customer list
│   │   ├── invoices/           # Invoice management
│   │   │   ├── new/            # New invoice form
│   │   │   └── page.tsx        # Invoice list
│   │   ├── layout.tsx          # Dashboard layout wrapper
│   │   └── page.tsx            # Dashboard home
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   ├── login/          # Login endpoint
│   │   │   └── logout/         # Logout endpoint
│   │   └── invoices/
│   │       ├── route.ts        # Invoice API
│   │       └── webhook/        # External webhook handler
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── customers/              # Customer-related components
│   │   ├── CustomerForm.tsx
│   │   ├── CustomerRow.tsx
│   │   ├── DeleteCustomerDialog.tsx
│   │   └── FilteredCustomerList.tsx
│   ├── invoices/              # Invoice-related components
│   │   ├── DeleteInvoiceDialog.tsx
│   │   ├── InvoiceForm.tsx
│   │   └── MobileInvoiceList.tsx
│   ├── dashboard/             # Dashboard components
│   │   └── TurnoverCard.tsx
│   ├── layout/                # Layout components
│   │   └── AppLayout.tsx      # Main app layout with sidebar
│   └── ui/                    # Reusable UI components (shadcn/ui)
├── db/
│   ├── index.ts               # Database connection (Drizzle)
│   └── schema.ts              # Database schema definitions
├── lib/
│   ├── actions/               # Server actions
│   │   ├── customer.actions.ts
│   │   ├── invoice.actions.ts
│   │   └── upload.actions.ts
│   └── utils.ts               # Utility functions
└── middleware.ts              # Next.js middleware (auth protection)
```

## Database Schema

### Tables

#### `customers`
Stores customer/person information:
- Personal data: `firstName`, `lastName`, `birthDate`, `email`
- Contact: `mobilePhone`, `landlinePhone`
- Address: `street`, `houseNumber`, `postalCode`, `city`
- Insurance: `insuranceNumber`, `healthInsurance`, `healthInsurancePhone`, `healthInsuranceEmail`
- Care: `careLevel` (1-5)
- Documents: `abtretungserklaerungUrl` (assignment declaration PDF)
- Notes: `notes`

#### `invoices`
Stores invoice records with customer data snapshot:
- **Status**: `processing`, `in_delivery`, `sent`, `aborted`
- **Customer snapshot**: All customer fields are duplicated here for historical accuracy
- **Invoice data**:
  - `hours` (REAL) - Service hours
  - `ratePerHour` (REAL, default: 47.0) - Hourly rate in EUR
  - `km` (REAL, default: 0) - Kilometers traveled
  - `ratePerKm` (REAL, default: 0.30) - Rate per km in EUR
  - `description` - Service description
- **Metadata**:
  - `date` - Invoice date
  - `invoiceNumber` - Generated invoice number (can be null initially)
  - `invoicePdfUrl` - URL to generated PDF
  - `createdAt` - ISO timestamp
  - `abtretungserklaerungUrl` - Assignment declaration URL

**Important**: Invoice amounts are calculated as: `((hours * ratePerHour) + (km * ratePerKm)) * 1.19` (includes 19% VAT)

#### `customer_budgets`
Tracks yearly budget spending per customer:
- `customerId` - Foreign key to customers
- `year` - Budget year
- `amount` (REAL) - Total amount spent (automatically updated when invoices are created/deleted)

## Key Features

### Authentication
- **Simple password-based auth**: Password is `"MeinCRM26!"` (hardcoded in login route)
- **Cookie-based session**: `auth_token` cookie, 7-day expiration
- **Middleware protection**: All routes except `/login` and API routes require authentication
- **Logout**: Clears auth cookie and redirects to login

### Customer Management
- **CRUD operations**: Create, read, update, delete customers
- **CSV import**: Import customers from CSV files
- **Search/Filter**: Filter customers by name
- **Budget tracking**: View yearly budget per customer
- **File uploads**: Upload assignment declarations (Abtretungserklärung) via external webhook

### Invoice Management
- **Invoice creation**: Create invoices with customer data snapshot
- **Status workflow**: 
  - `processing` → `in_delivery` → `sent` (or `aborted`)
- **External PDF generation**: Webhook integration for PDF generation
- **Budget auto-update**: Creating/deleting invoices automatically updates customer budgets
- **Monthly turnover**: Dashboard shows current month's turnover (Berlin timezone)
- **Invoice webhook**: External service can update invoice status via `/api/invoices/webhook`

### Dashboard
- **Monthly turnover card**: Shows current month's total revenue
- **Quick actions**: Links to create customers, invoices, view lists
- **Responsive design**: Mobile-friendly with collapsible sidebar

## API Routes

### `/api/auth/login` (POST)
- **Body**: `{ password: string }`
- **Response**: `{ success: boolean }` or `{ error: string }`
- Sets `auth_token` cookie on success

### `/api/auth/logout` (POST)
- Clears `auth_token` cookie

### `/api/invoices/webhook` (POST)
External webhook for invoice status updates:
- **Actions**:
  - `invoice_generated`: Updates invoice with `invoiceNumber` and `invoicePdfUrl`, sets status to `in_delivery`
  - `invoice_sent`: Sets status to `sent`
- **Body**: `{ action: string, id: number, invoiceNumber?: string, url?: string }`

## Server Actions

### Customer Actions (`customer.actions.ts`)
- `getCustomers()` - Fetch all customers with current year budget
- `getCustomer(id)` - Fetch single customer with budget
- `createCustomer(data)` - Create new customer
- `updateCustomer(id, data)` - Update customer
- `deleteCustomer(id)` - Delete customer
- `importCustomers(data[])` - Bulk import customers

### Invoice Actions (`invoice.actions.ts`)
- `createInvoice(data)` - Create invoice, update budget, trigger webhook
- `getInvoices()` - Fetch all invoices
- `deleteInvoice(id)` - Delete invoice, decrement budget
- `getInvoiceCountForCustomer(customerId)` - Count invoices for customer
- `getMonthlyTurnover()` - Calculate current month turnover (Berlin timezone)

### Upload Actions (`upload.actions.ts`)
- `uploadFile(formData)` - Forward file upload to external webhook (`UPLOAD_WEBHOOK_URL`)

## Environment Variables

Required environment variables:
- `TURSO_DATABASE_URL` - Turso database connection URL
- `TURSO_AUTH_TOKEN` - Turso authentication token
- `UPLOAD_WEBHOOK_URL` - External webhook URL for file uploads

## Important Implementation Details

### Invoice Status Flow
1. Invoice created with status `processing`
2. External service generates PDF → webhook updates to `in_delivery` with PDF URL
3. External service sends invoice → webhook updates to `sent`
4. Can be set to `aborted` if needed

### Budget Calculation
- Budgets are tracked per customer per year
- Automatically incremented when invoices are created
- Automatically decremented when invoices are deleted
- Amount includes 19% VAT: `(hours * ratePerHour + km * ratePerKm) * 1.19`

### Timezone Handling
- Monthly turnover uses Berlin timezone (`Europe/Berlin`)
- Invoice dates are stored as text (ISO strings)

### File Uploads
- Files are uploaded via external webhook service
- URLs are stored in database for later retrieval
- Used for assignment declarations (Abtretungserklärung)

### Data Snapshot Pattern
- Invoices store a snapshot of customer data at creation time
- This ensures historical accuracy even if customer data changes later

## Development Notes

### Database Migrations
- Use Drizzle Kit: `drizzle-kit generate` and `drizzle-kit push`
- Config in `drizzle.config.ts`

### Styling
- Uses Tailwind CSS 4
- Dark mode supported via `next-themes`
- Responsive design with mobile-first approach

### Form Validation
- All forms use React Hook Form + Zod
- Client-side validation with server-side actions

### Type Safety
- Database types inferred from schema: `Customer`, `NewCustomer`, `Invoice`, `NewInvoice`, `CustomerBudget`, `NewCustomerBudget`
- Full TypeScript coverage

## Security Considerations

⚠️ **Current Security Issues**:
1. **Hardcoded password**: Password is hardcoded in login route - should use environment variable
2. **No password hashing**: Simple string comparison
3. **No rate limiting**: Login endpoint has no rate limiting
4. **No CSRF protection**: Consider adding CSRF tokens for state-changing operations

## Future Improvements

- [ ] Move password to environment variable
- [ ] Implement proper password hashing
- [ ] Add rate limiting to auth endpoints
- [ ] Add CSRF protection
- [ ] Add user roles/permissions
- [ ] Add audit logging
- [ ] Add data export functionality
- [ ] Add invoice templates
- [ ] Add email notifications
- [ ] Add invoice reminders
```

I've created a CURSOR.md file that documents:

1. **Project Overview** - Purpose and target market
2. **Tech Stack** - Dependencies and versions
3. **Project Structure** - File organization
4. **Database Schema** - Tables and relationships
5. **Key Features** - Authentication, customer/invoice management, dashboard
6. **API Routes** - Endpoints and their purposes
7. **Server Actions** - Available server-side functions
8. **Environment Variables** - Required configuration
9. **Implementation Details** - Important patterns and behaviors
10. **Security Considerations** - Current issues and recommendations
11. **Future Improvements** - Potential enhancements

This should provide context for working on the project. The file is ready to use.
