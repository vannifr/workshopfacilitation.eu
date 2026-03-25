# workshopfacilitation.eu

Static website for Workshop Facilitation EU — professional facilitation services across Europe.

## Project structure

```
public_html/      Static site (HTML, CSS, JS, images)
tests/            Site tests
.github/workflows CI/CD pipeline
```

## Development

```bash
npm install
```

### Validation

```bash
npm run validate:html   # HTML validation via html-validate
npm run validate:css    # CSS linting via stylelint
npm test                # Run site tests
```

## Deployment

Pushes to `main` trigger automatic deployment via GitHub Actions:

1. **Validate** — runs HTML and CSS validation
2. **Deploy** — rsyncs `public_html/` to production over SSH

### Required GitHub secrets

| Secret | Description |
|---|---|
| `DEPLOY_HOST` | Server hostname or IP |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_PATH` | Remote directory path |
| `DEPLOY_KEY` | Private SSH key (ed25519) |
