(function () {
    var node_static = require("node-static");
    var http = require("http");
    var io = require("socket.io");
    var port = 3000;
    var currentRoom = {};
    var nickName = [];
    var user = 10;
    var rooms = ["Lobby"];

    var fileServer = new node_static.Server('./public');

    var server = http.createServer(function (req, res) {
        fileServer.serve(req,res);
    }).listen(port, function() {
        console.log("Server listening on port " + port);
    });

    var socketio = new io(server);

    socketio.on("connection", function (socket) {
        console.log("connected - " + socket.id);
        assignNickname(socket, "Guest" + user++);
        joinRoom(socket, "Lobby");
        showRooms();
        socket.on("newchat",function (data) {
            newChat(socket, data.chat);
        });
        socket.on("disconnect",function () {
            console.log("disconnected");
            notifyOldRoom(socket, "")
        });
    });

    function newChat(socket, chatText) {
        chatText = chatText.trim();
        if(chatText.substr(0,2) === "/r"){
            joinRoom(socket, chatText.substr(2,chatText.length-1).trim());
            showRooms();
        }
        else if(chatText.substr(0,2) === "/n"){
            changeNickname(socket, chatText.substr(2,chatText.length-1).trim());
        }
        else{
            socketio.in(currentRoom[socket.id]).emit("showchat", {chat:nickName[socket.id] + " : "+ chatText});
        }
    }

    function changeNickname(socket, nickname) {
        socket.broadcast.to(currentRoom[socket.id]).emit("changenickname", {msg: nickName[socket.id] + " is now " + nickname});
        assignNickname(socket, nickname);
    }

    function assignNickname(socket, nickname) {
        socket.nickName = nickname;
        nickName[socket.id] = nickname;
        socket.emit("setnickname", {nickname: nickname});
    }

    function joinRoom(socket, room) {
        room = toTitleCase(room);
        if(currentRoom[socket.id] !== room) {
            notifyOldRoom(socket, room);
            socket.join(room);
            currentRoom[socket.id] = room;
            socket.emit("currentroom", {room: room});
            socket.broadcast.to(room).emit("joinedroom", {message: nickName[socket.id] + " has joined the " + room});
        }
    }

    function notifyOldRoom(socket, room) {
        room = toTitleCase(room);
        if(room === "")
        {
            joinRoom(socket, "Lobby");
            return;
        }
        if(room !== "Lobby"){
            var oldRoom = currentRoom[socket.id];
            socket.broadcast.to(oldRoom).emit("joinedroom", {message : nickName[socket.id] + " has left the " + oldRoom});
            socket.leave(oldRoom);
            if(rooms.indexOf(room) === -1) {
                rooms.push(room);
                showRooms();
            }
        }
    }

    function showRooms() {
        socketio.emit("rooms", {rooms: rooms});
    }

    function toTitleCase(str)
    {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }
})();