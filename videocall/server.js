const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, rsp) => {
    rsp.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, rsp) => {
    rsp.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    let currentUserId;
    let roomId;

    // User joins the room
    socket.on("join-room", (room, userId) => {
        currentUserId = userId;
        roomId = room;
        socket.join(roomId);

        console.log(`User ${userId} joined room ${roomId}`);
        socket.broadcast.to(roomId).emit("user-connected", userId);
    });

    // Handle user actions like mute/unmute and pause/resume video
    socket.on("user-action", (data) => {
        const { action, userId } = data;
        console.log(`User ${userId} performed action: ${action}`);
    
        // Ensure event is only emitted once
        io.to(roomId).emit("user-action-notification", { action, userId });
    });
    

    // Handle incoming chat messages
    socket.on("message", (message) => {
        io.to(roomId).emit("createMessage", { msg: message, user: currentUserId });
    });

    // Handle when a user disconnects
    socket.on("disconnect", () => {
        console.log(`User ${currentUserId} disconnected`);
    
        // Notify other users in the room
        socket.broadcast.to(roomId).emit("user-disconnected", currentUserId);
        socket.broadcast.to(roomId).emit("user-action-notification", { action: "leave", userId: currentUserId });
    });

    // Handle pause video
     socket.on("pauseVideo", (data) => {
        console.log(`User ${data.userId} paused video`);
        io.to(roomId).emit("pauseVideo", data); // Emit to all users, including sender
    });

    // Handle play video
    socket.on("playVideo", (data) => {
        console.log(`User ${data.userId} resumed video`);
        io.to(roomId).emit("playVideo", data); // Emit to all users, including sender
    });

});

server.listen(process.env.PORT || 3030, () => {
    console.log("Server is running on port", process.env.PORT || 3030);
});