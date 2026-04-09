## Stickers Map (NFC demo)

Webapp muy sencilla para registrar pegatinas NFC en un mapa. Para registrar una pegatina, el NFC abre una URL con un `nfcId`.

### Desarrollo

```bash
npm install
npm run dev
```

### URL a grabar en el NFC

Ejemplo:

```text
https://TU-DOMINIO/register?nfcId=lot:bodegon-on-tour:sticker:34
```

### Deploy

- **Vercel**: incluye `vercel.json` para que rutas como `/register` funcionen al abrirlas directo.
- **Netlify**: incluye `public/_redirects` para lo mismo.
