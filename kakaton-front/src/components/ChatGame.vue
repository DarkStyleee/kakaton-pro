<template>
    <div class="flex  flex-col h-96 p-4 bg-gray-100">
      <div class="flex-1 overflow-auto mb-4">
        <div v-for="(msg, index) in messages" :key="index" class="mb-2">
          <span class="font-bold">{{ msg.user }}:</span> {{ msg.text }}
        </div>
      </div>
      <form @submit.prevent="sendMessage" class="flex">
        <input
          v-model="message"
          type="text"
          class="flex-1 p-2 border rounded"
          placeholder="Введите сообщение"
          required
        />
        <button type="submit" class="ml-2 p-2 bg-blue-500 text-white rounded">
          Отправить
        </button>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { io, Socket } from 'socket.io-client'
  
  interface Message {
    user: string
    text: string
  }
  
  const messages = ref<Message[]>([])
  const message = ref('')
  const socket = ref<Socket | null>(null)
  
  const sendMessage = () => {
    if (socket.value && message.value.trim() !== '') {
      socket.value.emit('message', { user: 'User', text: message.value })
      message.value = ''
    }
  }
  
  onMounted(() => {
    socket.value = io('http://localhost:3000')
  
    socket.value.on('message', (msg: Message) => {
      messages.value.push(msg)
    })
  })
  </script>
  
  <style scoped>
  /* Дополнительные стили при необходимости */
  </style>