// ====== CONFIG ======
const FIREBASE_PROJECT_ID = "freeflix-6a0d4";
const FIREBASE_API_KEY = "AIzaSyAP6Y1uiOEafLGfry27UiBso1ShV1C2uJk"; // <-- coloque sua key aqui (a mesma que você já usa)

// ====== ELEMENTOS ======
const nomeEl = document.getElementById("nome");
const textoEl = document.getElementById("comentario");
const btnEnviar = document.getElementById("btnEnviar");
const listaEl = document.getElementById("listaComentarios");

// ====== UTIL: pega o vídeo/filme pelo ?v= ======
const params = new URLSearchParams(window.location.search);
const videoId = params.get("v") || ""; // ex: ?v=abc123

// ====== UTIL: escapar HTML (evita quebrar layout e XSS básico) ======
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ====== ENDPOINTS ======
function runQueryUrl() {
  return `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
}
function createDocUrl() {
  return `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/comments?key=${FIREBASE_API_KEY}`;
}

// ====== CARREGAR COMENTÁRIOS ======
async function carregarComentarios() {
  if (!videoId || !listaEl) return;

  listaEl.innerHTML = `<div class="comentario-item">Carregando comentários...</div>`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: "comments" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "filmId" },
          op: "EQUAL",
          value: { stringValue: videoId }
        }
      },
      orderBy: [
        {
          field: { fieldPath: "createdAt" },
          direction: "DESCENDING"
        }
      ]
    }
  };

  try {
    const res = await fetch(runQueryUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok || data?.error) {
      console.error("Erro ao listar comentários (runQuery):", res.status, data);

      // Mensagem amigável:
      const msg =
        res.status === 403
          ? "Sem permissão para listar comentários (ajuste as Rules do Firestore)."
          : `Falha ao carregar comentários (erro ${res.status}).`;

      listaEl.innerHTML = `<div class="comentario-item">${escapeHtml(msg)}</div>`;
      return;
    }

    const docs = (Array.isArray(data) ? data : [])
      .map((d) => d.document)
      .filter(Boolean);

    if (docs.length === 0) {
      listaEl.innerHTML = `<div class="comentario-item">Sem comentários ainda.</div>`;
      return;
    }

    listaEl.innerHTML = docs
      .map((doc) => {
        const f = doc.fields || {};
        const name = escapeHtml(f.name?.stringValue || "Anônimo");
        const text = escapeHtml(f.text?.stringValue || "");
        const when = f.createdAt?.timestampValue
          ? new Date(f.createdAt.timestampValue).toLocaleString("pt-BR")
          : "";

        return `
          <div class="comentario-item">
            <div class="comentario-topo">
              <div class="comentario-nome">${name}</div>
              <div>${escapeHtml(when)}</div>
            </div>
            <div class="comentario-texto">${text}</div>
          </div>
        `;
      })
      .join("");
  } catch (e) {
    console.error("Falha geral ao carregar comentários:", e);
    listaEl.innerHTML = `<div class="comentario-item">Erro de rede ao carregar comentários.</div>`;
  }
}

// ====== ENVIAR COMENTÁRIO ======
async function enviarComentario() {
  if (!videoId) {
    alert("ID do vídeo não encontrado na URL. Ex: player.html?v=ABC");
    return;
  }

  const nome = (nomeEl?.value || "").trim() || "Anônimo";
  const texto = (textoEl?.value || "").trim();

  if (!texto) {
    alert("Digite um comentário!");
    return;
  }

  // trava botão pra evitar duplo envio
  if (btnEnviar) btnEnviar.disabled = true;

  const nowIso = new Date().toISOString();

  const body = {
    fields: {
      filmId: { stringValue: videoId },
      name: { stringValue: nome },
      text: { stringValue: texto },
      createdAt: { timestampValue: nowIso }
    }
  };

  try {
    const res = await fetch(createDocUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok || data?.error) {
      console.error("Erro ao criar comentário:", res.status, data);

      const msg =
        res.status === 403
          ? "Sem permissão para criar comentário (verifique as Rules)."
          : `Falha ao enviar comentário (erro ${res.status}).`;

      alert(msg);
      return;
    }

    // limpa textarea e recarrega lista
    if (textoEl) textoEl.value = "";
    await carregarComentarios();
  } catch (e) {
    console.error("Falha geral ao enviar comentário:", e);
    alert("Erro de rede ao enviar comentário.");
  } finally {
    if (btnEnviar) btnEnviar.disabled = false;
  }
}

// ====== EVENTOS ======
if (btnEnviar) {
  btnEnviar.addEventListener("click", (e) => {
    e.preventDefault();
    enviarComentario();
  });
}

// Carrega assim que abrir
carregarComentarios();
