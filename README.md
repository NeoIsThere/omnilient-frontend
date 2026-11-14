# Omnilient frontend

Expo / React Native application. The web export is hosted at `https://omnilient.com`
on GitHub Pages and calls `https://api.omnilient.com/api`.

Use Node 22.13 or later:

```sh
npm ci
npm run build:contracts
npm run dev
```

For a local API, put `EXPO_PUBLIC_API_URL=http://localhost:3001/api` in
`apps/mobile/.env.local`. Public Expo variables are embedded into the browser
bundle; they are not secrets. The Actions workflow sets the production API URL.

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The deployable folder is `apps/mobile/dist`. The workflow tests pushes and pull
requests; successful pushes to `main` publish GitHub Pages. Manual runs on `main`
also publish. GitHub provides the deployment token automatically: no SSH key,
database password, Spaces credential, PAT, or Expo account is required here.

In GitHub Settings → Pages, select **GitHub Actions** as the source, set the
custom domain to `omnilient.com`, and enable HTTPS after DNS is verified. A public
repository works with GitHub Free; a private Pages source requires a supported
paid plan. The backend repository can remain private.

The export is a client-rendered application. Known routes have their own entry
HTML; dynamic lesson/quiz links use a custom 404 redirect through the root that
restores the original URL before Expo starts. This supports browser refreshes,
but the initial dynamic-path request returns HTTP 404 and it is not an SEO
prerendering solution. Newly published lessons do not require a frontend rebuild.

The local demo button is excluded from production. Session tokens are restored
from device storage after a refresh until their eight-hour expiry. Topic numbers
are calculated from the live catalog hierarchy and order; topic IDs and names
do not contain display numbers. Password recovery and
email verification are not implemented by this deployment work.

`packages/contracts` is the same public schema snapshot used by the backend;
compare `CONTRACTS.sha256` when coordinating releases. In the combined local
workspace, `npm run repos:prepare` generates both self-contained repositories.
