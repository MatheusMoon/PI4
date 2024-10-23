let currentIndex = 0;
let playlistItems = [];

function startPlayback(items) {
    playlistItems = items;
    currentIndex = 0;
    playCurrentItem();
}

function playCurrentItem() {
    if (currentIndex >= playlistItems.length) {
        return; // Fim da playlist
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

function playVideo(videoId) {
    const videoPlayer = document.getElementById('video-player');
    videoPlayer.src = `/videos/${videoId}`;
    videoPlayer.play();
    
    videoPlayer.onended = () => {
        currentIndex++;
        playCurrentItem();
    };
}

function showImage(imageId) {
    const imagePlayer = document.getElementById('image-player');
    imagePlayer.src = `/images/${imageId}`;
    imagePlayer.style.display = 'block';

    imagePlayer.onload = () => {
        setTimeout(() => {
            imagePlayer.style.display = 'none';
            currentIndex++;
            playCurrentItem();
        }, 5000); // Exibe a imagem por 5 segundos
    };
}

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
            }, 5000); // Exibe o texto por 5 segundos
        });
}

document.getElementById('next-button').onclick = () => {
    currentIndex++;
    playCurrentItem();
};

// Função para receber a playlist (chame-a a partir do popup)
function receivePlaylist(items) {
    startPlayback(items);
}
