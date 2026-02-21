let FILMES_CACHE = [];

function renderFilmes(lista){
  const grid = document.querySelector(".grid");
  if(!grid) return;

  grid.innerHTML = (lista || []).map(f => `
    <div class="card" onclick="window.location.href='player.html?id=${f.id}&titulo=${encodeURIComponent(f.titulo)}'">
      <div class="capa" style="background-image:url('assets/img/capas/${f.capa}')"></div>
      <div class="titulo">${f.titulo}</div>
    </div>
  `).join("");
}

function filtrarPorTermo(termo){
  const t = (termo || "").trim().toLowerCase();
  if(!t){ renderFilmes(FILMES_CACHE); return; }
  const filtrados = FILMES_CACHE.filter(f => (f.titulo||"").toLowerCase().includes(t));
  if(filtrados.length===0){
    const grid=document.querySelector(".grid");
    if(grid) grid.innerHTML="<p style='color:#aaa'>Nenhum filme encontrado.</p>";
    return;
  }
  renderFilmes(filtrados);
}

async function carregarFilmes(){
  const grid = document.querySelector(".grid");
  if(!grid) return;

  try{
    const res = await fetch("assets/js/filmes.json", { cache: "no-store" });
    FILMES_CACHE = await res.json();
    renderFilmes(FILMES_CACHE);
  }catch(e){
    console.error(e);
    grid.innerHTML = "<p style='color:#aaa'>Erro ao carregar filmes (verifique o filmes.json).</p>";
  }
}

function setupSearch(){
  const wrap = document.querySelector(".search-inline");
  const btn = document.getElementById("searchBtn");
  const input = document.getElementById("searchInput");
  if(!wrap || !btn || !input) return;

  const open = () => {
    wrap.classList.add("is-open");
    setTimeout(() => input.focus(), 50);
  };

  const close = () => {
    wrap.classList.remove("is-open");
    input.value = "";
    renderFilmes(FILMES_CACHE);
  };

  btn.addEventListener("click", () => {
    if(!wrap.classList.contains("is-open")) open();
    else close();
  });

  input.addEventListener("input", () => filtrarPorTermo(input.value));
  input.addEventListener("keydown", (e) => { if(e.key==="Escape") close(); });

  // fechar clicando fora (desktop)
  document.addEventListener("click", (e) => {
    if(window.innerWidth <= 768) return;
    if(!wrap.contains(e.target)) close();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarFilmes();
  setupSearch();
});
