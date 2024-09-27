const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

const PORT = process.env.PORT || 3000

// Хранилище пользователей и игр
let users = {}
let games = {}

// Обработка соединений Socket.IO
io.on('connection', (socket) => {
  console.log(`Пользователь подключен: ${socket.id}`)

  // Регистрация пользователя
  socket.on('register', (username) => {
    users[socket.id] = { username, gameId: null }
    io.emit('users', Object.values(users))
  })

  // Создание игры
  socket.on('createGame', () => {
    const gameId = `game_${Date.now()}`
    games[gameId] = { players: [socket.id], status: 'waiting' }
    users[socket.id].gameId = gameId
    socket.join(gameId)
    socket.emit('gameCreated', gameId)
    io.emit('games', Object.keys(games))
  })

  // Присоединение к игре
  socket.on('joinGame', (gameId) => {
    if (games[gameId] && games[gameId].players.length < 2) {
      games[gameId].players.push(socket.id)
      users[socket.id].gameId = gameId
      socket.join(gameId)
      io.to(gameId).emit('startGame', { players: games[gameId].players })
      games[gameId].status = 'started'
      io.emit('games', Object.keys(games))
    } else {
      socket.emit('error', 'Игра не найдена или уже полна.')
    }
  })

  // Обработка сообщений в игре
  socket.on('gameMessage', (msg) => {
    const gameId = users[socket.id].gameId
    if (gameId) {
      io.to(gameId).emit('gameMessage', { user: users[socket.id].username, text: msg })
    }
  })

  // Обработка отключения
  socket.on('disconnect', () => {
    console.log(`Пользователь отключен: ${socket.id}`)
    const user = users[socket.id]
    if (user) {
      const gameId = user.gameId
      if (gameId && games[gameId]) {
        games[gameId].players = games[gameId].players.filter((id) => id !== socket.id)
        io.to(gameId).emit('playerDisconnected', socket.id)
        if (games[gameId].players.length === 0) {
          delete games[gameId]
        } else {
          games[gameId].status = 'waiting'
        }
      }
      delete users[socket.id]
      io.emit('users', Object.values(users))
      io.emit('games', Object.keys(games))
    }
  })
})

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})