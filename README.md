# Barbería El Corte — Chatbot con Groq

Chatbot que solo responde consultas relacionadas con la barbería (turnos,
horarios, cortes, barba, precios, etc.). La API key de Groq y la lista de
palabras clave viven en el servidor (`api/chat.js`), nunca se envían al
navegador.

## Estructura

```
barberia-chatbot/
├── api/
│   └── chat.js       ← función serverless: filtra por keywords y llama a Groq
├── public/
│   └── index.html    ← frontend estático (sin API key ni keywords visibles)
├── package.json
├── vercel.json
└── .env.example
```

## Correrlo en local

1. Instalar la CLI de Vercel (una sola vez):
   ```
   npm install -g vercel
   ```
2. Copiar `.env.example` a `.env` y pegar tu API key de Groq
   (conseguila en https://console.groq.com/home):
   ```
   cp .env.example .env
   ```
3. Levantar el entorno de desarrollo:
   ```
   vercel dev
   ```
4. Abrir la URL que te muestre la terminal (por defecto `http://localhost:3000`).

## Desplegarlo en Vercel

1. Subí esta carpeta a un repo de GitHub (el `.gitignore` ya excluye `.env`,
   así que tu API key no se sube).
2. Entrá a https://vercel.com, "Add New… → Project" e importá el repo.
3. En **Settings → Environment Variables** del proyecto, agregá:
   - `GROQ_API_KEY` = tu API key de Groq
4. Deploy. Listo, la key queda guardada solo en Vercel, nunca en el código
   ni visible para quien use la página.

## Adaptarlo a otro rubro

Todo lo específico del proyecto (nombre del bot, palabras clave permitidas
y el system prompt) está centralizado en `api/chat.js`, en las constantes
`BOT_NAME`, `KEYWORDS` y `SYSTEM_PROMPT`.
