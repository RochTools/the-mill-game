// ===== Mill Game: Taunts + Creepy/Ghost Effects (DO NOT TOUCH CASUALLY) =====

        const creepyMessages = [];

        
        const tauntMessages = [
            { text: "Let me show you 🤬", emoji: "😤" },
            { text: "Watch yourself 😏", emoji: "😈" },
            { text: "Is that all you have? 💀", emoji: "💀" },
            { text: "Ouch! That must have hurt 😂", emoji: "😂" },
            { text: "This is just the beginning 🔥", emoji: "🔥" },
            { text: "Let me win 😜", emoji: "😜" },
            { text: "Be quiet, you loser 🤣", emoji: "🤣" },
            { text: "You asked for trouble 👀", emoji: "👀" },
            { text: "More is coming 😤", emoji: "⚡" },
            { text: "You won’t survive 🏆", emoji: "🏆" },
            { text: "Got that one in 😌", emoji: "😌" },
            { text: "Think about what happens next 🤔", emoji: "🤔" }
        ];

        let lastTauntId = null; 

        
        function buildTauntButtons() {
            const container = document.getElementById('tauntButtons');
            container.innerHTML = '';
            tauntMessages.forEach((t, i) => {
                const btn = document.createElement('button');
                btn.className = 'taunt-btn';
                btn.innerHTML = `${t.emoji}<br>${t.text}`;
                btn.onclick = () => sendTaunt(i);
                container.appendChild(btn);
            });
        }

        
        function showTauntPopup() {
            if (!isOnlineMode) return;
            document.getElementById('tauntPopup').classList.add('visible');
        }

        function closeTauntPopup() {
            document.getElementById('tauntPopup').classList.remove('visible');
        }

        
        function sendTaunt(index) {
            if (!gameRef) return;
            closeTauntPopup();

            gameRef.update({
                taunt: {
                    from: playerNumber,
                    index: index,
                    id: Date.now() 
                }
            });
        }

        
        function showIncomingTaunt(tauntData) {
            if (!tauntData || tauntData.from === playerNumber) return;
            if (tauntData.id === lastTauntId) return; 
            lastTauntId = tauntData.id;

            const msg = tauntMessages[tauntData.index];
            if (!msg) return;

            const senderName = opponentName || 'The other player';
            document.getElementById('tauntSender').textContent = `${senderName} said:`;
            document.getElementById('tauntText').textContent = `${msg.emoji} ${msg.text}`;

            const balloon = document.getElementById('tauntBalloon');
            balloon.classList.remove('visible');
            void balloon.offsetWidth; 
            balloon.classList.add('visible');

            
            setTimeout(() => {
                balloon.classList.remove('visible');
            }, 6000);
        }

        let creepyTimers = [];
        let ghostEyesTimeout = null;

        
        function spawnGhostEyes() {
            if (phase === 'gameover') return;
            const eyes = document.getElementById('ghostEyes');
            
            const side = Math.floor(Math.random() * 4); 
            let top, left;
            if (side === 0) { top = '5%';  left = Math.random()*70+10 + '%'; }
            else if (side === 1) { top = Math.random()*70+10 + '%'; left = '88%'; }
            else if (side === 2) { top = '85%'; left = Math.random()*70+10 + '%'; }
            else { top = Math.random()*70+10 + '%'; left = '5%'; }

            eyes.style.top = top;
            eyes.style.left = left;
            eyes.classList.add('visible');

            
            ghostEyesTimeout = setTimeout(() => {
                eyes.classList.remove('visible');
                
                scheduleGhostEyes();
            }, 2000);
        }

        function scheduleGhostEyes() {
            if (phase === 'gameover') return;
            
            const delay = (Math.random() * 7 + 5) * 1000;
            ghostEyesTimeout = setTimeout(spawnGhostEyes, delay);
        }

        
        function showBloodSplatter(pos) {
            const point = document.querySelector(`[data-pos="${pos}"]`);
            if (!point) return;

            const rect = point.getBoundingClientRect();
            
            const splatter = document.createElement('div');
            splatter.className = 'blood-splatter';
            splatter.textContent = '😭';
            splatter.style.left = (rect.left + rect.width/2 - 15) + 'px';
            splatter.style.top = (rect.top - 10) + 'px';
            document.body.appendChild(splatter);
            setTimeout(() => splatter.remove(), 1400);
        }

        
        function darkFlash(duration = 200) {
            
            
            
        }

        
        function boardFlicker() {
            
            
            
        }

        
        function showCreepyMessage(msg) {
            
            
            
            
            
            
            
            
            
            
        }

        
        function scheduleCreepyMessage() {
            
            
            
            
            
            
            
            
            
        }

        
        function creepyLoserSequence() {
            
            const loserModal = document.getElementById('loserModal');
            loserModal.classList.add('creepy-active');
        }

        
        const emojiList = [
            { emoji: '🤣', text: 'How was that, buddy' },
            { emoji: '🤬', text: 'You are going to lose your mind' },
            { emoji: '😭', text: 'Don’t do that, my friend' },
            { emoji: '😜', text: 'Now talk, kid' },
            { emoji: '😆', text: 'Did you enjoy that?' },
            { emoji: '😂', text: 'How did you like my joke' },
            { emoji: '😲', text: 'Wow' },
            { emoji: '🥴', text: 'That hurt' },
            { emoji: '😤', text: 'I won’t let you off now' },
            { emoji: '😎', text: 'The party has only just started' },
            { emoji: '😡', text: 'I’ll knock the swagger out of you' },
            { emoji: '🫡', text: 'Salute, boss' },
            { emoji: '😍', text: 'Well done' },
            { emoji: '💀', text: 'I’m dead 💀' },
            { emoji: '🔥', text: 'You set it on fire' },
            { emoji: '👀', text: 'What are you looking at' },
            { emoji: '😏', text: 'Now watch' },
            { emoji: '🤣', text: 'Can’t stop laughing' },
            { emoji: '😌', text: 'Feels so good' },
            { emoji: '🤔', text: 'Lost in thought' },
            { emoji: '😈', text: 'I’ll become a devil' },
            { emoji: '💪', text: 'I’ll show my power' },
            { emoji: '👏', text: 'Bravo' },
            { emoji: '🙌', text: 'Congratulations' },
            { emoji: '🤩', text: 'You nailed it' },
            { emoji: '😘', text: 'Love' },
            { emoji: '👍', text: 'Excellent' },
            { emoji: '👎', text: 'Useless' },
            { emoji: '❤️', text: 'From the heart' },
            { emoji: '💯', text: 'One hundred percent' },
            { emoji: '⚡', text: 'Lightning strike' },
            { emoji: '🎉', text: 'Let’s celebrate' }
        ];

        let lastEmojiId = null; 

        function buildEmojiGrid() {
            const grid = document.getElementById('emojiGrid');
            grid.innerHTML = '';
            emojiList.forEach((item, i) => {
                const btn = document.createElement('button');
                btn.className = 'emoji-btn';
                btn.textContent = item.emoji;
                btn.onclick = () => sendEmoji(i);
                grid.appendChild(btn);
            });
        }

        function toggleEmojiPanel() {
            if (!isOnlineMode) {
                showNotification('Use in an online game', 'error');
                playSound('error');
                return;
            }
            const panel = document.getElementById('emojiPanel');
            panel.classList.toggle('visible');
            playSound('click');
        }

        function sendEmoji(index) {
            if (!gameRef) return;
            document.getElementById('emojiPanel').classList.remove('visible');
            playSound('click');

            gameRef.update({
                emoji: {
                    from: playerNumber,
                    index: index,
                    id: Date.now()
                }
            });
        }

        
        function showIncomingEmoji(emojiData) {
            if (!emojiData || emojiData.from === playerNumber) return;
            if (emojiData.id === lastEmojiId) return;
            lastEmojiId = emojiData.id;

            const item = emojiList[emojiData.index];
            if (!item) return;

            const senderName = opponentName || 'The other player';

            
            document.getElementById('tauntSender').textContent = `${senderName}:`;
            document.getElementById('tauntText').textContent = `${item.emoji} ${item.text}`;

            const balloon = document.getElementById('tauntBalloon');
            balloon.classList.remove('visible');
            void balloon.offsetWidth;
            balloon.classList.add('visible');

            setTimeout(() => {
                balloon.classList.remove('visible');
            }, 3000);
        }

        
        function startCreepySystem() {
            scheduleGhostEyes(); 
            
            buildTauntButtons(); 
            buildEmojiGrid();    
        }

