/* ================= FIREBASE =================== */
let db;

function initFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyAazEYsl7ci0F7pRCkfl6raXIArRymshcA",
    authDomain: "portal-de-noticias-e0a70.firebaseapp.com",
    projectId: "portal-de-noticias-e0a70",
    storageBucket: "portal-de-noticias-e0a70.firebasestorage.app",
    messagingSenderId: "975387914543",
    appId: "1:975387914543:web:db34077d47b323406af1da",
  };
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

/* ================= ADMIN =================== */
document.addEventListener("DOMContentLoaded", () => {
  initFirebase();

  const form = document.getElementById("formNoticia");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const titulo = document.getElementById("titulo").value;
      const conteudo = document.getElementById("editor").innerHTML;
      const imagem = document.getElementById("imagem").value;
      const categoria = document.getElementById("categoria").value;
      const docId = document.getElementById("docId").value;

      const noticia = {
        titulo,
        conteudo,
        imagem,
        categoria,
        data: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (docId) {
        // Editar notícia existente
        db.collection("noticias")
          .doc(docId)
          .set(noticia)
          .then(() => {
            alert("Notícia editada!");
            form.reset();
            document.getElementById("docId").value = "";
            document.getElementById("editor").innerHTML = "";
            mostrarNoticiasAdmin();
          })
          .catch((err) => console.error(err));
      } else {
        // Nova notícia
        db.collection("noticias")
          .add(noticia)
          .then(() => {
            alert("Notícia publicada!");
            form.reset();
            document.getElementById("editor").innerHTML = "";
            mostrarNoticiasAdmin();
          })
          .catch((err) => console.error(err));
      }
    });
  }

  mostrarNoticiasAdmin();
});

// Editor de texto rico
function formatar(comando, valor = null) {
  document.execCommand(comando, false, valor);
}

// Mostrar notícias no admin
function mostrarNoticiasAdmin() {
  const container = document.getElementById("listaNoticias");
  if (!container) return;

  db.collection("noticias")
    .orderBy("data", "desc")
    .get()
    .then((snapshot) => {
      const noticias = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      container.innerHTML = noticias
        .map(
          (n) => `
        <div class="noticia-card-admin">
          <h3>${n.titulo}</h3>
          <p><strong>Categoria:</strong> ${n.categoria}</p>
          <button onclick="editarNoticia('${n.id}')">Editar</button>
          <button onclick="apagarNoticia('${n.id}')">Apagar</button>
        </div>
      `
        )
        .join("");
    })
    .catch((err) => console.error(err));
}

function editarNoticia(docId) {
  db.collection("noticias")
    .doc(docId)
    .get()
    .then((doc) => {
      if (!doc.exists) return alert("Notícia não encontrada");
      const n = doc.data();
      document.getElementById("titulo").value = n.titulo;
      document.getElementById("editor").innerHTML = n.conteudo;
      document.getElementById("imagem").value = n.imagem;
      document.getElementById("categoria").value = n.categoria;
      document.getElementById("docId").value = docId;
    });
}

function apagarNoticia(docId) {
  if (!confirm("Tem certeza que deseja apagar esta notícia?")) return;
  db.collection("noticias")
    .doc(docId)
    .delete()
    .then(() => mostrarNoticiasAdmin())
    .catch((err) => console.error(err));
}

/* ================= PÚBLICO =================== */
function mostrarNoticias(filtro = "", pesquisa = "") {
  const destaque = document.getElementById("noticiaDestaque");
  const container = document.getElementById("noticias");

  container.innerHTML = "<p>Carregando notícias...</p>";
  destaque.innerHTML = "";

  db.collection("noticias")
    .orderBy("data", "desc")
    .get()
    .then((snapshot) => {
      let noticias = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dataFormatada: doc.data().data?.toDate().toLocaleString() || "",
      }));

      if (filtro) noticias = noticias.filter((n) => n.categoria === filtro);
      if (pesquisa) {
        const termo = pesquisa.toLowerCase();
        noticias = noticias.filter(
          (n) =>
            n.titulo.toLowerCase().includes(termo) ||
            n.conteudo.toLowerCase().includes(termo)
        );
      }

      if (noticias.length === 0) {
        container.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
        return;
      }

      // Destaque
      const n = noticias[0];
      destaque.innerHTML = `
        <div class="card-destaque" onclick="abrirNoticia('${n.id}')">
          <img src="${n.imagem}" alt="${n.titulo}">
          <div class="conteudo-destaque">
            <p class="categoria">${n.categoria} | <em>${
        n.dataFormatada
      }</em></p>
            <h2>${n.titulo}</h2>
            <div>${n.conteudo.substring(0, 250)}...</div>
          </div>
        </div>
      `;

      // Outras notícias
      const outrasNoticias = noticias.slice(1);
      container.innerHTML = outrasNoticias
        .map(
          (n) => `
        <div class="noticia-card" onclick="abrirNoticia('${n.id}')">
          <img src="${n.imagem}" alt="${n.titulo}">
          <div class="conteudo-noticia">
            <p class="categoria">${n.categoria} | <em>${
            n.dataFormatada
          }</em></p>
            <h3>${n.titulo}</h3>
            <div>${n.conteudo.substring(0, 100)}...</div>
          </div>
        </div>
      `
        )
        .join("");
    })
    .catch((err) => console.error(err));
}

// Abrir notícia completa
function abrirNoticia(docId) {
  db.collection("noticias")
    .doc(docId)
    .get()
    .then((doc) => {
      if (!doc.exists) return alert("Notícia não encontrada");
      const n = doc.data();
      const container = document.getElementById("noticias");
      const destaque = document.getElementById("noticiaDestaque");
      container.style.display = "none";
      destaque.style.display = "none";

      const divAntiga = document.querySelector(".noticia-completa");
      if (divAntiga) divAntiga.remove();

      const divCompleta = document.createElement("div");
      divCompleta.classList.add("noticia-completa");
      divCompleta.innerHTML = `
        <button onclick="location.reload()">← Voltar</button>
        <h2>${n.titulo}</h2>
        <p><strong>Categoria:</strong> ${n.categoria}</p>
        <img src="${n.imagem}" alt="${n.titulo}">
        <div>${n.conteudo}</div>
      `;
      document.body.appendChild(divCompleta);
    });
}

// Filtrar notícias
function filtrarNoticias(categoria = "") {
  const pesquisa = document.getElementById("pesquisa").value;
  mostrarNoticias(categoria, pesquisa);

  const botoes = document.querySelectorAll(".menu-categorias button");
  botoes.forEach((btn) => {
    if (
      btn.textContent === categoria ||
      (categoria === "" && btn.textContent === "Todas")
    ) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Pesquisar com Enter
document.getElementById("pesquisa").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    filtrarNoticias();
  }
});
