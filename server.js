const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));

const participants = [
    "Yared",
    "Belayneh",
    "Birhan",
    "Hailu",
    "Temesgen"
];

// Current Ekub state
let remainingPlayers = [...participants];
let history = [];
let spinning = false;
let lastWinner = null;

// Connected users
const users = new Map();

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // Send current state to newly connected user
    socket.emit("state", {
        participants,
        remainingPlayers,
        history,
        spinning,
        lastWinner,
        users: Array.from(users.values())
    });

    // User joins with a participant name
    socket.on("join", (name) => {

        if (!participants.includes(name)) {
            socket.emit("errorMessage", "Invalid participant name.");
            return;
        }

        users.set(socket.id, {
            id: socket.id,
            name
        });

        io.emit("users", Array.from(users.values()));

        console.log(`${name} joined`);
    });

    // Spin request
    socket.on("spin", () => {

        if (spinning) {
            return;
        }

        if (remainingPlayers.length === 0) {
            socket.emit(
                "errorMessage",
                "This Ekub cycle is complete. Start a new cycle."
            );
            return;
        }

        spinning = true;

        // Tell everybody that spinning has started
        io.emit("spinStarted");

        // Random winner
        const winnerIndex = Math.floor(
            Math.random() * remainingPlayers.length
        );

        const winner = remainingPlayers[winnerIndex];

        // Wait for animation to finish
        setTimeout(() => {

            remainingPlayers.splice(winnerIndex, 1);

            lastWinner = winner;

            history.push({
                round: history.length + 1,
                winner,
                time: new Date().toISOString()
            });

            spinning = false;

            // Send result to everybody
            io.emit("spinResult", {
                winner,
                winnerIndex,
                remainingPlayers,
                history
            });

        }, 4500);
    });

    // Reset Ekub
    socket.on("reset", () => {

        remainingPlayers = [...participants];
        history = [];
        spinning = false;
        lastWinner = null;

        io.emit("resetComplete", {
            remainingPlayers,
            history
        });

    });

    socket.on("disconnect", () => {

        const user = users.get(socket.id);

        if (user) {
            console.log(`${user.name} disconnected`);
        }

        users.delete(socket.id);

        io.emit("users", Array.from(users.values()));

    });

});

server.listen(PORT, () => {
    console.log(`Ekub server running on port ${PORT}`);
});
