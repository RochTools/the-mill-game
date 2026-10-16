// ===== Mill Game: Sound, History Stats, Notifications, Menu =====

        let gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || {
            player1Wins: 0,
            player2Wins: 0,
            totalGames: 0
        };
        
        
        const audio = {
            place: new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/Place.Click .mp3'),
            move:  new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/whoosh.mp3'),
            remove: new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/Remove.mp3'),
            mill:  new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/Mill.mp3'),
            win:   new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/Win.mp3'),
            error: new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/error.mp3'),
            click: new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/Place.Click .mp3'),
            notification: new Audio('https://balochzameer409-oss.github.io/The-Mill-Game-online-pwa/sounds/notification.mp3')
        };

        let soundEnabled = true;

        function updateHistoryDisplay() {
            document.getElementById('p1-wins').textContent = gameHistory.player1Wins;
            document.getElementById('p2-wins').textContent = gameHistory.player2Wins;
            document.getElementById('total-games').textContent = gameHistory.totalGames;
        }

        function resetAllStats() {
            if (confirm('Reset all statistics?')) {
                gameHistory = {
                    player1Wins: 0,
                    player2Wins: 0,
                    totalGames: 0
                };
                localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
                updateHistoryDisplay();
                showNotification('Statistics have been reset!', 'success');
                playSound('click');
                closeMenu();
            }
        }

        function saveGameResult(winner) {
            if (winner === 1) {
                gameHistory.player1Wins++;
            } else {
                gameHistory.player2Wins++;
            }
            gameHistory.totalGames++;
            localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
            updateHistoryDisplay();
        }
        
        function playSound(soundName) {
            if (!soundEnabled) return;
            try {
                const sound = audio[soundName];
                if (sound) {
                    sound.currentTime = 0;
                    sound.play();
                }
            } catch (e) {
                console.log("Problem playing sound:", e);
            }
        }

        function toggleSound() {
            soundEnabled = !soundEnabled;
            updateSoundUI();
            closeMenu(); 
            if (soundEnabled) {
                showNotification('Sound on ✅', 'success');
                playSound('click');
            } else {
                showNotification('Sound off 🔇', 'warning');
            }
        }
        
        function updateSoundUI() {
            const icon = document.getElementById('menuSoundIcon');
            const btn = document.getElementById('menuSoundBtn');
            if (soundEnabled) {
                icon.className = 'fas fa-volume-up';
                btn.innerHTML = '<i class="fas fa-volume-up" id="menuSoundIcon"></i>&nbsp; Sound On';
                btn.classList.remove('muted');
            } else {
                icon.className = 'fas fa-volume-mute';
                btn.innerHTML = '<i class="fas fa-volume-mute" id="menuSoundIcon"></i>&nbsp; Sound Off';
                btn.classList.add('muted');
            }
        }

        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }

        function openMenu() {
            playSound('click');
            document.getElementById('menuOverlay').style.display = 'flex';
        }

        function closeMenu() {
            playSound('click');
            document.getElementById('menuOverlay').style.display = 'none';
        }

        function showRules() {
            playSound('click');
            alert('Rules:\n\n1. Each player has 9 pieces\n2. First, place all pieces on the board\n3. Three pieces in a row = MILL (remove one of the opponent’s pieces)\n4. The opponent wins when they are down to 2 pieces\n5. When you have only 3 pieces left, you can move to any empty spot');
        }
