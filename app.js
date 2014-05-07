var express = require("express")
            , app = express()
            , http = require("http").createServer(app)
            , io = require("socket.io").listen(http)
            , _ = require("underscore");

/* participants format
{
  id: "sessionId",
  name: "participantName"
}
*/
var participants = []

/* Server config */

app.set("ipaddr", "127.0.0.1");

app.set("port", 8080);

/* Sets the views folder */
app.set("views", __dirname + "/views");

/* Sets the view engin */
app.set("view engine", "jade");

app.use(express.static("public", __dirname + "/public"));

app.use(express.bodyParser());

/* Server routing */

app.get("/", function(request, response) {
  response.render("index");
});

//POST method to create a chat message
app.post("/message", function(request, response) {
  var message = request.body.message;

  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {error: "Message is invalid"});
  }
  var name = request.body.name;
  //let the chat room know there was a new message
  io.sockets.emit("incomingMessage", {message: message, name: name});

  response.json(200, {message: "Message received"});
});

/* Socket.IO events */

//New user connects = newUser
io.on("connection", function(socket) {

  socket.on("newUser", function(data) {
    participants.push({id: data.id, name: data.name});
    io.sockets.emit("newConnection", {participants: participants});
  });

//New name = nameCahnge
  socket.on("nameChange", function(data) {
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit("nameChanged", {id: data.id, name: data.name});
  });

//Client disconnects from server = disconnect
  socket.on("disconnect", function() {
    participants = _.without(participants,_.findWhere(participants, {id:socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});

http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});


