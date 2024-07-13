const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { connection1, connection2 } = require('./public/chat/js/db.js');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

app.use(bodyParser.json());

const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Rota para enviar mensagens
app.post('/messages1', (req, res) => {
    const { user, message, privateChatWith } = req.body;
    const email = req.session.user.email;

    const query = 'INSERT INTO messages (user, id_user, message, privateChatWith) VALUES (?, ?, ?, ?)';
    connection1.query(query, [user, email, message, privateChatWith], (err, results) => {
        if (err) {
            console.error('Erro ao inserir mensagem no banco de dados:', err);
            res.status(500).send('Erro ao inserir mensagem');
            return;
        }
        const insertedMessage = { user, message, privateChatWith };
        io.emit('chatMessage', insertedMessage);
        res.status(201).send('Mensagem inserida com sucesso');
    });
});

// Rota para buscar mensagens globais ou privadas
app.get('/messages1', (req, res) => {
    const privateChatWith = req.query.privateChatWith;
    const currentUserEmail = req.session.user.email;

    let query;
    let queryParams;

    if (privateChatWith) {
        query = 'SELECT * FROM messages WHERE (id_user = ? AND privateChatWith = ?) OR (id_user = ? AND privateChatWith = ?) ORDER BY timestamp DESC';
        queryParams = [currentUserEmail, privateChatWith, privateChatWith, currentUserEmail];
    } else {
        query = 'SELECT * FROM messages WHERE privateChatWith IS NULL ORDER BY timestamp DESC';
        queryParams = [];
    }

    connection1.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erro ao buscar mensagens do banco de dados:', err);
            res.status(500).send('Erro ao buscar mensagens');
            return;
        }
        res.json(results);
    });
});

// Rota para buscar usuários disponíveis
app.get('/users', (req, res) => {
    const currentUserEmail = req.session.user.email;

    const query = 'SELECT email_user FROM users WHERE email_user != ?';
    connection1.query(query, [currentUserEmail], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
            return;
        }
        res.json(results);
    });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

fs.readdirSync(path.join(__dirname, 'routes')).forEach((file) => {
    const route = require(`./routes/${file}`);
    app.use('/', route);
});

app.use((req, res) => {
    res.status(404).redirect('/not-found/front-end/html/notfound.html');
});

server.listen(port, () => {
    console.log(`Servidor Node.js escutando na porta ${port}`);
});

io.on('connection', (socket) => {
    console.log('Novo cliente conectado');

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});
