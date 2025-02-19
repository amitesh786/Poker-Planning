const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

let users = {};
let hostId = null;

io.on("connection", (socket) => {
    socket.on("join", (username) => {
        if (!Object.values(users).some(user => user.username === username)) {
            users[socket.id] = { username, vote: "?" };

            if (!hostId) {
                hostId = socket.id;
            }

            io.emit("updateUsers", Object.values(users));
        } else {
            socket.emit("usernameTaken", username);
        }
    });

    socket.on("vote", (vote) => {
        if (users[socket.id]) {
            users[socket.id].vote = vote;
            io.emit("updateUsers", Object.values(users));
        }
    });

    socket.on("reveal", () => {
        if (socket.id === hostId) {
            io.emit("revealVotes", Object.values(users));
        } else {
            socket.emit("errorMessage", "Only the game host can reveal cards!");
        }
    });

    socket.on("reset", () => {
        Object.keys(users).forEach((id) => (users[id].vote = "?"));
        io.emit("updateUsers", Object.values(users));
    });

    socket.on("disconnect", () => {
        delete users[socket.id];

        if (socket.id === hostId) {
            hostId = Object.keys(users)[0] || null;
        }

        io.emit("updateUsers", Object.values(users));
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
