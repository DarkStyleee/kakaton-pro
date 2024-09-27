<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 class="text-3xl font-bold mb-6">Скоростное Кодирование</h1>

    <div v-if="!inRoom" class="w-full max-w-md">
      <input v-model="userName" placeholder="Введите ваше имя" class="p-2 border rounded mb-2 w-full"/>
      <input v-model="roomId" placeholder="Введите ID комнаты" class="p-2 border rounded mb-2 w-full"/>
      <div class="flex justify-between">
        <button @click="createRoom" class="bg-green-500 text-white px-4 py-2 rounded">Создать комнату</button>
        <button @click="joinRoom" class="bg-blue-500 text-white px-4 py-2 rounded ml-2">Присоединиться к
          комнате
        </button>
      </div>
    </div>

    <div v-else class="w-full max-w-2xl">
      <p class="mb-4">Вы в комнате: <strong>{{ roomId }}</strong></p>

      <div v-if="!gameStarted">
        <p>Ожидание начала игры...</p>
        <div class="mt-4">
          <h3 class="text-xl">Игроки в комнате:</h3>
          <ul>
            <li v-for="player in players" :key="player.id">
              {{ player.name }} <span v-if="player.id === socketId">(Вы)</span>
            </li>
          </ul>
        </div>
      </div>

      <div v-else>
        <div v-if="currentRound">
          <h2 class="text-2xl mb-2">Раунд {{ currentRound }}</h2>
          <p class="mb-4">{{ task }}</p>

          <div class="w-full h-60 border rounded mb-2">
            <MonacoEditor v-model:value="code" :options="editorOptions" language="javascript" theme="vs-dark"/>
          </div>
          <button @click="submitCode" class="bg-purple-500 text-white px-4 py-2 rounded">Отправить
            код
          </button>

          <div class="mt-4">
            <h3 class="text-xl">Очки</h3>
            <ul>
              <li v-for="player in scores" :key="player.name">
                {{ player.name }}: {{ player.score }}
              </li>
            </ul>
          </div>
        </div>

        <div v-else>
          <p>Игра завершена! Победитель: {{ winner }}</p>
          <button @click="leaveRoom" class="bg-red-500 text-white px-4 py-2 rounded mt-4">Выйти из
            комнаты
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onUnmounted} from 'vue';
import {io} from 'socket.io-client';
import MonacoEditor from '@guolao/vue-monaco-editor';
import {toast} from "vue3-toastify";

const socket = io('http://localhost:3000');
const roomId = ref('');
const userName = ref('');
const inRoom = ref(false);
const gameStarted = ref(false);
const currentRound = ref(0);
const task = ref('');
const code = ref('');
const scores = ref<{ name: string, score: number }[]>([]);
const winner = ref('');
const players = ref<{ id: string, name: string, score: number }[]>([]);
const socketId = ref(socket.id);

const editorOptions = {
  selectOnLineNumbers: true,
  automaticLayout: true,
  minimap: {enabled: false},
  fontSize: 14,
  theme: 'vs-dark',
};

const createRoom = () => {
  if (userName.value.trim() === '') {
    toast.warning('Пожалуйста, введите ваше имя.');
    return;
  }
  const newRoomId = Math.random().toString(36).substr(2, 9);
  socket.emit('createRoom', {roomId: newRoomId, userName: userName.value});
};

const joinRoom = () => {
  if (roomId.value.trim() === '' || userName.value.trim() === '') {
    toast.warning('Пожалуйста, введите ваш ID комнаты и имя.');
    return;
  }
  socket.emit('joinRoom', {roomId: roomId.value, userName: userName.value});
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
  socket.emit('submitCode', {roomId: roomId.value, code: code.value});
};

socket.on('roomCreated', (id: string) => {
  console.log('Комната создана:', id);
  roomId.value = id;
  inRoom.value = true;
  players.value = [{id: socket.id, name: userName.value, score: 0}];
});

socket.on('currentPlayers', (currentPlayers: { id: string, name: string, score: number }[]) => {
  console.log('Текущие игроки:', currentPlayers);
  players.value = currentPlayers;
});

socket.on('playerJoined', (player: { id: string, name: string }) => {
  console.log(`Игрок присоединился: ${player.name}`);
  players.value.push({id: player.id, name: player.name, score: 0});
});

socket.on('playerLeft', (playerId: string) => {
  console.log(`Игрок покинул: ${playerId}`);
  players.value = players.value.filter(player => player.id !== playerId);
});

socket.on('error', (message: string) => {
  console.error('Ошибка:', message);
  toast.warning(message);
});

socket.on('gameStarted', (data: { totalRounds: number }) => {
  console.log('Игра началась:', data);
  gameStarted.value = true;
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

socket.on('scoreUpdate', (newScores: { name: string, score: number }[]) => {
  console.log('Обновление очков:', newScores);
  scores.value = newScores;
});

socket.on('taskSolved', ({solver, code: solvedCode}: { solver: string, code: string }) => {
  console.log(`Задание решено ${solver}: ${solvedCode}`);
  toast.success(`Задание решено ${solver}!`);
});

socket.on('incorrectSolution', (message: string) => {
  console.error('Неправильное решение:', message);
  toast.warning(message);
});

socket.on('roundEnded', (data: { scores: { name: string, score: number }[] }) => {
  console.log('Раунд завершен:', data);
  toast.info(`Раунд завершен! Текущие очки:\n` + data.scores.map(s => `${s.name}: ${s.score}`).join('\n'));
});

socket.on('gameEnded', (data: { winner: string, scores: { name: string, score: number }[] }) => {
  console.log('Игра завершена:', data);
  winner.value = data.winner;
  scores.value = data.scores;
  currentRound.value = 0;
  toast.success(`Игра завершена! Победитель: ${winner.value}`);
});

onUnmounted(() => {
  socket.disconnect();
});
</script>