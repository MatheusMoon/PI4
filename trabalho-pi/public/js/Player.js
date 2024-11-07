let currentIndex = 0;
let playlistItems = [];

// Função que busca a playlist pelo ID e inicia a reprodução
function fetchAndPlayPlaylist(playlistId) {
    fetch(`/playlists/${playlistId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar a playlist');
            }
            return response.json();
        })
        .then(data => {
            receivePlaylist(data.items);
        })
        .catch(error => {
            console.error('Error fetching playlist:', error);
        });
}

// Função que inicia a reprodução da lista de itens
function startPlayback(items) {
    playlistItems = items;
    currentIndex = 0;
    document.getElementById('full-screen-player').style.display = 'flex';
    playCurrentItem();
}

// Função que reproduz o item atual da lista
function playCurrentItem() {
    if (currentIndex >= playlistItems.length) {
        document.getElementById('full-screen-player').style.display = 'none';
        return;
    }

    const item = playlistItems[currentIndex];
    if (item.type === 'video') {
        playVideo(item.id);
    } else if (item.type === 'image') {
        showImage(item.id);
    } else if (item.type === 'text') {
        showText(item.id);
    }
}

// Função que reproduz um vídeo pelo ID fornecido
function playVideo(videoId) {
    const videoPlayer = document.getElementById('video-player');
    videoPlayer.src = `/videos/${videoId}`;
    videoPlayer.style.display = 'block';
    videoPlayer.play();

    videoPlayer.onended = () => {
        currentIndex++;
        playCurrentItem();
    };
}

// Função que exibe uma imagem pelo ID fornecido
function showImage(imageId) {
    const imagePlayer = document.getElementById('image-player');
    imagePlayer.src = `/images/${imageId}`;
    imagePlayer.style.display = 'block';

    imagePlayer.onload = () => {
        setTimeout(() => {
            imagePlayer.style.display = 'none';
            currentIndex++;
            playCurrentItem();
        }, 5000);
    };
}

// Função que exibe um texto pelo ID fornecido
function showText(textId) {
    fetch(`/text/${textId}`)
        .then(response => response.json())
        .then(data => {
            const textPlayer = document.getElementById('text-player');
            textPlayer.innerText = data.content;
            textPlayer.style.display = 'block';

            setTimeout(() => {
                textPlayer.style.display = 'none';
                currentIndex++;
                playCurrentItem();
            }, 5000);
        });
}

// Função que recebe a lista de itens e inicia a reprodução
function receivePlaylist(items) {
    startPlayback(items);
}

// Chame esta função com o ID da playlist quando a página do player carregar
const playlistId = 'your_playlist_id_here'; // Substitua pela recuperação dinâmica do ID
fetchAndPlayPlaylist(playlistId);
