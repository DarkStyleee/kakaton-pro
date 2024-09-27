const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { VM } = require('vm2')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

const PORT = process.env.PORT || 3000

const programmingTasks = [
  "Напишите функцию `add(a, b)`, которая возвращает сумму двух чисел.",
  "Создайте класс `Person` с конструктором, принимающим имя и возраст.",
  "Напишите функцию `reverseString(str)`, которая возвращает перевернутую строку.",
  "Создайте функцию `isPalindrome(str)`, которая проверяет, является ли строка палиндромом.",
  "Напишите функцию `fibonacci(n)`, которая возвращает n-е число в последовательности Фибоначчи."
]

// Оставил для теста решений
const solutions = [
  `function add(a, b) { return a + b; }`,
  `class Person { constructor(name, age) { this.name = name; this.age = age; } }`,
  `function reverseString(str) { return str.split('').reverse().join(''); }`,
  `function isPalindrome(str) { const reversed = str.split('').reverse().join(''); return str === reversed; }`,
  `function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }`
]

const testCases = [
  // add(a, b)
  [
    { args: [1, 2], expected: 3 },
    { args: [-1, 1], expected: 0 },
    { args: [0, 0], expected: 0 }
  ],
  // Person class
  [
    { args: ['Alice', 30], expected: { name: 'Alice', age: 30 } },
    { args: ['Bob', 25], expected: { name: 'Bob', age: 25 } }
  ],
  // reverseString(str)
  [
    { args: ['hello'], expected: 'olleh' },
    { args: ['world'], expected: 'dlrow' },
    { args: [''], expected: '' }
  ],
  // isPalindrome(str)
  [
    { args: ['racecar'], expected: true },
    { args: ['hello'], expected: false },
    { args: ['level'], expected: true }
  ],
  // fibonacci(n)
  [
    { args: [0], expected: 0 },
    { args: [1], expected: 1 },
    { args: [5], expected: 5 },
    { args: [10], expected: 55 }
  ]
]

const games = {}

io.on('connection', (socket) => {
  console.log(`Пользователь подключен: ${socket.id}`)

  socket.on('createRoom', ({ roomId, userName }) => {
    socket.join(roomId)
    games[roomId] = {
      players: [{ id: socket.id, name: userName, score: 0 }],
      currentTaskIndex: 0,
      gameActive: false,
      taskSolved: false,
      roundTimer: null
    }
    io.to(roomId).emit('roomCreated', roomId)
    io.to(roomId).emit('currentPlayers', games[roomId].players)
    console.log(`Комната создана: ${roomId} пользователем ${socket.id}`)
  })

  socket.on('joinRoom', ({ roomId, userName }) => {
    const room = io.sockets.adapter.rooms.get(roomId)
    if (room && games[roomId]) {
      socket.join(roomId)
      games[roomId].players.push({ id: socket.id, name: userName, score: 0 })
      io.to(roomId).emit('playerJoined', { id: socket.id, name: userName })
      io.to(roomId).emit('currentPlayers', games[roomId].players)
      console.log(`Пользователь ${socket.id} присоединился к комнате ${roomId}`)

      if (games[roomId].players.length >= 2 && !games[roomId].gameActive) {
        startGame(roomId)
      }
    } else {
      socket.emit('error', 'Комната не найдена')
      console.log(`Пользователь ${socket.id} попытался присоединиться к несуществующей комнате ${roomId}`)
    }
  })

  socket.on('codeChange', (data) => {
    socket.to(data.roomId).emit('codeUpdate', { code: data.code, playerId: socket.id })
  })

  socket.on('submitCode', ({ roomId, code }) => {
    const room = games[roomId]
    if (room && room.gameActive && !room.taskSolved) {
      const taskIndex = room.currentTaskIndex
      const currentTestCases = testCases[taskIndex]

      const vm = new VM({
        timeout: 1000,
        sandbox: {}
      })

      let userFunction
      try {
        vm.run(code)
        switch (taskIndex) {
          case 0:
            userFunction = vm.run(`add`)
            break
          case 1:
            userFunction = vm.run(`Person`)
            break
          case 2:
            userFunction = vm.run(`reverseString`)
            break
          case 3:
            userFunction = vm.run(`isPalindrome`)
            break
          case 4:
            userFunction = vm.run(`fibonacci`)
            break
          default:
            throw new Error('Неподдерживаемое задание')
        }
      } catch (err) {
        console.error(`Ошибка при выполнении кода игрока ${socket.id}:`, err)
        socket.emit('incorrectSolution', 'Ошибка при выполнении кода. Проверьте синтаксис.')
        return
      }

      let allTestsPassed = true
      for (const testCase of currentTestCases) {
        try {
          const result = (taskIndex === 1) ?
            new userFunction(...testCase.args) :
            userFunction(...testCase.args)
          
          if (taskIndex === 1) {
            if (result.name !== testCase.expected.name || result.age !== testCase.expected.age) {
              allTestsPassed = false
              break
            }
          } else {
            if (result !== testCase.expected) {
              allTestsPassed = false
              break
            }
          }
        } catch (err) {
          console.error(`Ошибка при тестировании кода игрока ${socket.id}:`, err)
          allTestsPassed = false
          break
        }
      }

      if (allTestsPassed) {
        room.taskSolved = true
        const player = room.players.find(p => p.id === socket.id)
        if (player) {
          player.score += 1
          io.to(roomId).emit('scoreUpdate', room.players.map(p => ({ name: p.name, score: p.score })))
          io.to(roomId).emit('taskSolved', { solver: player.name, code })
          console.log(`Игрок ${player.name} решил задание ${room.currentTaskIndex + 1} в комнате ${roomId}`)

          if (player.score >= 3) {
            io.to(roomId).emit('gameEnded', { winner: player.name, scores: room.players.map(p => ({ name: p.name, score: p.score })) })
            delete games[roomId]
            console.log(`Игра в комнате ${roomId} завершена. Победитель: ${player.name}`)
            clearTimeout(room.roundTimer)
            return
          }

          setTimeout(() => {
            if (room.currentTaskIndex < programmingTasks.length - 1) {
              room.currentTaskIndex += 1
              room.taskSolved = false
              io.to(roomId).emit('newRound', { round: room.currentTaskIndex + 1 })
              io.to(roomId).emit('task', programmingTasks[room.currentTaskIndex])
              console.log(`Начался раунд ${room.currentTaskIndex + 1} в комнате ${roomId}`)

              room.roundTimer = setTimeout(() => {
                endRound(roomId)
              }, 2 * 60 * 1000)
            } else {
              endGame(roomId)
            }
          }, 3000)
        }
      } else {
        socket.emit('incorrectSolution', 'Неправильное решение. Попробуйте еще раз.')
      }
    }
  })

  socket.on('disconnect', () => {
    console.log(`Пользователь отключен: ${socket.id}`)
    for (const roomId in games) {
      const room = games[roomId]
      const playerIndex = room.players.findIndex(p => p.id === socket.id)
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name
        room.players.splice(playerIndex, 1)
        io.to(roomId).emit('playerLeft', socket.id)
        io.to(roomId).emit('currentPlayers', room.players)
        console.log(`Пользователь ${playerName} покинул комнату ${roomId}`)

        if (room.players.length === 0) {
          clearTimeout(room.roundTimer)
          delete games[roomId]
          console.log(`Комната ${roomId} удалена из-за отсутствия игроков`)
        }
        break
      }
    }
  })
})

function startGame(roomId) {
  const room = games[roomId]
  if (!room) return

  room.gameActive = true
  room.currentTaskIndex = 0
  room.taskSolved = false
  io.to(roomId).emit('gameStarted', { totalRounds: 5 })
  io.to(roomId).emit('newRound', { round: 1 })
  io.to(roomId).emit('task', programmingTasks[room.currentTaskIndex])
  console.log(`Игра в комнате ${roomId} началась`)

  room.roundTimer = setTimeout(() => {
    endRound(roomId)
  }, 2 * 60 * 1000)
}

function endRound(roomId) {
  const room = games[roomId]
  if (!room) return

  io.to(roomId).emit('roundEnded', { scores: room.players.map(p => ({ name: p.name, score: p.score })) })
  console.log(`Раунд ${room.currentTaskIndex + 1} в комнате ${roomId} завершен`)

  if (room.currentTaskIndex < programmingTasks.length - 1) {
    room.currentTaskIndex += 1
    room.taskSolved = false
    io.to(roomId).emit('newRound', { round: room.currentTaskIndex + 1 })
    io.to(roomId).emit('task', programmingTasks[room.currentTaskIndex])
    console.log(`Начался раунд ${room.currentTaskIndex + 1} в комнате ${roomId}`)

    room.roundTimer = setTimeout(() => {
      endRound(roomId)
    }, 2 * 60 * 1000)
  } else {
    endGame(roomId)
  }
}

function endGame(roomId) {
  const room = games[roomId]
  if (!room) return

  let winner = null
  let maxScore = -1
  for (const player of room.players) {
    if (player.score > maxScore) {
      maxScore = player.score
      winner = player.name
    }
  }

  io.to(roomId).emit('gameEnded', { winner, scores: room.players.map(p => ({ name: p.name, score: p.score })) })
  console.log(`Игра в комнате ${roomId} завершена. Победитель: ${winner}`)

  delete games[roomId]
}

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})