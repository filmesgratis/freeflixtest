/* Player FreeFlix (profissional: Firebase SDK + Firestore realtime) */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ===== Player ===== */
const params = new URLSearchParams(window.location.search);
const videoId = params.get("id");
const titulo = decodeURIComponent(params.get("titulo") || "Assistir filme");

const tituloEl = document.getElementById("tituloFilme");
if (tituloEl) tituloEl.innerText = titulo;
document.title = titulo + " | FreeFlix";

if (videoId) {
  const iframe = document.getElementById("playerIframe");
  if (iframe) iframe.src = "https://go.screenpal.com/player/" + videoId + "?embed=1";
}

/* ===== Firebase Config (use a sua config do Firebase Console) =====
   Firebase Console > Project settings > Your apps > Web app > Firebase SDK snippet (Config)
*/
const firebaseConfig = {
  apiKey: "AIzaSyAP6Y1uiOEafLGfry27UiBso1ShV1C2uJk",
  authDomain: "freeflix-82019.firebaseapp.com",
  projectId: "freeflix-82019",
  // storageBucket: "freeflix-82019.appspot.com",
  // messagingSenderId: "...",
  // appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ===== DOM ===== */
const listaEl = document.getElementById("listaComentarios");
const nomeEl = document.getElementById("nomeComentario");
const textoEl = document.getElementById("textoComentario");
const btn = document.getElementById("btnEnviarComentario");

/* ===== Helpers ===== */
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function renderComentarios(docs) {
  if (!listaEl) return;

  if (!docs.length) {
    listaEl.innerHTML = `<div class="comentario-item">Sem comentários ainda.</div>`;
    return;
  }

  listaEl.innerHTML = docs.map((doc) => {
    const f = doc.data();
    const when = f.createdAt?.toDate
      ? f.createdAt.toDate().toLocaleString("pt-BR")
      : "";

    return `
      <div class="comentario-item">
        <div class="comentario-topo">
          <div class="comentario-nome">${escapeHtml(f.name || "Anônimo")}</div>
          <div>${escapeHtml(when)}</div>
        </div>
        <div class="comentario-texto">${escapeHtml(f.text || "")}</div>
      </div>
    `;
  }).join("");
}

/* ===== Realtime listener (profissa) ===== */
let unsubscribe = null;

function iniciarListenerComentarios() {
  if (!videoId || !listaEl) return;

  // Query: comentários do filme, mais recentes primeiro (limite opcional)
  const q = query(
    collection(db, "comments"),
    where("filmId", "==", videoId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  // Realtime
  unsubscribe = onSnapshot(
    q,
    (snap) => renderComentarios(snap.docs),
    (err) => {
      console.error("Erro ao ouvir comentários:", err);
      listaEl.innerHTML = `<div class="comentario-item">Erro ao carregar comentários.</div>`;
    }
  );
}

/* ===== Enviar comentário ===== */
async function enviarComentario() {
  if (!videoId || !textoEl) return;

  const text = (textoEl.value || "").trim();
  if (!text) return;

  const name = (nomeEl && nomeEl.value ? nomeEl.value : "Anônimo").trim();

  try {
    await addDoc(collection(db, "comments"), {
      filmId: videoId,
      name: name || "Anônimo",
      text,
      createdAt: serverTimestamp()
    });

    textoEl.value = "";
  } catch (e) {
    console.error("Erro ao enviar comentário:", e);
    alert("Não foi possível enviar seu comentário agora.");
  }
}

/* ===== Auth anônimo (recomendado) ===== */
async function garantirAuthAnonimo() {
  // Se você não quiser auth, pode remover tudo de auth e deixar rules abertas.
  // Mas o ideal é usar auth anônimo pra melhorar segurança.
  await signInAnonymously(auth);
}

if (btn) btn.addEventListener("click", enviarComentario);

/* ===== Boot ===== */
(async () => {
  try {
    await garantirAuthAnonimo();

    // espera o auth estar pronto (só pra garantir rules)
    onAuthStateChanged(auth, (user) => {
      if (!user) return;
      if (unsubscribe) unsubscribe();
      iniciarListenerComentarios();
    });
  } catch (e) {
    console.error("Erro auth/firebase:", e);
    if (listaEl) listaEl.innerHTML = `<div class="comentario-item">Erro ao carregar comentários.</div>`;
  }
})();
