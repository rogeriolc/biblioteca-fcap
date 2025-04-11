if (sessionStorage.getItem("auth") !== "ok") {
    window.location.href = "login.html";
  }
  
  let botoes = [];
  
  document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("listaBotoes");
    const salvar = document.getElementById("botaoSalvar");
    const exportar = document.getElementById("exportar");
    const publicar = document.getElementById("publicar");
  
    fetch("../db/buttons.json")
      .then((res) => res.json())
      .then((data) => {
        botoes = data.buttons.sort((a, b) => a.order - b.order);
        renderizarLista();
      })
      .catch(() => {
        alert("Erro ao carregar buttons.json");
      });
  
    function renderizarLista() {
      lista.innerHTML = "";
      botoes.forEach((btn) => {
        const li = document.createElement("li");
        li.setAttribute("data-id", btn.id);
        li.innerHTML = `<strong>${btn.order} - ${btn.title}</strong><br><small>${btn.description}</small>`;
        lista.appendChild(li);
      });
  
      Sortable.create(lista, {
        animation: 150,
      });
    }
  
    salvar.addEventListener("click", () => {
      const items = [...lista.querySelectorAll("li")];
      items.forEach((li, index) => {
        const id = parseInt(li.getAttribute("data-id"));
        const botao = botoes.find((b) => b.id === id);
        if (botao) botao.order = index + 1;
      });
      alert("Ordem atualizada (não salva ainda no GitHub).");
      renderizarLista();
    });
  
    exportar.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify({ buttons: botoes }, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "buttons.json";
      a.click();
    });
  
    publicar.addEventListener("click", async () => {
      const repo = prompt("Digite o nome do repositório (ex: rogeriolc/biblioteca-fcap):");
      const token = prompt("Cole seu token GitHub para este repositório:");
  
      if (!repo || !token) {
        alert("Repositório ou token inválido.");
        return;
      }
  
      const apiUrl = `https://api.github.com/repos/${repo}/contents/db/buttons.json`;
  
      try {
        const getRes = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        });
  
        const fileData = await getRes.json();
  
        const updateRes = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            message: "Atualização de ordem dos botões via painel admin",
            content: btoa(unescape(encodeURIComponent(JSON.stringify({ buttons: botoes }, null, 2)))),
            sha: fileData.sha,
          }),
        });
  
        if (updateRes.ok) {
          alert("Atualizado com sucesso no GitHub!");
        } else {
          const err = await updateRes.json();
          alert("Erro ao publicar: " + (err.message || "Desconhecido"));
        }
      } catch (err) {
        alert("Falha ao conectar com o GitHub.");
      }
    });
  });
  