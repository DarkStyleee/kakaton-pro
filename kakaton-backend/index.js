const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const GameManager = require('./gameManager');
const { PORT } = require('./constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
    console.log(`Пользователь подключен: ${socket.id}`);

    socket.on('createRoom', ({ roomId, userName }) => {
        gameManager.createRoom(roomId, userName, socket);
    });

    socket.on('joinRoom', ({ roomId, userName }) => {
        gameManager.joinRoom(roomId, userName, socket);
    });

    socket.on('submitCode', ({ roomId, code }) => {
        gameManager.handleSubmitCode(roomId, socket, code);
    });

    socket.on('disconnect', () => {
        console.log(`Пользователь отключен: ${socket.id}`);
        gameManager.handlePlayerDisconnect(socket);
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
