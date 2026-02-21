/* Player FreeFlix (organizado) */
const params = new URLSearchParams(window.location.search);
const videoId = params.get("id");
const titulo = decodeURIComponent(params.get("titulo") || "Assistir filme");

const tituloEl = document.getElementById("tituloFilme");
if(tituloEl) tituloEl.innerText = titulo;
document.title = titulo + " | FreeFlix";

if(videoId){
  const iframe = document.getElementById("playerIframe");
  if(iframe){
    iframe.src = "https://go.screenpal.com/player/" + videoId + "?embed=1";
  }
}

/* ================= FIREBASE CONFIG =================
   ATENÇÃO: coloque sua API KEY abaixo se for usar Firestore.
*/
const FIREBASE_PROJECT_ID = "freeflix-82019";
const FIREBASE_API_KEY = "AIzaSyAP6Y1uiOEafLGfry27UiBso1ShV1C2uJk";

const baseUrl =
`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/comments?key=${FIREBASE_API_KEY}`;

const listaEl = document.getElementById("listaComentarios");
const nomeEl = document.getElementById("nomeComentario");
const textoEl = document.getElementById("textoComentario");

/* ====== CARREGAR COMENTÁRIOS (corrigido) ====== */
async function carregarComentarios(){
  if(!videoId || !listaEl) return;

  const queryUrl =
`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;

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
      orderBy: [{
        field:{ fieldPath:"createdAt" },
        direction:"DESCENDING"
      }]
    }
  };

  try{
    const res = await fetch(queryUrl,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(()=>null);

    // ✅ Se deu erro de permissão / query / etc, agora aparece
    if(!res.ok || data?.error){
      console.error("Erro ao buscar comentários (runQuery):", res.status, data);
      listaEl.innerHTML = `<div class="comentario-item">Erro ao carregar comentários.</div>`;
      return;
    }

    const docs = (data || []).map(d => d.document).filter(Boolean);

    if(docs.length === 0){
      listaEl.innerHTML = `<div class="comentario-item">Sem comentários ainda.</div>`;
      return;
    }

    listaEl.innerHTML = docs.map(d=>{
      const f = d.fields || {};
      const when = f.createdAt?.timestampValue
        ? new Date(f.createdAt.timestampValue).toLocaleString("pt-BR")
        : "";

      return `
        <div class="comentario-item">
          <div class="comentario-topo">
            <div class="comentario-nome">${f.name?.stringValue || "Anônimo"}</div>
            <div>${when}</div>
          </div>
          <div class="comentario-texto">${f.text?.stringValue || ""}</div>
        </div>
      `;
    }).join("");

  }catch(e){
    console.error("Erro geral ao carregar comentários:", e);
    listaEl.innerHTML = `<div class="comentario-item">Erro ao carregar comentários.</div>`;
  }
}

/* ====== ENVIAR COMENTÁRIO (leve ajuste) ====== */
async function enviarComentario(){
  if(!videoId || !textoEl || !textoEl.value.trim()) return;

  const payload = {
    fields:{
      filmId:{ stringValue: videoId },
      name:{ stringValue: (nomeEl && nomeEl.value) ? nomeEl.value : "Anônimo" },
      text:{ stringValue: textoEl.value.trim() },
      createdAt:{ timestampValue: new Date().toISOString() }
    }
  };

  try{
    const res = await fetch(baseUrl,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    // ✅ Se der erro no POST, agora aparece
    if(!res.ok){
      const err = await res.json().catch(()=>null);
      console.error("Erro ao enviar comentário:", res.status, err);
      return;
    }

    textoEl.value="";
    await carregarComentarios();
  }catch(e){
    console.error("Erro geral ao enviar comentário:", e);
  }
}

const btn = document.getElementById("btnEnviarComentario");
if(btn) btn.addEventListener("click", enviarComentario);

carregarComentarios();
