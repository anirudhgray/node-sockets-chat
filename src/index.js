import express from 'express'
import http from 'http'
import path from 'path'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import Filter from 'bad-words'

import { generateMessage, generateLocationMessage } from './utils/messages.js'
import { addUser, removeUser, getUser, getUsersInRoom } from './utils/users.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server)
const PORT = process.env.PORT

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
  console.log("New WebSocket connection.")

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit('message', generateMessage("ADMIN", "Welcome!"))
    socket.broadcast.to(user.room).emit('message', generateMessage("ADMIN", `${user.username} has joined!`)) // to.emit emits only to the room this socket is in
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!")
    }
    io.to(user.room).emit('message', generateMessage(user.username, message))
    callback()
  })

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps/?q=${location.lat},${location.long}`))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit('message', generateMessage("ADMIN", `${user.username} has left.`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(PORT, () => {
  console.log("App running on port " + PORT)
})