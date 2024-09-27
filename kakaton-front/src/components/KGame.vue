<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 class="text-4xl font-extrabold text-gray-800 mb-8">Скоростное Кодирование</h1>

    <!-- Экран входа в комнату -->
    <div v-if="!inRoom" class="w-full max-w-md bg-white shadow-md rounded-lg p-6">
      <div class="mb-4">
        <label for="username" class="block text-gray-700 font-medium mb-2">Имя пользователя</label>
        <input
            id="username"
            v-model="userName"
            placeholder="Введите ваше имя"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="mb-4">
        <label for="roomId" class="block text-gray-700 font-medium mb-2">ID комнаты</label>
        <input
            id="roomId"
            v-model="roomId"
            placeholder="Введите ID комнаты"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="flex justify-between">
        <button
            @click="createRoom"
            class="w-1/2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Создать комнату
        </button>
        <button
            @click="joinRoom"
            class="w-1/2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ml-2"
        >
          Присоединиться
        </button>
      </div>
    </div>

    <!-- Экран комнаты -->
    <div v-else class="w-full max-w-2xl bg-white shadow-md rounded-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <p class="text-lg text-gray-700">Вы в комнате: <span class="font-bold">{{ roomId }}</span></p>
        <button
            @click="leaveRoom"
            class="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition duration-200"
        >
          Выйти
        </button>
      </div>

      <!-- Ожидание начала игры -->
      <div v-if="!gameStarted" class="text-center">
        <p class="text-gray-600 mb-4">Ожидание начала игры...</p>
        <div class="mt-4">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Игроки в комнате:</h3>
          <ul class="space-y-2">
            <li
                v-for="player in players"
                :key="player.id"
                class="flex items-center justify-between p-2 bg-gray-100 rounded-lg"
            >
              <span class="text-gray-700">{{ player.name }}</span>
              <span v-if="player.id === socketId" class="text-sm text-green-500">(Вы)</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Игра активна -->
      <div v-else>
        <!-- Текущий раунд -->
        <div v-if="currentRound" class="mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Раунд {{ currentRound }}</h2>
            <span class="text-lg text-gray-600">Осталось: {{ timeLeft }} секунд</span>
          </div>

          <p class="mb-4 text-gray-700">{{ task }}</p>

          <div class="w-full h-64 border border-gray-300 rounded-lg mb-4 overflow-hidden">
            <MonacoEditor
                v-model:value="code"
                :options="editorOptions"
                language="javascript"
                theme="vs-dark"
                class="h-full"
            />
          </div>
          <button
              @click="submitCode"
              class="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Отправить код
          </button>

          <div class="mt-6">
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Очки</h3>
            <ul class="space-y-2">
              <li
                  v-for="player in scores"
                  :key="player.name"
                  class="flex justify-between p-2 bg-gray-100 rounded-lg"
              >
                <span class="text-gray-700">{{ player.name }}</span>
                <span class="text-gray-700 font-bold">{{ player.score }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Завершение игры -->
        <div v-else class="text-center">
          <p class="text-2xl font-bold text-green-600">Игра завершена!</p>
          <p class="text-lg text-gray-700 mt-2">Победитель: <span class="font-semibold">{{ winner }}</span></p>
          <div class="mt-6">
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Итоговые очки</h3>
            <ul class="space-y-2">
              <li
                  v-for="player in scores"
                  :key="player.name"
                  class="flex justify-between p-2 bg-gray-100 rounded-lg"
              >
                <span class="text-gray-700">{{ player.name }}</span>
                <span class="text-gray-700 font-bold">{{ player.score }}</span>
              </li>
            </ul>
          </div>
          <button
              @click="leaveRoom"
              class="mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Выйти из комнаты
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import MonacoEditor from '@guolao/vue-monaco-editor';
import { toast } from 'vue3-toastify';

// Типы данных
interface Player {
  id: string;
  name: string;
  score: number;
}

interface Score {
  name: string;
  score: number;
}

interface TaskSolvedPayload {
  solver: string;
  code: string;
}

interface RoundEndedPayload {
  scores: Score[];
}

interface GameEndedPayload {
  winner: string;
  scores: Score[];
}

// Инициализация сокета
const socket: Socket = io('http://localhost:3000');

// Состояния компонента
const roomId = ref<string>('');
const userName = ref<string>('');
const inRoom = ref<boolean>(false);
const gameStarted = ref<boolean>(false);
const currentRound = ref<number>(0);
const task = ref<string>('');
const code = ref<string>('');
const scores = ref<Score[]>([]);
const winner = ref<string>('');
const players = ref<Player[]>([]);
const socketId = ref<string>(socket.id);
const timeLeft = ref<number>(0);

// Опции редактора Monaco
const editorOptions = {
  selectOnLineNumbers: true,
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 14,
  theme: 'vs-dark',
};

// Функции обработки событий
const createRoom = () => {
  if (userName.value.trim() === '') {
    toast.warning('Пожалуйста, введите ваше имя.');
    return;
  }
  const newRoomId = Math.random().toString(36).substr(2, 9);
  socket.emit('createRoom', { roomId: newRoomId, userName: userName.value });
};

const joinRoom = () => {
  if (roomId.value.trim() === '' || userName.value.trim() === '') {
    toast.warning('Пожалуйста, введите ваш ID комнаты и имя.');
    return;
  }
  socket.emit('joinRoom', { roomId: roomId.value, userName: userName.value });
  inRoom.value = true;
};

const leaveRoom = () => {
  window.location.reload();
};

const submitCode = () => {
  if (code.value.trim() === '') {
    toast.warning('Пожалуйста, введите ваш код.');
    return;
  }
  socket.emit('submitCode', { roomId: roomId.value, code: code.value });
};

// Обработчики сокет-событий
socket.on('roomCreated', (id: string) => {
  console.log('Комната создана:', id);
  roomId.value = id;
  inRoom.value = true;
  if (socket.id) {
    players.value = [{ id: socket.id, name: userName.value, score: 0 }];
  }
  toast.success(`Комната создана! ID комнаты: ${id}`);
});

socket.on('currentPlayers', (currentPlayers: Player[]) => {
  console.log('Текущие игроки:', currentPlayers);
  players.value = currentPlayers;
});

socket.on('playerJoined', (player: { id: string; name: string }) => {
  console.log(`Игрок присоединился: ${player.name}`);
  players.value.push({ id: player.id, name: player.name, score: 0 });
  toast.info(`${player.name} присоединился к комнате.`);
});

socket.on('playerLeft', (playerId: string) => {
  console.log(`Игрок покинул: ${playerId}`);
  const player = players.value.find(p => p.id === playerId);
  if (player) {
    players.value = players.value.filter(player => player.id !== playerId);
    toast.info(`${player.name} покинул комнату.`);
  }
});

socket.on('error', (message: string) => {
  console.error('Ошибка:', message);
  toast.error(message);
});

socket.on('gameStarted', (data: { totalRounds: number }) => {
  console.log('Игра началась:', data);
  gameStarted.value = true;
  toast.success('Игра началась!');
});

socket.on('newRound', (data: { round: number }) => {
  console.log('Новый раунд:', data);
  currentRound.value = data.round;
  task.value = '';
  code.value = '';
});

socket.on('task', (newTask: string) => {
  console.log('Новое задание:', newTask);
  task.value = newTask;
});

socket.on('scoreUpdate', (newScores: Score[]) => {
  console.log('Обновление очков:', newScores);
  scores.value = newScores;
});

socket.on('taskSolved', ({ solver, code: solvedCode }: TaskSolvedPayload) => {
  console.log(`Задание решено ${solver}: ${solvedCode}`);
  toast.success(`Задание решено ${solver}!`);
});

socket.on('incorrectSolution', (message: string) => {
  console.error('Неправильное решение:', message);
  toast.warning(message);
});

socket.on('roundEnded', (data: RoundEndedPayload) => {
  console.log('Раунд завершен:', data);
  const scoreDetails = data.scores.map(s => `${s.name}: ${s.score}`).join('\n');
  toast.info(`Раунд завершен! Текущие очки:\n${scoreDetails}`);
});

socket.on('gameEnded', (data: GameEndedPayload) => {
  console.log('Игра завершена:', data);
  winner.value = data.winner;
  scores.value = data.scores;
  currentRound.value = 0;
  toast.success(`Игра завершена! Победитель: ${winner.value}`);
});

socket.on('timerUpdate', (time: number) => {
  console.log('Обновление таймера:', time);
  timeLeft.value = time;
});

// Обработка отключения
onUnmounted(() => {
  socket.disconnect();
});
</script>
