// api/chat.js
// Función serverless de Vercel. Corre en el servidor, así que:
// - la API key de Groq nunca se expone al navegador (vive en una variable de entorno)
// - la lista de palabras clave tampoco viaja al cliente
//
// Para adaptar este chatbot a otro rubro solo hay que tocar KEYWORDS,
// SYSTEM_PROMPT y BOT_NAME acá abajo.

const BOT_NAME = "Barbería El Corte";

const KEYWORDS = [
  "turno", "turnos", "reserva", "reservar", "cita",
  "horario", "horarios", "atencion", "abren", "cierran",
  "precio", "precios", "cuesta", "vale", "costo",
  "corte", "cortes", "fade", "degrade", "degradado",
  "barba", "afeitado", "afeitar", "navaja", "perfilado", "diseno",
  "tinte", "color", "tratamiento", "tratamientos",
  "cejas", "cera",
  "cabello", "pelo",
  "productos",
  "direccion", "ubicacion", "donde",
  "servicios", "barberia", "peluqueria", "salon"
];

const SYSTEM_PROMPT =
  `Sos el asistente virtual de '${BOT_NAME}'. ` +
  "Respondé ÚNICAMENTE preguntas relacionadas con turnos, horarios de atención, " +
  "servicios (cortes, fade/degradado, barba, afeitado con navaja, perfilado, tratamientos, etc.), precios, " +
  "ubicación y productos que usa la barbería. " +
  "Si te preguntan sobre cualquier otro tema, respondé amablemente que solo podés " +
  "ayudar con consultas relacionadas a la barbería, sin responder la pregunta original. " +
  "Si la persona menciona su nombre en algún momento de la charla, usalo para " +
  "personalizar tus próximas respuestas (ej: '¡Hola, Franco!'). " +
  "Usá **negrita** con doble asterisco para resaltar datos clave como horarios, " +
  "precios o nombres de servicios. Sé breve y cordial en tus respuestas.";

const MODEL = "llama-3.1-8b-instant";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // saca tildes
}

function matchesKeyword(text) {
  const normalized = normalize(text || "");
  return KEYWORDS.some((k) => normalized.includes(k));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Falta el array 'messages'" });
    return;
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  // --- Filtro por palabras clave, del lado del servidor ---
  if (!lastUserMessage || !matchesKeyword(lastUserMessage.content)) {
    res.status(200).json({
      blocked: true,
      reply:
        "Solo puedo ayudarte con consultas sobre la barbería (turnos, horarios, cortes, barba, precios, etc.). ¿Querés preguntarme algo de eso?",
    });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "Falta configurar la variable de entorno GROQ_API_KEY en el proyecto de Vercel.",
    });
    return;
  }

  try {
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 1,
        max_completion_tokens: 512,
        top_p: 1,
        stream: false,
        stop: null,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      res.status(groqRes.status).json({ error: errText });
      return;
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "(sin respuesta)";

    res.status(200).json({ blocked: false, reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
