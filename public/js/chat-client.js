(function () {
    var socket = null;
    (function(){
        var rooms = [];
        var $btnStatus = $("#status");
        var $roomName = $("#roomname");
        var $nickname = $("#nickname");
        var $chatWindow = $("#chatwindow");
        var $roomWindow = $("#roomwindow");
        var $chatText = $("#chattext");
        var $btnSubmit = $("#btnSubmit");

        $btnStatus.on("click", changeStatus);
        $btnSubmit.on("click", sendChat);
        $roomWindow.delegate( "a", "click", changeRoom);

        function setSocketConnection(socket) {
            socket.on("setnickname", function (data) {
                $nickname.text("Hi " + data.nickname);
            });
            socket.on("currentroom", function (data) {
                $roomName.text("Current Room - " + data.room);
            });
            socket.on("joinedroom", function (data) {
                $chatWindow.append(data.message + "<br>");
            });
            socket.on("changenickname", function (data) {
                $chatWindow.append(data.msg + "<br>");
            });
            socket.on("showchat", function (data) {
                $chatWindow.append(data.chat + "<br>");
            });
            socket.on("rooms", function (data) {
                $roomWindow.html("");
                for(var index in data.rooms){
                    $roomWindow.append("<a>"+ data.rooms[index] +"</a>" + "<br>");
                }
            });
        }

        function sendChat() {
            socket.emit("newchat", {chat: $chatText.val()});
            $chatText.val("");
        }

        function changeRoom(e) {
            socket.emit("newchat", {chat: "/r " + e.target.innerText});
            $chatWindow.html("");
        }

        function changeStatus() {
            if($btnStatus.val() === "Login"){
                socket = io('http://localhost:3000',{'forceNew':true });
                $btnStatus.val("Logout");
                setSocketConnection(socket);
            }
            else{
                socket.disconnect();
                $btnStatus.val("Login");
                resetWindow();
            }
        }

        function resetWindow() {
            $roomWindow.html("");
            $nickname.text("");
            $roomName.text("");
            $chatWindow.html("");
        }
    })();
})();