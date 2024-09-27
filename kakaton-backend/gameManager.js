const { programmingTasks, testCases } = require('./tasks');
const { executeUserCode, validateTestResult } = require('./utils');
const { DEFAULT_ROUND_TIMER } = require('./constants');

class GameManager {
    constructor(io) {
        this.io = io;
        this.games = {};
    }

    createRoom(roomId, userName, socket) {
        socket.join(roomId);
        this.games[roomId] = {
            players: [{ id: socket.id, name: userName, score: 0 }],
            currentTaskIndex: 0,
            gameActive: false,
            taskSolved: false,
            roundTimer: null,
            timeLeft: DEFAULT_ROUND_TIMER
        };
        this.io.to(roomId).emit('roomCreated', roomId);
        this.io.to(roomId).emit('currentPlayers', this.games[roomId].players);
        console.log(`Комната создана: ${roomId} пользователем ${socket.id}`);
    }

    joinRoom(roomId, userName, socket) {
        const room = this.io.sockets.adapter.rooms.get(roomId);
        if (room && this.games[roomId]) {
            socket.join(roomId);
            this.games[roomId].players.push({ id: socket.id, name: userName, score: 0 });
            this.io.to(roomId).emit('playerJoined', { id: socket.id, name: userName });
            this.io.to(roomId).emit('currentPlayers', this.games[roomId].players);
            console.log(`Пользователь ${socket.id} присоединился к комнате ${roomId}`);

            if (this.games[roomId].players.length >= 2 && !this.games[roomId].gameActive) {
                this.startGame(roomId);
            }
        } else {
            socket.emit('error', 'Комната не найдена');
            console.log(`Пользователь ${socket.id} попытался присоединиться к несуществующей комнате ${roomId}`);
        }
    }

    startGame(roomId) {
        const room = this.games[roomId];
        if (!room) return;

        room.gameActive = true;
        room.currentTaskIndex = 0;
        room.taskSolved = false;
        room.timeLeft = DEFAULT_ROUND_TIMER;
        this.io.to(roomId).emit('gameStarted', { totalRounds: programmingTasks.length });
        this.io.to(roomId).emit('newRound', { round: room.currentTaskIndex + 1 });
        this.io.to(roomId).emit('task', programmingTasks[room.currentTaskIndex]);
        console.log(`Игра в комнате ${roomId} началась`);

        this.startRoundTimer(roomId);
    }

    startRoundTimer(roomId) {
        const room = this.games[roomId];
        if (!room) return;

        clearInterval(room.roundTimer);
        room.roundTimer = setInterval(() => {
            if (room.timeLeft > 0) {
                room.timeLeft -= 1;
                this.io.to(roomId).emit('timerUpdate', room.timeLeft);
            } else {
                clearInterval(room.roundTimer);
                this.endRound(roomId);
            }
        }, 1000);
    }

    endRound(roomId) {
        const room = this.games[roomId];
        if (!room) return;

        this.io.to(roomId).emit('roundEnded', { scores: this.getScores(room) });
        console.log(`Раунд ${room.currentTaskIndex + 1} в комнате ${roomId} завершен`);

        if (room.currentTaskIndex < programmingTasks.length - 1) {
            room.currentTaskIndex += 1;
            room.taskSolved = false;
            room.timeLeft = DEFAULT_ROUND_TIMER;
            this.io.to(roomId).emit('newRound', { round: room.currentTaskIndex + 1 });
            this.io.to(roomId).emit('task', programmingTasks[room.currentTaskIndex]);
            console.log(`Начался раунд ${room.currentTaskIndex + 1} в комнате ${roomId}`);

            this.startRoundTimer(roomId);
        } else {
            this.endGame(roomId);
        }
    }

    endGame(roomId) {
        const room = this.games[roomId];
        if (!room) return;

        const winner = room.players.reduce((prev, current) => (prev.score > current.score) ? prev : current, { score: -1 }).name;
        this.io.to(roomId).emit('gameEnded', { winner, scores: this.getScores(room) });
        console.log(`Игра в комнате ${roomId} завершена. Победитель: ${winner}`);

        clearInterval(room.roundTimer);
        delete this.games[roomId];
    }

    getScores(room) {
        return room.players.map(p => ({ name: p.name, score: p.score }));
    }

    handleSubmitCode(roomId, socket, code) {
        const room = this.games[roomId];
        if (!room || !room.gameActive || room.taskSolved) return;

        const taskIndex = room.currentTaskIndex;
        const currentTestCases = testCases[taskIndex];

        let userFunction;
        try {
            userFunction = executeUserCode(code, taskIndex);
        } catch (err) {
            console.error(`Ошибка при выполнении кода игрока ${socket.id}:`, err);
            socket.emit('incorrectSolution', 'Ошибка при выполнении кода. Проверьте синтаксис.');
            return;
        }

        let allTestsPassed = true;
        for (const testCase of currentTestCases) {
            try {
                const result = (taskIndex === 1) ?
                    new userFunction(...testCase.args) :
                    userFunction(...testCase.args);

                if (!validateTestResult(taskIndex, result, testCase.expected)) {
                    allTestsPassed = false;
                    break;
                }
            } catch (err) {
                console.error(`Ошибка при тестировании кода игрока ${socket.id}:`, err);
                allTestsPassed = false;
                break;
            }
        }

        if (allTestsPassed) {
            room.taskSolved = true;
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.score += 1;
                this.io.to(roomId).emit('scoreUpdate', this.getScores(room));
                this.io.to(roomId).emit('taskSolved', { solver: player.name, code });
                console.log(`Игрок ${player.name} решил задание ${room.currentTaskIndex + 1} в комнате ${roomId}`);

                if (player.score >= 3) {
                    this.endGame(roomId);
                    return;
                }

                setTimeout(() => {
                    if (room.currentTaskIndex < programmingTasks.length - 1) {
                        this.endRound(roomId);
                    } else {
                        this.endGame(roomId);
                    }
                }, 3000);
            }
        } else {
            socket.emit('incorrectSolution', 'Неправильное решение. Попробуйте еще раз.');
        }
    }

    handlePlayerDisconnect(socket) {
        for (const roomId in this.games) {
            const room = this.games[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const playerName = room.players[playerIndex].name;
                room.players.splice(playerIndex, 1);
                this.io.to(roomId).emit('playerLeft', socket.id);
                this.io.to(roomId).emit('currentPlayers', room.players);
                console.log(`Пользователь ${playerName} покинул комнату ${roomId}`);

                if (room.players.length === 0) {
                    clearInterval(room.roundTimer);
                    delete this.games[roomId];
                    console.log(`Комната ${roomId} удалена из-за отсутствия игроков`);
                }
                break;
            }
        }
    }
}

module.exports = GameManager;
