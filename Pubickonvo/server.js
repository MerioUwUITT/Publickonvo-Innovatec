const path = require('path');
const http = require('http');
const express =  require( 'express' );
const socketIO = require( 'socket.io' );
const formatMessage = require( './utils/messages' );
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require( './utils/users' );

const  app = express();
const server = http.createServer(app);
const io = socketIO(server);

//set static folder
app.use(express.static( path.join ( __dirname ,  'public' )));
//admin bot name
const botname = 'ITTAdmin';
//run when client connects
io.on( 'connection' ,  socket  => {
    socket.on( 'joinRoom' , ({username,room}) => {
        const user = userJoin(socket.id,username,room);
        socket.join(user.room);
        //welcome current user
        socket.emit( 'message' ,  formatMessage(botname,`Welcome, ${user.username}!`) );
        //broadcast when a user connects
        socket.broadcast.to(user.room).emit( 
            'message' ,  formatMessage(botname,`${user.username} just joined the chat!`) );
        //send users and room info
        io.to(user.room).emit( 'roomUsers' , {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
    
    
    //listen for chatMessage
    socket.on( 'chatMessage' ,  (msg)  => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit( 'message' , formatMessage(user.username,msg));
    });

    //runs when client disconnects
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);//returns user that left
        if(user){
            io.to(user.room).emit( 'message' ,  formatMessage(botname,`${user.username} has left the chat!`) );
             //send users and room info
            io.to(user.room).emit( 'roomUsers' , {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        }
    });
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log( `Server running on port ${PORT}` ));