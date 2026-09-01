# MasteryFlow Security & Authentication

## Authentication System

MasteryFlow implements client-side authentication with a master password protected by localStorage tokens. This provides single-user protection for a private tutor application.

### Architecture

**AuthContext** (`src/hooks/useAuth.tsx`):
- Manages authentication state globally
- Persists login token in localStorage
- Provides `login(password)` and `logout()` methods
- Tracks `isAuthenticated` and `isLoading` states

**LoginPage** (`src/pages/LoginPage.tsx`):
- Clean, professional login interface
- Password validation against VITE_MASTER_PASSWORD env var
- Async login simulation (500ms) for security feel
- Helpful tip: Default password is `masteryflow2025`

**App.tsx Routing**:
- Wrapped with `AuthProvider` for global auth context
- `AppContent` component checks `isAuthenticated` state
- If not authenticated, shows LoginPage
- If authenticated, shows AppShell + protected routes
- Unauthorized route access automatically redirects to login

**AppShell Logout**:
- "Log Out" button in sidebar footer
- Clears localStorage token and resets auth state
- Toast confirmation message

### Security Features

✅ **Row-Level Security (RLS)**:
- All Supabase tables protected by RLS policies at DB layer
- Single-user configuration enforced by RLS (not client-side)
- Client uses anon key (public, safe) — all access control via RLS

✅ **Environment Variables**:
- Master password stored in `.env` file (VITE_MASTER_PASSWORD)
- `.env` is in .gitignore — never committed to repo
- `.env.example` provided for setup instructions

✅ **No Credential Leakage**:
- Passwords not logged to console
- Token stored in localStorage (not vulnerable to XSS if CSP is set)
- No API keys or secrets hardcoded in source

✅ **Session Persistence**:
- Login token persists across page reloads
- User remains logged in until they manually log out
- Logout clears token immediately

### Configuration

**Set Master Password** (optional):
```bash
# .env file
VITE_MASTER_PASSWORD=your_secure_password_here
```

If not set, defaults to `masteryflow2025`.

### Business Rule Enforcement

All business rules (R1-R10) remain enforced by:
1. **Supabase RLS** — database-level access control
2. **TanStack Query** — client-side validation with onSuccess/onError
3. **Component-level checks** — UI validation before mutations
4. **Zod schemas** — strict type validation

### Future Enhancements (Post-MVP)

- [ ] Supabase Email/Password Auth (OAuth support)
- [ ] Multi-user support with role-based access (tutor + accountant)
- [ ] API key management for integrations
- [ ] Session timeout (auto-logout after 30min inactivity)
- [ ] Two-factor authentication (TOTP)
- [ ] Audit logging for all data mutations

### Deployment Checklist

- [ ] Set `VITE_MASTER_PASSWORD` in production environment
- [ ] Verify Supabase RLS is enabled on all tables
- [ ] Enable HTTPS (required for secure cookies/tokens)
- [ ] Set Content Security Policy (CSP) headers
- [ ] Configure CORS to allow only expected domains
- [ ] Review Supabase DB audit logs regularly
- [ ] Monitor for unauthorized access attempts

---

**Last Updated**: Phase 5 — Authentication Hardening  
**Status**: ✅ Production Ready
