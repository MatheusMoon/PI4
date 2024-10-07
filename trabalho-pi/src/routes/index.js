import express from 'express';
import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import connectToDatabase from '../../db.js';

const router = Router();
const __dirname = path.resolve();

// Configuração do multer para armazenar arquivos na memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve os arquivos estáticos da pasta 'tinymce' (ajuste o caminho conforme sua pasta real)
router.use('/tinymce', express.static(path.join(__dirname, 'tinymce')));
//router.get('/recent-uploads', getRecentUploads); 

// Rota para a Landing Page
router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/src/views/Landing-Page.html'));
});

// Rota para as Playlists
router.get('/playlists', (req, res) => {
	res.sendFile(path.join(__dirname, '/src/views/Choose-Playlists.html'));
});

// Rota para a Manage
router.get('/manage', (req, res) => {
	res.sendFile(path.join(__dirname, '/src/views/Manager.html'));
});

// Rota para criar Playlists
router.get('/create', (req, res) => {
	res.sendFile(path.join(__dirname, '/src/views/Create-Playlists.html'));
});

// Rota para editar Playlists
router.get('/edit', (req, res) => {
	res.sendFile(path.join(__dirname, '/src/views/Edit-Playlists.html'));
});

// Rota para upload de imagem
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const imageBuffer = req.file.buffer;
        const uploadDate = new Date();

        const connection = await connectToDatabase();
        const [result] = await connection.execute(
            'INSERT INTO images (content, uploadDate) VALUES (?, ?)',
            [imageBuffer, uploadDate]
        );

        res.status(200).json({ success: true, file: { url: `/images/${result.insertId}` } });
    } catch (err) {
        console.error('Erro ao salvar imagem:', err);
        res.status(500).send('Erro ao salvar a imagem');
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

		res.json({ success: 1, message: 'Vídeo salvo com sucesso!', id: result.insertId });
	} catch (error) {
		console.error('Erro ao salvar vídeo no banco:', error);
		res.status(500).json({ message: 'Erro ao salvar vídeo.' });
	}
});

// Rota para upload de texto
router.post('/upload-text', async (req, res) => {
	const { content, width, height, imageId } = req.body;

	if (!content) {
		return res.status(400).json({ message: 'Conteúdo do texto não fornecido' });
	}

	try {
		const connection = await connectToDatabase();
		const uploadDate = new Date();  // Data de upload

		const [result] = await connection.execute(
			'INSERT INTO text (content, width, height, has-background, image_id) VALUES (?, ?, ?, ?, ?)',
			[content, width, height, 1, imageId || null]
		);

		res.json({ success: true, message: 'Texto salvo com sucesso!', id: result.insertId });
	} catch (error) {
		console.error('Erro ao salvar texto:', error);
		res.status(500).json({ success: false, message: 'Erro ao salvar texto' });
	}
});

// Rota para buscar arquivos por URL
router.post('/fetchUrl', (req, res) => {
	const { url } = req.body;

	if (!url) {
		return res.status(400).json({ message: 'URL não fornecida' });
	}

	res.json({ success: 1, file: { url } });
});

// Rota para salvar a playlist
router.post('/save-playlist', (req, res) => {
	const { playlist } = req.body;

	// Lógica para salvar a playlist no banco de dados
	res.json({ message: 'Playlist salva com sucesso!' });
});

// Rota para buscar imagem pelo ID
router.get('/images/:id', async (req, res) => {
  try {
      const { id } = req.params;
      console.log('ID recebido:', id);
      const connection = await connectToDatabase();
      const [rows] = await connection.execute('SELECT content FROM images WHERE id = ?', [id]);
      console.log('Resultados da consulta:', rows);

      if (rows.length === 0) {
          return res.status(404).send('Imagem não encontrada');
      }

      const image = rows[0].content;

      // Defina o Content-Type correto
      res.set('Content-Type', 'image/jpeg'); // Ou 'image/png', conforme o tipo da imagem
      res.send(image);
  } catch (error) {
      console.error('Erro ao buscar imagem:', error);
      res.status(500).send('Erro ao buscar a imagem');
  }
});


// Rota para retornar todas as playlists
router.get('/all-playlists', async (req, res) => {
  try {
      const connection = await connectToDatabase(); // Conectar ao banco de dados
      const [rows] = await connection.execute('SELECT * FROM playlists'); // Consulta para pegar todas as playlists

      if (rows.length === 0) {
          return res.status(404).json({ message: 'Nenhuma playlist encontrada' }); // Resposta caso não tenha playlists
      }

      // Resposta com as playlists
      res.status(200).json({ playlists: rows });
  } catch (error) {
      console.error('Erro ao buscar playlists:', error);
      res.status(500).json({ message: 'Erro ao buscar playlists' }); // Resposta de erro
  }
});

router.get('/recent-uploads', async (req, res) => {
  try {
      const connection = await connectToDatabase();
      const [images] = await connection.execute('SELECT * FROM images ORDER BY uploadDate DESC LIMIT 10'); // Pega as últimas 10 imagens

      const [videos] = await connection.execute('SELECT * FROM videos ORDER BY uploadDate DESC LIMIT 10'); // Pega os últimos 10 vídeos

      res.status(200).json({ images, videos });
  } catch (error) {
      console.error('Erro ao buscar uploads recentes:', error);
      res.status(500).json({ message: 'Erro ao buscar uploads recentes' });
  }
});


// Rota para criar ou atualizar uma playlist e salvar os itens
router.post('/create-playlist', async (req, res) => {
	const { id, name, items } = req.body;

	if (!name) {
		return res.status(400).json({ message: 'Nome da playlist não fornecido' });
	}

	try {
		const connection = await connectToDatabase();
		const updatedAt = new Date();
		let playlistId = id;

		if (id) {
			// Atualizar playlist existente (sem o campo content)
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

		// Agora salvar os itens da playlist na tabela "items"
		if (items && items.length > 0) {
			// Primeiro, remover todos os itens antigos (se houver)
			await connection.execute('DELETE FROM items WHERE PlaylistId = ?', [playlistId]);

			// Inserir os novos itens
			for (const item of items) {
				const type = item.type || null;
				const content = item.content || null;
				const duration = item.duration || 0;

				if (!type || !content) {
					return res.status(400).json({ message: 'Cada item precisa de um tipo e conteúdo válidos' });
				}

				await connection.execute(
					'INSERT INTO items (type, content, duration, createdAt, updatedAt, PlaylistId) VALUES (?, ?, ?, ?, ?, ?)',
					[type, content, duration, new Date(), new Date(), playlistId]
				);
			}
		}

		return res.status(200).json({ success: true, message: 'Playlist e itens salvos com sucesso!', playlistId });
	} catch (error) {
		console.error('Erro ao salvar a playlist e itens:', error);
		res.status(500).json({ message: 'Erro ao salvar a playlist e itens' });
	}
});

// Rota para obter uma playlist pelo ID com seus itens
router.get('/playlist/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const connection = await connectToDatabase();

		// Primeiro, busca a playlist pelo ID
		const [playlistRows] = await connection.execute('SELECT * FROM playlists WHERE id = ?', [id]);

		if (playlistRows.length === 0) {
			return res.status(404).json({ message: 'Playlist não encontrada' });
		}

		const playlist = playlistRows[0];

		// Em seguida, busca todos os itens relacionados a essa playlist
		const [itemsRows] = await connection.execute('SELECT * FROM items WHERE PlaylistId = ?', [id]);

		console.log(id, itemsRows)

		// Retorna a playlist com seus itens
		res.status(200).json({
			playlist: {
				...playlist,
				items: itemsRows // Inclui os itens da playlist
			}
		});
	} catch (error) {
		console.error('Erro ao buscar a playlist:', error);
		res.status(500).json({ message: 'Erro ao buscar a playlist' });
	}
});

export default router;
