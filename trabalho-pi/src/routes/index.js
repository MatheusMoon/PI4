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

        const imageBuffer = req.file.buffer;
        const uploadDate = new Date();

        const connection = await connectToDatabase();
        const [result] = await connection.execute(
            'INSERT INTO images (content, uploadDate) VALUES (?, ?)',
            [imageBuffer, uploadDate]
        );

        res.status(200).json({
            success: true,
            file: { url: `/images/${result.insertId}` }
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
        const { filename, mimetype, size } = req.file;
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
        const uploadDate = new Date();

        const [result] = await connection.execute(
            'INSERT INTO textos (content, has-background, image_id) VALUES (?, ?, ?)',
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
// Rota para buscar imagem pelo ID
router.get('/images/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute('SELECT content FROM images WHERE id = ?', [id]);

        if (rows.length === 0) {
            await connection.end(); // Certificar que a conexão é fechada ao retornar
            return res.status(404).json({ message: 'Imagem não encontrada' });
        }

        const image = rows[0].content;

        // Definir o cabeçalho de Content-Type conforme o tipo da imagem
        res.set('Content-Type', 'image/jpeg');  // Ou 'image/png', se for o caso

        await connection.end(); // Encerrar conexão antes de enviar a resposta
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
        
        // Recuperar o vídeo do banco de dados pelo ID
        const [rows] = await connection.execute('SELECT content FROM videos WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            await connection.end(); // Certificar que a conexão é fechada ao retornar
            return res.status(404).json({ message: 'Vídeo não encontrado' });
        }

        const video = rows[0].content;
        
        // Definir o cabeçalho correto para enviar o binário do vídeo
        res.setHeader('Content-Type', 'video/mp4'); // Ajuste conforme necessário
        
        await connection.end(); // Encerrar conexão antes de enviar a resposta
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

        const uploads = rows.map(upload => {
            // Gerar um token para cada upload
            const token = `${upload.type}-${upload.id}`;
            
            return {
                id: upload.id,
                type: upload.type,
                token: token,  // Token gerado
                src: `/${upload.type}s/${upload.id}`,  // URL de exibição do item ajustado
            };
        });

        // Enviar os uploads com o token gerado
        res.json({ recentUploads: uploads });
    } catch (error) {
        console.error('Erro ao carregar uploads recentes:', error);
        res.status(500).json({ message: 'Erro ao buscar uploads recentes' });
    }
});

// Rota para criar ou atualizar uma playlist e salvar os itens no formato JSON
router.post('/create-playlist', async (req, res) => {
    const { id, name, items } = req.body;

    if (!name || !items || items.length === 0) {
        return res.status(400).json({ message: 'Nome da playlist e itens são obrigatórios' });
    }

    try {
        const connection = await connectToDatabase();
        const updatedAt = new Date();
        let playlistId = id;

        if (id) {
            // Atualizar playlist existente
            const [rows] = await connection.execute('SELECT * FROM playlists WHERE id = ?', [id]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Playlist não encontrada' });
            }

            await connection.execute(
                'UPDATE playlists SET name = ?, updatedAt = ? WHERE id = ?',
                [name, updatedAt, id]
            );
        } else {
            // Criar nova playlist
            const createdAt = new Date();
            const [result] = await connection.execute(
                'INSERT INTO playlists (name, createdAt, updatedAt) VALUES (?, ?, ?)',
                [name, createdAt, updatedAt]
            );
            playlistId = result.insertId;
        }

        // Montar o JSON para salvar na tabela "playlist"
        const playlistJSON = items.map((item, index) => ({
            order: index + 1,  // Ordem dos itens
            type: item.type,    // Tipo do item: 'image', 'video', 'text'
            contentId: item.contentId,  // O ID do conteúdo (ID da imagem, vídeo, ou texto)
            duration: item.duration     // Tempo que o item ficará na tela (em segundos)
        }));

        // Salvar o JSON na coluna da tabela 'playlist'
        await connection.execute(
            'UPDATE playlists SET content = ? WHERE id = ?',
            [JSON.stringify(playlistJSON), playlistId]
        );

        return res.status(200).json({ success: true, message: 'Playlist e itens salvos com sucesso!', playlistId });
    } catch (error) {
        console.error('Erro ao salvar a playlist e itens:', error);
        res.status(500).json({ message: 'Erro ao salvar a playlist e itens' });
    }
});

// Exporta o router como default
export default router;
