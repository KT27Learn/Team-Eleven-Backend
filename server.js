const express = require('express');
const socketio = require('socket.io')
const app = express();
const server = require("http").createServer(app);
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const cors = require('cors');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
require('dotenv').config()

const port = process.env.PORT || 5000;

//setting up of backend server with CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

//instance of socket io
const io = require("socket.io")(server, {
	cors: {
		origin: "https://orbital-team-eleven.vercel.app",
		methods: [ "GET", "POST" ]
	}
});

const users = {};
const roomToBroadCaster = {};
const socketToRoom = {};

/*
 * Removes disconnected user from arrays above
 *
 * @param {String} id Socket.Id of disconnected user
 *
 */
function removeDisconnectedID(id) {

    const roomID = socketToRoom[id];
    socketToRoom[id] = null;
    const newList = !users[roomID] ? []: users[roomID].filter(socket => socket !== id);
    users[roomID] = newList;
}

io.on('connect', (socket) => {
    
    //video streaming

    //New Livestream started
    socket.on("create broadcaster", (roomID) => {
        
        users[roomID] = [socket.id]
        socketToRoom[socket.id] = roomID;
        roomToBroadCaster[roomID] = socket.id;
        socket.join(roomID);
        socket.broadcast.emit("broadcaster");
    });

    //New Viewer entered live study room
    socket.on("watcher", (roomID) => {

        if (!users[roomID]) {
            users[roomID] = [socket.id];
        } else {
            users[roomID].push(socket.id);
        }
        
        socketToRoom[socket.id] = roomID;
        socket.join(roomID);
        socket.to(roomToBroadCaster[roomID]).emit("watcher", socket.id);
    });

    socket.on("offer", (id, message) => {
        socket.to(id).emit("offer", socket.id, message);
    });
    socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
    });
    socket.on("candidate", (id, message) => {
        socket.to(id).emit("candidate", socket.id, message);
    });

    //Livestreamer left room
    socket.on("broadcaster left", roomID => {
        socket.to(roomID).emit("broadcaster left");
    }) 

    //Livestreamer ends broadcast
    socket.on("end broadcast", roomID => {
        socket.to(roomID).emit("end broadcast");
    }) 

    //chat function

    //New user enters study room
    socket.on('join chat', ({ name, room }, callback) => {
      const { error, user } = addUser({ id: socket.id , name , room });
  
      if(error) return callback(error);
  
      socket.join(user.room);
  
      socket.emit('message', { user: 'admin', text: `Welcome to the room ${user.name}!`});
      socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });
  
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
  
      callback();
    });
    
    //New message is sent to a chatroom
    socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id);
  
      io.to(user.room).emit('message', { user: user.name, text: message });
  
      callback();
    });
  
    //user leaves studyroom
    socket.on('disconnect', () => {
      //chat
      const user = removeUser(socket.id);
  
      if(user) {
        io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
      }
      //video
        const broadcasterID = roomToBroadCaster[socketToRoom[socket.id]];
        removeDisconnectedID(socket.id);
        socket.to(broadcasterID).emit("disconnectPeer", socket.id);
    })
  });

app.use(function (req, res, next) {
    req.io = io;
    next();
})

//connect to MongoDB database
const uri = "mongodb+srv://keifu2707:Orbital1@@cluster0.thtmz.mongodb.net/Eleven?retryWrites=true&w=majority";
mongoose.connect(uri, { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useUnifiedTopology: true}
    );
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});

//Routes to the different routes
const postRouter = require('./routes/posts');
const roomRouter = require('./routes/rooms');
const libraryRouter = require('./routes/library');
const usersRouter = require('./routes/users');
const sessionRouter = require('./routes/session');
const favouritesRouter = require('./routes/favourites');

app.use('/rooms', roomRouter);
app.use('/posts', postRouter);
app.use('/library', libraryRouter);
app.use('/users', usersRouter);
app.use('/session', sessionRouter);
app.use('/favourites', favouritesRouter)

server.listen(port, () => {

    console.log(`Server is running on port : ${port}`);
    
});
