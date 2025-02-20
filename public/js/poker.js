document.addEventListener("DOMContentLoaded", function () {
    const socket = io();
    const joinBtn = document.getElementById("joinBtn");
    const usernameInput = document.getElementById("username");
    const usersList = document.getElementById("usersList");
    const loginSection = document.getElementById("loginSection");
    const gameSection = document.getElementById("gameSection");
    const cardSection = document.getElementById("cardSection");
    const startVotingContainer = document.getElementById("startVoting");

    let selectedCard = null;
    let selectedValue = null;
    let currentUser = null;

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
        socket.emit("reconnectUser", storedUsername);
        loginSection.classList.add("d-none");
        gameSection.classList.remove("d-none");
        cardSection.classList.remove("d-none");
        document.getElementById("navbar").classList.remove("d-none");
        document.getElementById("navUsername").innerText = storedUsername;
        currentUser = storedUsername;
    }

    document.getElementById("logoutBtn").addEventListener("click", function () {
        localStorage.removeItem("username");
        document.getElementById("navbar").classList.add("d-none");
        loginSection.classList.remove("d-none");
        gameSection.classList.add("d-none");
        cardSection.classList.add("d-none");
        socket.emit("disconnect");
    });

    startVotingContainer.innerHTML = `<div class="pick-text">Pick your cards!</div>`;

    function updateUserList(users) {
        usersList.innerHTML = "";
        users.forEach(user => {
            const userDiv = document.createElement("div");
            userDiv.classList.add("users-container-card");
            userDiv.innerHTML = `<div class="card-name">${user.username} - <span class="user-vote">?</span></div>`;
            usersList.appendChild(userDiv);
        });
    }

    socket.on("usernameTaken", (username) => {
        alert(`The username "${username}" is already taken. Please choose another.`);
        usernameInput.value = "";
    });

    joinBtn.addEventListener("click", function (event) {
        event.preventDefault();
        const username = usernameInput.value.trim();
        if (username !== "") {
            currentUser = username;
            localStorage.setItem("username", username);
            socket.emit("join", username);
            loginSection.classList.add("d-none");
            gameSection.classList.remove("d-none");
            cardSection.classList.remove("d-none");
            document.getElementById("navbar").classList.remove("d-none");
            document.getElementById("navUsername").innerText = username;
        } else {
            alert("Please enter your name to join.");
        }
    });

    function vote(value, cardElement) {
        if (selectedCard === cardElement) {
            selectedCard.classList.remove("selected");
            selectedCard = null;
            selectedValue = null;
            startVotingContainer.innerHTML = `<div class="pick-text">Pick your cards!</div>`;
            socket.emit("vote", "?");
            return;
        }
        if (selectedCard) {
            selectedCard.classList.remove("selected");
        }
        selectedCard = cardElement;
        selectedValue = value;
        selectedCard.classList.add("selected");
        socket.emit("vote", value);

        startVotingContainer.innerHTML = `<button id="startVoting-id" class="btn btn-primary start-voting-btn">Reveal cards</button>`;
        document.getElementById("startVoting-id").addEventListener("click", function () {
            socket.emit("reveal");
        });
    }

    socket.on("revealVotes", (users) => {
        document.querySelectorAll(".user-vote").forEach((vote) => {
            vote.innerText = "⌛";
        });
        setTimeout(() => {
            let total = 0;
            let count = 0;

            document.querySelectorAll(".user-vote").forEach((vote, index) => {
                if (users[index] && !isNaN(users[index].vote)) {
                    vote.innerText = users[index].vote;
                    total += Number(users[index].vote);
                    count++;
                } else {
                    vote.innerText = "?";
                }
            });

            let average = count > 0 ? (total / count).toFixed(2) : "N/A";
            displayAverage(average);
    
            startVotingContainer.innerHTML = `<button id="startNewVoting" class="btn btn-primary start-voting-btn">Start New Voting</button>`;
            document.getElementById("startNewVoting").addEventListener("click", function () {
                clearAll();
            });
        }, 1000);
    });

    function displayAverage(avg) {
        let avgContainer = document.getElementById("averageContainer");
        if (!avgContainer) {
            avgContainer = document.createElement("div");
            avgContainer.id = "averageContainer";
            avgContainer.style.position = "absolute";
            avgContainer.style.bottom = "60px";
            avgContainer.style.left = "10px";
            avgContainer.style.padding = "10px";
            avgContainer.style.border = "2px solid #000";
            avgContainer.style.background = "#fff";
            avgContainer.style.borderRadius = "8px";
            avgContainer.style.fontWeight = "bold";
            document.body.appendChild(avgContainer);
        }
        avgContainer.innerHTML = `Average Vote: <b>${avg}</b>`;
        avgContainer.style.display = "block";
    }

    socket.on("errorMessage", (message) => {
        alert(message);
    });

    socket.on("updateUsers", (users) => {
        updateUserList(users);
    });

    let resetCooldown = false;
    function clearAll() {
        if (resetCooldown) return;
    
        resetCooldown = true;
        setTimeout(() => (resetCooldown = false), 5000);
    
        socket.emit("reset");
    }    

    socket.on("resetUI", () => {
        selectedCard?.classList.remove("selected");
        selectedCard = null;
        selectedValue = null;

        document.querySelectorAll(".user-vote").forEach(vote => vote.innerText = "?");
        startVotingContainer.innerHTML = `<div class="pick-text">Pick your cards!</div>`;
        
        let avgContainer = document.getElementById("averageContainer");
        if (avgContainer) {
            avgContainer.innerHTML = "Average Vote: <b>N/A</b>";
            avgContainer.style.display = "none";
        }
    });

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", function () {
            let value = this.innerText.trim();
            if (value === "") value = "Caffe";
            vote(value, this);
        });
    });

    socket.on("disconnect", () => {
        localStorage.removeItem("username");
        window.location.reload();
    });
});
