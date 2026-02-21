async function includeInto(selector, url){
  const el = document.querySelector(selector);
  if(!el) return;
  const res = await fetch(url);
  el.innerHTML = await res.text();
}

function setupHeaderButtons(){
  const actions = document.getElementById("header-actions");
  if(!actions) return;

  const page = document.body.getAttribute("data-page") || "";
  // default: no button
  let btn = "";

  if(page === "index"){
    btn = `<a class="btn-top" href="comentarios.html">Comentários</a>`;
  } else if(page === "filmes"){
    btn = `<a class="btn-top" href="index.html">Voltar</a>`;
  } else if(page === "player"){
    btn = `<a class="btn-top" href="filmes.html">Voltar</a>`;
  } else if(page === "apoio"){
    btn = `<a class="btn-top" href="index.html">Voltar</a>`;
  } else if(page === "comentarios"){
    btn = `<a class="btn-top" href="index.html">Voltar</a>`;
  }

  actions.innerHTML = btn;
}

async function bootLayout(){
  await includeInto("#header-slot", "components/header.html");
  await includeInto("#footer-slot", "components/footer.html");
  setupHeaderButtons();
}

document.addEventListener("DOMContentLoaded", bootLayout);
