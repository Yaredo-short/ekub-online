const socket = io();

const canvas =
    document.getElementById("wheel");

const ctx =
    canvas.getContext("2d");

const joinBox =
    document.getElementById("joinBox");

const app =
    document.getElementById("app");

const nameSelect =
    document.getElementById("nameSelect");

const joinButton =
    document.getElementById("joinButton");

const joinError =
    document.getElementById("joinError");

const currentUser =
    document.getElementById("currentUser");

const spinButton =
    document.getElementById("spinButton");

const resetButton =
    document.getElementById("resetButton");

const resultText =
    document.getElementById("resultText");

const playersDiv =
    document.getElementById("players");

const historyDiv =
    document.getElementById("history");

const onlineUsers =
    document.getElementById("onlineUsers");

let remainingPlayers = [
    "Yared",
    "Belayneh",
    "Birhan",
    "Hailu",
    "Temesgen"
];

let history = [];

let rotation = 0;

let spinning = false;

const colors = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#a855f7"
];

const center = 250;
const radius = 235;

joinButton.addEventListener(
    "click",
    () => {

        const name =
            nameSelect.value;

        if (!name) {

            joinError.textContent =
                "Please select your name.";

            return;
        }

        socket.emit("join", name);

        currentUser.textContent =
            name;

        joinBox.classList.add(
            "hidden"
        );

        app.classList.remove(
            "hidden"
        );

        drawWheel();
        updatePlayers();
    }
);

socket.on(
    "state",
    (state) => {

        remainingPlayers =
            state.remainingPlayers;

        history =
            state.history;

        spinning =
            state.spinning;

        updatePlayers();
        updateHistory();
        drawWheel();
    }
);

socket.on(
    "spinStarted",
    () => {

        spinning = true;

        spinButton.disabled =
            true;

        resultText.textContent =
            "Spinning... 🎡";

        animateWheel();
    }
);

socket.on(
    "spinResult",
    (data) => {

        spinning = false;

        remainingPlayers =
            data.remainingPlayers;

        history =
            data.history;

        resultText.textContent =
            `🎉 ${data.winner} is selected!`;

        updatePlayers();
        updateHistory();

        drawWheel();

        if (
            remainingPlayers.length === 0
        ) {

            spinButton.disabled =
                true;

            resultText.textContent =
                `🎉 ${data.winner} is selected! All 5 rounds are complete!`;

        } else {

            spinButton.disabled =
                false;
        }
    }
);

socket.on(
    "resetComplete",
    (data) => {

        remainingPlayers =
            data.remainingPlayers;

        history =
            data.history;

        spinning = false;

        rotation = 0;

        resultText.textContent =
            "Ready to spin!";

        spinButton.disabled =
            false;

        updatePlayers();
        updateHistory();
        drawWheel();
    }
);

socket.on(
    "errorMessage",
    (message) => {

        joinError.textContent =
            message;

        resultText.textContent =
            message;
    }
);

socket.on(
    "users",
    (users) => {

        onlineUsers.textContent =
            users.length;
    }
);

spinButton.addEventListener(
    "click",
    () => {

        if (spinning) return;

        socket.emit("spin");
    }
);

resetButton.addEventListener(
    "click",
    () => {

        if (
            confirm(
                "Start a new Ekub cycle?"
            )
        ) {

            socket.emit("reset");
        }
    }
);

function drawWheel() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (
        remainingPlayers.length === 0
    ) {

        ctx.beginPath();

        ctx.arc(
            center,
            center,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#16a34a";

        ctx.fill();

        ctx.fillStyle =
            "white";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            "bold 28px Arial";

        ctx.fillText(
            "ROUND COMPLETE",
            center,
            center
        );

        return;
    }

    const slice =
        (Math.PI * 2) /
        remainingPlayers.length;

    remainingPlayers.forEach(
        (name, index) => {

            const start =
                index * slice +
                rotation;

            const end =
                start + slice;

            ctx.beginPath();

            ctx.moveTo(
                center,
                center
            );

            ctx.arc(
                center,
                center,
                radius,
                start,
                end
            );

            ctx.closePath();

            ctx.fillStyle =
                colors[
                    index %
                    colors.length
                ];

            ctx.fill();

            ctx.strokeStyle =
                "white";

            ctx.lineWidth = 4;

            ctx.stroke();

            ctx.save();

            ctx.translate(
                center,
                center
            );

            ctx.rotate(
                start +
                slice / 2
            );

            ctx.textAlign =
                "right";

            ctx.textBaseline =
                "middle";

            ctx.fillStyle =
                "white";

            ctx.font =
                "bold 23px Arial";

            ctx.shadowColor =
                "rgba(0,0,0,0.5)";

            ctx.shadowBlur = 4;

            ctx.fillText(
                name,
                radius - 25,
                0
            );

            ctx.restore();
        }
    );

    // Center circle

    ctx.beginPath();

    ctx.arc(
        center,
        center,
        45,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#111827";

    ctx.fill();

    ctx.strokeStyle =
        "#fbbf24";

    ctx.lineWidth = 6;

    ctx.stroke();

    ctx.fillStyle =
        "#fbbf24";

    ctx.font =
        "bold 16px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "EKUB",
        center,
        center
    );
}

function animateWheel() {

    const start =
        rotation;

    const duration =
        4300;

    const extraRotation =
        Math.PI *
        2 *
        7;

    const target =
        start +
        extraRotation;

    const startTime =
        performance.now();

    function frame(now) {

        const elapsed =
            now - startTime;

        let progress =
            elapsed / duration;

        if (progress > 1) {
            progress = 1;
        }

        const ease =
            1 -
            Math.pow(
                1 - progress,
                4
            );

        rotation =
            start +
            (target - start) *
            ease;

        drawWheel();

        if (progress < 1) {

            requestAnimationFrame(
                frame
            );

        } else {

            rotation =
                rotation %
                (Math.PI * 2);

            drawWheel();
        }
    }

    requestAnimationFrame(frame);
}

function updatePlayers() {

    playersDiv.innerHTML = "";

    const allPlayers = [
        "Yared",
        "Belayneh",
        "Birhan",
        "Hailu",
        "Temesgen"
    ];

    allPlayers.forEach(
        (name) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "player";

            div.textContent =
                name;

            if (
                !remainingPlayers.includes(
                    name
                )
            ) {

                div.classList.add(
                    "selected"
                );
            }

            playersDiv.appendChild(
                div
            );
        }
    );
}

function updateHistory() {

    if (history.length === 0) {

        historyDiv.textContent =
            "No spins yet.";

        return;
    }

    historyDiv.innerHTML = "";

    history.forEach(
        (item) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "history-item";

            div.textContent =
                `Round ${item.round}: ${item.winner}`;

            historyDiv.appendChild(
                div
            );
        }
    );
}
