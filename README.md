# Bebek Motoru

Kleine Next.js App mit einem einzigen API-Endpunkt **/api/ultrasound**,
der ein Bild an das Replicate-Modell `fofr/latent-consistency-model` schickt.

## Development

```bash
npm install
npm run dev
```

## Deployment auf Vercel

- Environment Variable `REPLICATE_API_TOKEN` setzen.
- Root Directory in den Vercel Settings auf `bebek-motoru` einstellen (falls du einen Monorepo hast).
