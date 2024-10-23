import express from 'express';
import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import connectToDatabase from '../../db.js';

const router = Router();
const __dirname = path.resolve();

// Configuração do multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 'tinymce'
router.use('/tinymce', express.static(path.join(__dirname, 'tinymce')));

// Rota para a Landing Page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/src/views/Landing-Page.html'));
});

// Rota para a Manage
router.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, '/src/views/Manager.html'));
});

router.get('/playlists', (req, res) => {
    res.sendFile(path.join(__dirname, '/src/views/Choose-Playlists.html'));
});

// Rota para criar Playlists
router.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '/src/views/Create-Playlists.html'));
});

// Rota para upload de imagem
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado' });
        }

        const imageBuffer = req.file.buffer; // Obtendo o conteúdo da imagem
        const uploadDate = new Date(); // Data de upload

        const connection = await connectToDatabase();
        const [result] = await connection.execute(
            'INSERT INTO images (content, uploadDate) VALUES (?, ?)',
            [imageBuffer, uploadDate]
        );

        const imageUrl = `/images/${result.insertId}`; // URL da imagem

        res.status(200).json({
            success: true,
            file: {
                url: imageUrl,
                id: result.insertId
            }
        });
    } catch (err) {
        console.error('Erro ao salvar imagem:', err);
        res.status(500).json({ message: 'Erro ao salvar a imagem' });
    }
};

router.post('/upload-image', upload.single('image'), uploadImage);

// Rota para upload de vídeo
router.post('/upload-video', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum vídeo enviado' });
    }

    const { duration } = req.body; // Duração do vídeo enviada no FormData
    try {
        const content = req.file.buffer; // O conteúdo do arquivo em formato binário

        const connection = await connectToDatabase();
        const [result] = await connection.execute(
            'INSERT INTO videos (content, length, uploadDate) VALUES (?, ?, NOW())',
            [content, duration]
        );

        res.status(200).json({
            success: true,
            file: { id: result.insertId, url: `/videos/${result.insertId}` }
        });
    } catch (error) {
        console.error('Erro ao salvar vídeo no banco:', error);
        res.status(500).json({ message: 'Erro ao salvar vídeo.' });
    }
});

// Rota para upload de texto
router.post('/upload-text', async (req, res) => {
    const { content, imageId } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Conteúdo do texto não fornecido' });
    }

    try {
        const connection = await connectToDatabase();
        const [result] = await connection.execute(
            'INSERT INTO textos (content, has_background, image_id) VALUES (?, ?, ?)',
            [content, 1, imageId || null]
        );

        res.status(200).json({
            success: true,
            file: { id: result.insertId, url: `/text/${result.insertId}` }
        });
    } catch (error) {
        console.error('Erro ao salvar texto:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar texto' });
    }
});

// Rota para buscar imagem pelo ID
router.get('/images/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute('SELECT content FROM images WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Imagem não encontrada' });
        }

        const image = rows[0].content;

        res.set('Content-Type', 'image/jpeg'); // Ou 'image/png', se for o caso
        res.send(image);
        
    } catch (error) {
        console.error('Erro ao buscar imagem:', error);
        res.status(500).json({ message: 'Erro ao buscar a imagem' });
    }
});

// Rota para buscar vídeo pelo ID
router.get('/videos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute('SELECT content FROM videos WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Vídeo não encontrado' });
        }

        const video = rows[0].content;
        
        res.setHeader('Content-Type', 'video/mp4'); // Ajuste conforme necessário
        res.send(video);
        
    } catch (error) {
        console.error('Erro ao recuperar o vídeo:', error);
        res.status(500).json({ message: 'Erro ao carregar o vídeo' });
    }
});

// Rota para buscar uploads recentes
router.get('/recent-uploads', async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute(`
            SELECT id, 'image' AS type, uploadDate FROM images
            UNION
            SELECT id, 'video' AS type, uploadDate FROM videos
            ORDER BY uploadDate DESC
            LIMIT 20
        `);

        const uploads = rows.map(upload => ({
            id: upload.id,
            type: upload.type,
            token: `${upload.type}-${upload.id}`,
            src: `/${upload.type}s/${upload.id}`,
        }));

        res.json({ recentUploads: uploads });
    } catch (error) {
        console.error('Erro ao carregar uploads recentes:', error);
        res.status(500).json({ message: 'Erro ao buscar uploads recentes' });
    }
});

// Rota para buscar texto pelo ID
router.get('/text/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await connectToDatabase();
        const [textRows] = await connection.execute('SELECT content, image_id FROM textos WHERE id = ?', [id]);

        if (textRows.length === 0) {
            return res.status(404).json({ message: 'Texto não encontrado' });
        }

        const text = textRows[0];

        // Caso exista uma imagem de fundo associada
        let backgroundImageUrl = null;
        if (text.image_id) {
            const [imageRows] = await connection.execute('SELECT content FROM images WHERE id = ?', [text.image_id]);
            if (imageRows.length > 0) {
                backgroundImageUrl = `/images/${text.image_id}`;
            }
        }

        res.status(200).json({
            content: text.content,
            backgroundImageUrl: backgroundImageUrl
        });
    } catch (error) {
        console.error('Erro ao buscar texto:', error);
        res.status(500).json({ message: 'Erro ao buscar o texto' });
    }
});


// Rota para buscar uma playlist específica
router.get('/playlists/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await connectToDatabase();
        
        // Buscar a playlist pelo ID
        const [playlistRows] = await connection.execute('SELECT * FROM playlists WHERE id = ?', [id]);
        if (playlistRows.length === 0) {
            return res.status(404).json({ message: 'Playlist não encontrada' });
        }

        const playlist = playlistRows[0];

        // Buscar os itens da playlist (assumindo uma tabela de itens)
        const [itemsRows] = await connection.execute('SELECT * FROM playlist_items WHERE playlist_id = ?', [id]);
        const items = itemsRows.map(item => ({
            type: item.type,   // Tipo do item (imagem, vídeo, texto)
            id: item.id,       // ID do item
            time: item.duration // Duração do item (se aplicável)
        }));

        res.json({
            id: playlist.id,
            name: playlist.name,
            coverId: playlist.cover_id,
            items: items
        });
    } catch (error) {
        console.error('Erro ao buscar a playlist:', error);
        res.status(500).json({ message: 'Erro ao buscar a playlist' });
    }
});


// Rota para salvar a playlist
router.post('/save-playlist', async (req, res) => {
    console.log('Dados recebidos:', req.body); // Log dos dados recebidos

    const { name, unicode, coverId } = req.body;

    // Validações
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Nome da playlist é obrigatório!' });
    }

    if (!Array.isArray(unicode)) {
        return res.status(400).json({ success: false, message: 'Os itens da playlist são obrigatórios!' });
    }

    if (!coverId) {
        return res.status(400).json({ success: false, message: 'Por favor, selecione uma capa para a playlist.' });
    }

    const connection = await connectToDatabase(); // Estabelecendo conexão com o banco
    const query = `
        INSERT INTO playlists (name, unicode, cover_id) 
        VALUES (?, ?, ?)
    `;

    // O unicode deve ser convertido para JSON antes de ser salvo
    try {
        const [result] = await connection.execute(query, [name, JSON.stringify(unicode), coverId]);
        res.status(201).json({ success: true, message: 'Playlist salva com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar a playlist:', error); // Log do erro
        res.status(500).json({ success: false, message: 'Erro ao salvar a playlist' });
    }
});

export default router;
