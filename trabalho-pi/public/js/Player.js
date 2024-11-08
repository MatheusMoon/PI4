// Classe e função para carregar itens da playlist
class PlaylistItem {
    constructor(type, id, duration) {
        this.type = type;
        this.id = id;
        this.duration = duration;
        this.data = null; // Inicialmente sem dados carregados
    }
}

let lstArquivos = []; // Lista que armazenará os itens carregados da playlist
const CACHE_NAME = 'ArquivosPlayList'; // Nome do cache
let pAtual = 0; // Índice atual para o item a ser exibido
let intervalos = 0; // Controle do intervalo de exibição

async function fetchPlaylistData(playlistId) {
    try {
        const response = await fetch(`/api/playlists/${playlistId}`);
        const { unicode } = await response.json();

        // Parse do JSON e conversão para objetos PlaylistItem
        const playlistItems = JSON.parse(unicode);
        lstArquivos = await Promise.all(playlistItems.map(loadPlaylistItem));

        // Inicia a exibição dos arquivos
        mostrarArquivo();
    } catch (error) {
        console.error("Erro ao carregar a playlist:", error);
    }
}

async function loadPlaylistItem(item) {
    const { type, id, duration } = item;
    const link = getLink(type, id);
    let data = null;

    if (type === 'image' || type === 'video') {
        const response = await fetch(link);
        const blob = await response.blob();
        data = URL.createObjectURL(blob);
    } else if (type === 'text') {
        const response = await fetch(link);
        const textData = await response.json();
        data = {
            content: textData.content,
            backgroundImageUrl: textData.backgroundImageUrl
        };
    }

    return { type, data, duration };
}

function getLink(type, id) {
    switch (type) {
        case 'image': return `/images/${id}`;
        case 'video': return `/videos/${id}`;
        case 'text': return `/text/${id}`;
        default: return null;
    }
}

function mostrarArquivo() {
    pararTempo();

    const arq = lstArquivos[pAtual];
    const canvas = document.querySelector("#canvas");

    if (arq.type === 'image') {
        canvas.innerHTML = `<img src="${arq.data}" alt="Imagem">`;
        iniciarTempo(arq.duration);
    } else if (arq.type === 'video') {
        canvas.innerHTML = `<video onended="mostrarArquivo()" src="${arq.data}" autoplay muted></video>`;
    } else if (arq.type === 'text') {
        const { content, backgroundImageUrl } = arq.data;
        const contentHtml = backgroundImageUrl
            ? `<div style="background-image: url('${backgroundImageUrl}'); background-size: cover; height: 100%; color: #fff; padding: 20px;">${content}</div>`
            : `<div style="padding: 20px;">${content}</div>`;

        canvas.innerHTML = contentHtml;
        iniciarTempo(arq.duration);
    }

    pAtual = (pAtual + 1) % lstArquivos.length;
}

function iniciarTempo(duration) {
    intervalos = setInterval(mostrarArquivo, duration * 1000);
}

function pararTempo() {
    clearInterval(intervalos);
}

function carregarLista() {
    const playlistId = prompt("Digite o ID da playlist:");
    if (playlistId) {
        document.getElementById("butCarregar").remove();
        fetchPlaylistData(playlistId);
    }
}
