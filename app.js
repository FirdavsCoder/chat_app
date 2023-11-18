const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const path = require('path')
const formatMessage = require('./utils/message')
const { joinUser, getCurrentUser, leftUser, getRoomUsers } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', socket => {
  const botName = 'ChatBot'

  socket.on('joinRoom', ({username, room}) => {
    const user = joinUser(socket.id, username, room)

    socket.join(user.room)

    //Welcomming new user
    socket.emit('message', formatMessage(botName, 'Welcome to Chat App'))
  
    //Inform others when a new user connects to the chat
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} joined to the chat`))

    //send user online info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    })
  })
  //listen to chatMessage event
  socket.on('chatMessage', (message) => {
    const user = getCurrentUser(socket.id)
    io.to(user.room).emit('message', formatMessage(user.username, message))
  })

  //Runs when user disconnects
  socket.on('disconnect', () => {
    const user = leftUser(socket.id)

    if(user){
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} left the chat`))
    }

    //send user online info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    })
  })
  
})
  
const PORT = process.env.PORT || 8080

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})