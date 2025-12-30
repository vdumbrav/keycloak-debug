# Keycloak Debug Sandbox

Debug tool for testing OIDC/Keycloak authentication flows. Provides real-time visibility into tokens, auth events, and session management.

## Features

- Login/Logout with redirect or popup
- Token inspection (Access, ID, Refresh)
- JWT decoding with payload/header view
- Token expiration countdown
- Silent token refresh
- Auth event logging
- Configurable OIDC settings

## Tech Stack

- React 19
- TypeScript 5.9
- Vite 7
- Tailwind CSS 4
- oidc-client-ts
- react-oidc-context

## Getting Started

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your Keycloak settings

# Run dev server
pnpm dev
```

## Environment Variables

```env
VITE_OIDC_AUTHORITY=https://auth.example.com/realms/myrealm
VITE_OIDC_CLIENT_ID=your-client-id
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm deploy` | Deploy to GitHub Pages |

## Project Structure

```
src/
├── components/
│   ├── AuthDebugPanel.tsx   # Main layout
│   ├── StatusCard.tsx       # Auth status display
│   ├── ActionsCard.tsx      # Login/logout buttons
│   ├── TokenPanel.tsx       # Token display & decode
│   ├── LogPanel.tsx         # Event log
│   └── SettingsForm.tsx     # OIDC settings modal
├── constants.ts             # Default settings, colors
├── helpers.ts               # Utilities (cn, JWT decode)
├── types.ts                 # TypeScript types
└── index.css                # Tailwind + design tokens
```

## License

MIT
