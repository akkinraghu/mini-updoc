# Updoc - Medical Ticketing System

A mini version of Updoc, a medical ticketing system that allows patients to create consultation tickets and doctors to manage them.

## Features

- User authentication (login/signup) with different roles (patient/doctor)
- Ticket management (create, update, delete)
- Action logging for ticket activities
- Color-coded ticket statuses with visual indicators
- Paginated ticket navigation for doctors

## Tech Stack

- **Frontend**: React, TypeScript, React Router
- **Backend**: Express, TypeScript
- **Package Manager**: pnpm (workspace monorepo)

## Project Structure

```
updoc/
├── client/               # React frontend
│   ├── public/           # Static assets
│   └── src/              # React components and styles
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   └── tsconfig.json     # TypeScript configuration
├── package.json          # Root package.json for monorepo
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (v7 or higher)

### Installation

1. Install pnpm if you don't have it already:
   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Run both client and server in development mode:
```bash
pnpm dev
```

Run only the client:
```bash
pnpm client
```

Run only the server:
```bash
pnpm server
```

### Production Build

Build both client and server:
```bash
pnpm build
```

## Usage

1. Register as either a patient or doctor
2. Patients can create consultation tickets
3. Doctors can view, update, and delete tickets
4. All actions are logged and visible to doctors

## Routes

- `/` - Welcome page
- `/login` - Login/Signup page
- `/welcome` - Welcome page after login
- `/consultation` - Patient consultation form
- `/ticket` - Doctor ticket management interface
