document.addEventListener("DOMContentLoaded", () => {
    let offset = 0;
    const limit = 9;
  
    const playlistsGrid = document.getElementById("playlists-grid");
    const loadMoreButton = document.getElementById("load-more");
  
    // Função para buscar playlists do backend
    async function fetchPlaylists(offset, limit) {
      try {
        const response = await fetch(`/api/playlists?offset=${offset}&limit=${limit}`);
        const data = await response.json();
        return data.playlists;
      } catch (error) {
        console.error("Erro ao buscar playlists:", error);
        return [];
      }
    }
  
    // Função para renderizar playlists no grid
    function renderPlaylists(playlists) {
      playlists.forEach(playlist => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <img src="/api/images/${playlist.coverId}" alt="Capa da Playlist">
          <div class="card-title">${playlist.name}</div>
        `;
        card.addEventListener("click", () => selectPlaylist(card, playlist.id));
        playlistsGrid.appendChild(card);
      });
    }
  
    // Carregar mais playlists e atualizar o grid
    async function loadPlaylists() {
      const playlists = await fetchPlaylists(offset, limit);
      if (playlists.length) {
        renderPlaylists(playlists);
        offset += limit;
      }
      if (playlists.length < limit) loadMoreButton.style.display = "none";
    }
  
    // Seleciona uma playlist e exibe o ícone de edição
    function selectPlaylist(card, id) {
      document.querySelector(".card.selected")?.classList.remove("selected");
      card.classList.add("selected");
      loadPlaylistInEditor(id);
    }
  
    // Carrega a playlist selecionada no editor
    function loadPlaylistInEditor(id) {
      console.log(`Playlist ${id} selecionada para edição.`);
      // Lógica para carregar a playlist no editor
    }
  
    loadMoreButton.addEventListener("click", loadPlaylists);
    loadPlaylists();
  });
  