// ===== Mill Game: Firebase Online Multiplayer =====

     const firebaseConfig = {
    apiKey: "AIzaSyCWHbfqbNI1rt09OLo2Nw3IufgQG5MU6vM",
    authDomain: "mill-game-online.firebaseapp.com",
    databaseURL: "https://mill-game-online-default-rtdb.firebaseio.com",
    projectId: "mill-game-online",
    storageBucket: "mill-game-online.firebasestorage.app",
    messagingSenderId: "187128179484",
    appId: "1:187128179484:web:7bbe1c553fd43ab634e8d9",
    measurementId: "G-SQEQE6N44S"
};

let database = null;
let currentUser = null;
let isFirebaseReady = false;

function initFirebase() {
    
    if (!window.gameAuth || !window.gameAuth.isAuthorized()) {
        console.error('Not authorized to use Firebase');
        showError('Unauthorized Access');
        return;
    }
    
    
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    
    console.log('✅ Firebase initialized');
    
    
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            
            currentUser = user;
            isFirebaseReady = true;
            console.log('✅ User authenticated! UID:', user.uid);
            
            
            if (typeof showNotification === 'function') {
                showNotification('Online and ready! ✅', 'success');
            }
            
        } else {
            
            console.log('🔐 Signing in anonymously...');
            
            firebase.auth().signInAnonymously()
                .then(() => {
                    console.log('🔐 Anonymous login successful!');
                })
                .catch((error) => {
                    console.error('❌ Authentication error:', error);
                    if (typeof showNotification === 'function') {
                        showNotification('Sign-in problem: ' + error.message, 'error');
                    }
                    
                    setTimeout(() => {
                        firebase.auth().signInAnonymously();
                    }, 3000);
                });
        }
    });
}

window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.gameAuth && window.gameAuth.isAuthorized()) {
            initFirebase();
        }
    }, 1500);
});

        function createGame() {
            const name = document.getElementById('playerName').value.trim();
            if (!name) {
                showNotification('Please enter your name', 'error');
                return;
            }

            playerName = name;
            gameRoomId = generateGameCode();
            isOnlineMode = true;
            playerNumber = 1;

            // Show loading
            const btn = document.querySelector('button[onclick="createGame()"]');
            if (btn) { btn.disabled = true; btn.innerHTML = '<span style="display:inline-flex;gap:4px;align-items:center"><span class="dot-anim">●</span><span class="dot-anim" style="animation-delay:.2s">●</span><span class="dot-anim" style="animation-delay:.4s">●</span></span>'; }

            gameRef = database.ref('games/' + gameRoomId);
            
            gameRef.set({
                player1: {
                    name: playerName,
                    connected: true
                },
                player2: null,
                board: board,
                currentPlayer: 1,
                phase: 'placing',
                piecesLeft: {1: 9, 2: 9},
                removingMode: false,
                voiceSignal: null, 
                createdAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                if (btn) { btn.disabled = false; btn.innerHTML = 'Create New Game'; }
                document.getElementById('lobbyOptions').style.display = 'none';
                document.getElementById('createGameScreen').style.display = 'block';
                document.getElementById('gameCode').textContent = gameRoomId;

                listenToGameChanges();
                showNotification('Game created! You are Player 1', 'success');
                playSound('click');
            }).catch(() => {
                if (btn) { btn.disabled = false; btn.innerHTML = 'Create New Game'; }
                showNotification('Something went wrong, please try again', 'error');
            });
        }

        function generateGameCode() {
            return Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        function copyGameCode() {
            const code = document.getElementById('gameCode').textContent;
            navigator.clipboard.writeText(code);
            showNotification('Code copied!', 'success');
            playSound('click');
        }

        function showJoinOptions() {
            document.getElementById('lobbyOptions').style.display = 'none';
            document.getElementById('joinGameScreen').style.display = 'block';
            playSound('click');
        }
function joinGame() {
    const name = document.getElementById('playerName').value.trim();
    const code = document.getElementById('gameCodeInput').value.trim().toUpperCase();
    
    if (!name) {
        showNotification('Please enter your name', 'error');
        playSound('error');
        return;
    }
    
    if (!code || code.length !== 6) {
        showNotification('Please enter a valid game code', 'error');
        playSound('error');
        return;
    }
    
    // Show loading
    const btn = document.querySelector('button[onclick="joinGame()"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span style="display:inline-flex;gap:4px;align-items:center"><span class="dot-anim">●</span><span class="dot-anim" style="animation-delay:.2s">●</span><span class="dot-anim" style="animation-delay:.4s">●</span></span>'; }

    const resetBtn = () => { if (btn) { btn.disabled = false; btn.innerHTML = 'Join'; } };

    playerName = name;
    gameRoomId = code;
    isOnlineMode = true;
    
    gameRef = database.ref('games/' + gameRoomId);
    
    gameRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            showNotification('This game does not exist', 'error');
            playSound('error');
            playerNumber = null;
            isOnlineMode = false;
            resetBtn();
            return;
        }
        
        const gameData = snapshot.val();

        // Is the Player 2 slot empty?
        if (!gameData.player2) {
            playerNumber = 2;
            gameRef.update({
                'player2': { name: playerName, connected: true },
                'voiceSignal': null
            }).then(() => {
                resetBtn();
                document.getElementById('lobbyModal').style.display = 'none';
                listenToGameChanges();
                onOnlineGameStart();
                showNotification('Game started! You are a player ⚔️', 'success');
                playSound('click');
            });
            return;
        }

        // Both slots are taken - become a spectator 🦥
        isSpectator = true;
        playerNumber = null;

        const specId = 'spec_' + Date.now();
        spectatorId = specId;

        gameRef.child('spectators/' + specId).set({
            name: playerName,
            joined: Date.now()
        }).then(() => {
            resetBtn();
            document.getElementById('lobbyModal').style.display = 'none';
            listenToGameChanges();
            setupChatListener();
            document.getElementById('chatToggleBtn').style.display = 'flex';
            showSpectatorUI();
            showNotification('You are a spectator 🦥 sit back and watch!', 'info');
            playSound('click');
        });
    });
}
        
      function playOffline() {
    isOnlineMode = false;
    document.getElementById('lobbyModal').style.display = 'none';
    
    document.getElementById('voiceControls').style.display = 'none';
    
    showNotification('Offline mode started', 'info');
    playSound('click');
}


        function backToLobby() {
            document.getElementById('joinGameScreen').style.display = 'none';
            document.getElementById('lobbyOptions').style.display = 'block';
            playSound('click');
        }

        function cancelGame() {
            if (gameRef) {
                gameRef.remove();
            }
            document.getElementById('lobbyModal').style.display = 'none';
            isOnlineMode = false;
            showNotification('Game cancelled', 'info');
            playSound('click');
        }

        function listenToGameChanges() {
            if (!gameRef) return;

            gameRef.on('value', snapshot => {
                const gameData = snapshot.val();
                if (!gameData) return;

                if (gameData.player2 && playerNumber === 1 && !onlineGameStarted) {
                    onlineGameStarted = true;
                    opponentName = gameData.player2.name;
                    document.getElementById('lobbyModal').style.display = 'none';
                    showNotification('The other player has joined!', 'success');
                    updateOnlineStatus();
                    onOnlineGameStart();
                    playSound('click');
                }

                if (gameData.player1 && playerNumber === 2) {
                    opponentName = gameData.player1.name;
                    updateOnlineStatus();
                }

                
                if (gameData.board) {
                    syncGameState(gameData);
                }

                // Update the spectators list for spectators
                if (isSpectator || playerNumber === 1 || playerNumber === 2) {
                    updateSpectatorList(gameData.spectators);
                }
            });
        }

        function showSpectatorUI() {
            showSpectatorToast();
        }

        function showSpectatorToast() {
            let toast = document.getElementById('spectatorToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'spectatorToast';
                toast.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#1a2a6c,#b21f1f);color:gold;font-size:15px;font-weight:bold;padding:10px 24px;border-radius:20px;border:2px solid gold;box-shadow:0 4px 15px rgba(0,0,0,0.5);text-align:center;transition:opacity 0.5s ease;white-space:nowrap;';
                toast.innerHTML = '🦥 You are a spectator - sit back and watch!';
                document.body.appendChild(toast);
            }
            toast.style.opacity = '1';
            toast.style.display = 'block';
            clearTimeout(window._specToastTimer);
            window._specToastTimer = setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => { toast.style.display = 'none'; }, 500);
            }, 3000);
        }

        function updateSpectatorList(spectators) {
            const eye = document.getElementById('spectatorEye');
            const countEl = document.getElementById('spectatorCount');
            if (!eye || !countEl) return;
            if (!spectators) {
                eye.style.display = 'none';
                return;
            }
            const count = Object.keys(spectators).length;
            if (count === 0) {
                eye.style.display = 'none';
            } else {
                eye.style.display = 'flex';
                eye.style.alignItems = 'center';
                countEl.textContent = count;
            }
        }

        function updateOnlineStatus() {
            if (!isOnlineMode) return;
            
            if (playerNumber === 1) {
                document.getElementById('p1-online').innerHTML = `<span class="online-status connected"></span>${playerName}`;
                document.getElementById('p2-online').innerHTML = opponentName ? 
                    `<span class="online-status connected"></span>${opponentName}` : '';
            } else {
                document.getElementById('p2-online').innerHTML = `<span class="online-status connected"></span>${playerName}`;
                document.getElementById('p1-online').innerHTML = opponentName ? 
                    `<span class="online-status connected"></span>${opponentName}` : '';
            }
        }

      function syncGameState(gameData) {
    console.log("📦 Data received from Firebase:", gameData);
    
    if (!gameData) {
        console.error("❌ gameData is missing!");
        return;
    }
    
    
    const isOpponentTurn = gameData.currentPlayer !== playerNumber;
    
    
    board = Array(24).fill(null);
    
    
    if (gameData.board) {
        const boardData = gameData.board;
        
        
        if (typeof boardData === 'object' && boardData !== null) {
            Object.keys(boardData).forEach(key => {
                const index = parseInt(key);
                if (!isNaN(index) && index >= 0 && index < 24) {
                    const value = boardData[key];
                    if (value !== null && value !== undefined) {
                        board[index] = value;
                    }
                }
            });
        } else if (Array.isArray(boardData)) {
            for (let i = 0; i < 24; i++) {
                if (boardData[i] !== null && boardData[i] !== undefined) {
                    board[i] = boardData[i];
                }
            }
        }
        
        console.log("✅ Converted to board array:", board);
    }
    
    
    currentPlayer = gameData.currentPlayer || 1;
    phase = gameData.phase || 'placing';
    piecesLeft = gameData.piecesLeft || { 1: 9, 2: 9 };
    removingMode = gameData.removingMode || false; 
    
    
    document.querySelectorAll('.piece').forEach(p => p.remove());
    
    
    for (let pos = 0; pos < 24; pos++) {
        if (board[pos] !== null && board[pos] !== undefined) {
            drawPiece(pos, board[pos]);
            console.log(`✅ Piece ${board[pos]} placed at position ${pos}`);
        }
    }
    
    
    clearRemovableHighlights();
    
    
    clearMovablePoints();
    document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
    
    if (gameData.selectedPos !== null && gameData.selectedPos !== undefined) {
        selectedPos = gameData.selectedPos;
        highlightPiece(selectedPos);
        highlightMovablePoints(selectedPos);
        console.log(`✅ Selected piece synced: ${selectedPos}`);
    } else {
        selectedPos = null;
    }
    
    
    if (removingMode && phase === 'removing') {
        highlightRemovablePieces(); 
        console.log('✅ Removable pieces highlighted for both players');
    }
    
    if (phase === 'gameover' && gameData.winner) {
        showCelebration(gameData.winner);
    }
    
    if (gameData.taunt) {
        showIncomingTaunt(gameData.taunt);
    }
    
    if (gameData.emoji) {
        showIncomingEmoji(gameData.emoji);
    }
    
    updateUI();
    updatePhaseIndicator();
    
    
    const wasMyTurn = currentPlayer === playerNumber;
    if (wasMyTurn && isOpponentTurn) {
        
        showNotification('✅ It is your turn', 'success');
        playSound('place');
    }
    
    console.log("🎮 Final board data:", board);
    console.log("🎮 currentPlayer:", currentPlayer);
    console.log("🎮 phase:", phase);
    console.log("🎮 removingMode:", removingMode); 
} 
function updateGameState() {
    if (!isOnlineMode || !gameRef) return;
    
    
    const boardObject = {};
    for (let i = 0; i < 24; i++) {
        if (board[i] !== null) {
            boardObject[i] = board[i];
        }
    }
    
    
    const gameStateData = {
        board: boardObject,
        currentPlayer: currentPlayer,
        phase: phase,
        piecesLeft: piecesLeft,
        removingMode: removingMode,
        selectedPos: selectedPos, 
        winner: gameWinner,
        lastUpdate: Date.now() 
    };
    
    
    gameRef.update(gameStateData).then(() => {
        console.log('✅ Game state updated successfully');
    }).catch((error) => {
        console.error('❌ Firebase update failed:', error);
        
        setTimeout(() => gameRef.update(gameStateData), 500);
    });
}
        
