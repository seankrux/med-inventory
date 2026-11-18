# Cloudflare deployment

OpenNext deploys the complete Next.js application to Sean's personal account
`7a7a08127b6d6744c838413b4473ecf1`, as Worker `seankrux-med-inventory`.
Server routes and authentication remain part of the application.

```bash
npm ci
npm run build:cloudflare
npm run deploy:cloudflare
```

The Cloudflare workflow validates pull requests and deploys `main` only after
checks pass. Its `CLOUDFLARE_API_TOKEN` secret grants access to the personal account.
Supabase public settings are separate build secrets; server credentials stay in
`CLOUDFLARE_RUNTIME_ENV`, copied privately to Workers secrets after deployment.
No service-role credentials are included in the browser bundle.
The original Vercel project is retained with Git deployments disabled.
