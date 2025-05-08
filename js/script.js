// /fcap/js/script.js
document.addEventListener("DOMContentLoaded", () => {
  fetch(`db/buttons.json?nocache=${Date.now()}`)
      .then((response) => response.json())
      .then((data) => {
        const container = document.getElementById("button-container");
        if (!container || !data.buttons) return;
  
        data.buttons.forEach((button) => {
          const wrapper = document.createElement("div");
          wrapper.className = "btn-wrapper";
  
          wrapper.innerHTML = `
            <a href="${button.url}" class="btn" target="_blank" rel="noopener noreferrer">
              <img src="${button.icon}" class="btn-icon" alt="Ícone">
              <span class="btn-text">${button.title}</span>
            </a>
            <div class="btn-description">${button.description || ""}</div>
          `;
  
          container.appendChild(wrapper);
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar botões:", err);
      });
  });
  