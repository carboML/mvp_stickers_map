## Stickers Map (NFC demo)

Webapp muy sencilla para registrar pegatinas NFC en un mapa. Para registrar una pegatina, el NFC abre una URL con un `nfcId`.

### Desarrollo

```bash
npm install
npm run dev
```

### Supabase (datos compartidos móvil / ordenador)

Sin backend, cada dispositivo tenía su propio `localStorage`. Con Supabase las pegatinas se guardan en la nube y se ven en todos los sitios.

1. Crea un proyecto en [Supabase](https://supabase.com).
2. **SQL Editor** → pega y ejecuta `supabase/schema.sql`.
3. **Project Settings → API**: copia **URL** y **anon public key**.
4. Crea `.env.local` (local) a partir de `.env.example`:

```bash
cp .env.example .env.local
```

5. En **Vercel** → tu proyecto → **Settings → Environment Variables**, añade:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy.

### MCP de Supabase (gestionar desde Cursor)

Supabase ofrece un servidor MCP para consultar el proyecto, esquema SQL, etc., desde el asistente. Guía oficial: [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp).

### URL a grabar en el NFC

Ejemplo:

```text
https://TU-DOMINIO/register?nfcId=lot:bodegon-on-tour:sticker:34
```

### Deploy

- **Vercel**: incluye `vercel.json` para que rutas como `/register` funcionen al abrirlas directo.
- **Netlify**: incluye `public/_redirects` para lo mismo.
