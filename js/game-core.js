// ===== Mill Game: Board Logic (init, click handling, mill check, move, remove) =====

        function init() {
            
            const points = document.querySelectorAll('.point');
            points.forEach((point, index) => {
                point.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handlePointClick(index);
                });
            });

            updateUI();
            updatePhaseIndicator();
            updateSoundUI(); 
            updateHistoryDisplay(); 
            
            
            document.getElementById('lobbyModal').style.display = 'flex';
        }

        function handlePointClick(pos) {

    // Spectators cannot move 🦥
    if (isSpectator) {
        showSpectatorToast();
        return;
    }

    if (isOnlineMode) {
        if (currentPlayer !== playerNumber) {
            showNotification('It is not your turn - please wait', 'error');
            playSound('error');
            return;
        }
    }

    // AI mode: the human player can only move on player 1's turn
    if (isAIMode && currentPlayer === 2 && !aiExecuting) return;
    
    if (removingMode) {
        showNotification('Remove the opponent’s piece first!', 'error');
        playSound('error');
        return;
    }
    
    if (phase === 'placing') {
        if (board[pos] === null) {
            board[pos] = currentPlayer;
            drawPiece(pos, currentPlayer);
            piecesLeft[currentPlayer]--;
            playSound('place');
            
            if (checkMill(pos)) {
                removingMode = true;
                phase = 'removing';
                highlightRemovablePieces();
                playSound('mill');
                showNotification('Mill formed! Remove one of the opponent’s pieces', 'success');
                updatePhaseIndicator();
                // If the AI formed a mill, the AI removes the piece
                if (isAIMode && currentPlayer === 2) {
                    setTimeout(() => makeAIMove(), 900);
                }
            } else {
                if (piecesLeft[1] === 0 && piecesLeft[2] === 0) {
                    phase = 'moving';
                }
                switchPlayer();
            }
            
            updateUI();
            updateGameState(); 
        }
    } else if (phase === 'moving') {
        if (selectedPos === null) {
            showNotification('Select your own piece first', 'error');
            playSound('error');
            return;
        } else {
            const currentPlayerPieces = board.filter(p => p === currentPlayer).length;
            const canFly = currentPlayerPieces === 3;
            const isConnected = directConnections[selectedPos].includes(pos);
            
            if (board[pos] === null && (canFly || isConnected)) {
                board[pos] = currentPlayer;
                board[selectedPos] = null;
                movePiece(selectedPos, pos);
                playSound('move');
                
                clearMovablePoints();
                unhighlightPiece(selectedPos);
                selectedPos = null;
                
                if (checkMill(pos)) {
                    removingMode = true;
                    phase = 'removing';
                    highlightRemovablePieces();
                    playSound('mill');
                    showNotification('Mill formed! Remove one of the opponent’s pieces', 'success');
                    updatePhaseIndicator();
                    // If the AI formed a mill, the AI removes the piece
                    if (isAIMode && currentPlayer === 2) {
                        setTimeout(() => makeAIMove(), 900);
                    }
                } else {
                    switchPlayer();
                }
                
                updateGameState(); 
                updateUI();
            } else {
                showNotification('You can’t place a piece here', 'error');
                playSound('error');
            }
        }
    }
}
        function checkMill(pos) {
            const player = board[pos];
            if (player === null) return false;
            
            return mills.some(mill => 
                mill.includes(pos) && mill.every(p => board[p] === player)
            );
        }

        function isInMill(pos) {
            return checkMill(pos);
        }

        function drawPiece(pos, player) {
            const point = document.querySelector(`[data-pos="${pos}"]`);
            const piece = document.createElement('div');
            piece.className = `piece player${player}`;
            piece.dataset.pos = pos;
            piece.textContent = player === 1 ? '1' : '2';
            piece.style.left = point.style.left;
            piece.style.top = point.style.top;
            
            piece.onclick = (e) => {
                e.stopPropagation();
                handlePieceClick(pos);
            };
            
            document.querySelector('.board-inner').appendChild(piece);
        }

        
        function handlePieceClick(pos) {
            
            if (isOnlineMode && currentPlayer !== playerNumber) {
                showNotification('It’s not your turn', 'error');
                playSound('error');
                return;
            }

            // AI mode: the player can only move on their own turn
            if (isAIMode && currentPlayer === 2 && !aiExecuting) return;

            const clickedPiece = board[pos];
            
            
            if (removingMode && phase === 'removing') {
                const opponent = currentPlayer === 1 ? 2 : 1;
                
                
                if (clickedPiece === opponent) {
                    
                    const allOpponentInMills = board.reduce((positions, player, index) => {
                        if (player === opponent) positions.push(index);
                        return positions;
                    }, []).every(p => isInMill(p));
                    
                    if (allOpponentInMills || !isInMill(pos)) {
                        
                        board[pos] = null;
                        removePieceWithAnimation(pos);
                        playSound('remove');
                        
                        
                        if (isOnlineMode) {
                            showTauntPopup();
                        }
                        
                        clearRemovableHighlights();
                        removingMode = false;
                        
                        
                        const opponentPiecesLeft = board.filter(p => p === opponent).length;
                        console.log('🔍 Checking win: Opponent pieces =', opponentPiecesLeft, 'Pieces left[opponent] =', piecesLeft[opponent]);
                        
                        if (opponentPiecesLeft <= 2 && piecesLeft[opponent] === 0) {
                            phase = 'gameover';
                            gameWinner = currentPlayer;
                            
                            console.log('🏆 WINNER DETECTED! Player', currentPlayer, 'wins!');
                            
                            
                            updateUI();
                            updatePhaseIndicator();
                            updateGameState();
                            
                            
                            setTimeout(() => {
                                console.log('🎉 Calling showCelebration for player', currentPlayer);
                                showCelebration(currentPlayer);
                            }, 500);
                            
                            playSound('win');
                            
                            if (!isOnlineMode) {
                                saveGameResult(currentPlayer);
                            }
                            
                            return; 
                        } else {
                            
                            if (piecesLeft[1] === 0 && piecesLeft[2] === 0) {
                                phase = 'moving';
                            } else {
                                phase = 'placing';
                            }
                            switchPlayer();
                        }
                        
                        updateUI();
                        updatePhaseIndicator();
                        updateGameState(); 
                        return;
                    } else {
                        showNotification('This piece is in a mill, select another one', 'error');
                        playSound('error');
                        return;
                    }
                } else {
                    showNotification('Select the opponent’s piece', 'error');
                    playSound('error');
                    return;
                }
            }
            
            
            if (phase === 'moving' && clickedPiece === currentPlayer) {
                if (selectedPos === pos) {
                    
                    unhighlightPiece(pos);
                    clearMovablePoints();
                    selectedPos = null;
                    playSound('click');
                    updateGameState(); 
                } else {
                    
                    if (selectedPos !== null) {
                        unhighlightPiece(selectedPos);
                    }
                    clearMovablePoints();
                    selectedPos = pos;
                    highlightPiece(pos);
                    highlightMovablePoints(pos);
                    playSound('click');
                    updateGameState(); 
                }
            }
        }

        function movePiece(from, to) {
            const piece = document.querySelector(`.piece[data-pos="${from}"]`);
            const point = document.querySelector(`[data-pos="${to}"]`);
            piece.style.left = point.style.left;
            piece.style.top = point.style.top;
            piece.dataset.pos = to;
            
            piece.onclick = (e) => {
                e.stopPropagation();
                handlePieceClick(to);
            };
        }

        function removePieceWithAnimation(pos) {
            const piece = document.querySelector(`.piece[data-pos="${pos}"]`);
            if (piece) {
                showBloodSplatter(pos); 
                piece.style.transition = 'all 0.3s ease-in-out';
                piece.style.transform = 'translate(-50%, -50%) scale(0)';
                piece.style.opacity = '0';
                setTimeout(() => {
                    if (piece.parentNode) {
                        piece.parentNode.removeChild(piece);
                    }
                }, 300);
            }
        }

        function highlightMovablePoints(pos) {
            const connectedPoints = directConnections[pos] || [];
            const currentPlayerPieces = board.filter(p => p === currentPlayer).length;
            const canFly = currentPlayerPieces === 3;
            
            if (canFly) {
                for (let i = 0; i < 24; i++) {
                    if (board[i] === null) {
                        const pointElement = document.querySelector(`.point[data-pos="${i}"]`);
                        if (pointElement) {
                            pointElement.classList.add('movable-point');
                        }
                    }
                }
                showNotification('3 pieces left - flying mode! 🦅', 'info');
            } else {
                connectedPoints.forEach(point => {
                    if (board[point] === null) {
                        const pointElement = document.querySelector(`.point[data-pos="${point}"]`);
                        if (pointElement) {
                            pointElement.classList.add('movable-point');
                        }
                    }
                });
            }
        }

        function clearMovablePoints() {
            document.querySelectorAll('.point').forEach(point => {
                point.classList.remove('movable-point');
            });
        }

        function highlightRemovablePieces() {
            const opponent = currentPlayer === 1 ? 2 : 1;
            let opponentPieces = [];
            
            for (let i = 0; i < 24; i++) {
                if (board[i] === opponent) {
                    opponentPieces.push(i);
                }
            }
            
            const allInMills = opponentPieces.every(p => isInMill(p));
            
            opponentPieces.forEach(pos => {
                const piece = document.querySelector(`.piece[data-pos="${pos}"]`);
                if (piece) {
                    if (allInMills || !isInMill(pos)) {
                        piece.classList.add('removable');
                    }
                }
            });
        }

        function clearRemovableHighlights() {
            document.querySelectorAll('.piece').forEach(piece => {
                piece.classList.remove('removable');
                piece.classList.remove('selected');
            });
        }

        function highlightPiece(pos) {
            const piece = document.querySelector(`.piece[data-pos="${pos}"]`);
            if (piece) {
                piece.classList.add('selected');
            }
        }

        function unhighlightPiece(pos) {
            const piece = document.querySelector(`.piece[data-pos="${pos}"]`);
            if (piece) {
                piece.classList.remove('selected');
            }
        }

        // Check whether the player has any legal move
        function isPlayerBlocked(player) {
            const pieces = board.map((v, i) => v === player ? i : -1).filter(i => i >= 0);
            const pieceCount = pieces.length;
            
            // With 3 pieces (flying mode) a player can never be blocked
            if (pieceCount <= 3) return false;
            
            // For each piece, check whether there is an empty adjacent spot
            for (const pos of pieces) {
                const neighbors = directConnections[pos] || [];
                const hasEmpty = neighbors.some(n => board[n] === null);
                if (hasEmpty) return false;
            }
            return true; // No move available
        }

        function switchPlayer() {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updatePhaseIndicator();
            
            const currentPlayerPieces = board.filter(p => p === currentPlayer).length;
            if (phase === 'moving' && currentPlayerPieces === 3) {
                showNotification('3 pieces left - flying mode! 🦅', 'info');
            }

            // Blockade check - if the current player has no move, they lose
            if (phase === 'moving' && isPlayerBlocked(currentPlayer)) {
                phase = 'gameover';
                gameWinner = currentPlayer === 1 ? 2 : 1;
                updateUI();
                updatePhaseIndicator();
                updateGameState();
                showNotification(`Player ${currentPlayer}’s pieces are trapped! Player ${gameWinner} wins! 🏆`, 'success');
                setTimeout(() => showCelebration(gameWinner), 600);
                playSound('win');
                if (!isOnlineMode) saveGameResult(gameWinner);
                return;
            }

            // AI’s turn
            if (isAIMode && currentPlayer === 2 && phase !== 'gameover') {
                setTimeout(() => makeAIMove(), 700);
            }
        }

        function updatePhaseIndicator() {
            document.getElementById('player1-info').classList.remove('active');
            document.getElementById('player2-info').classList.remove('active');
            
            if (currentPlayer === 1) {
                document.getElementById('player1-info').classList.add('active');
            } else {
                document.getElementById('player2-info').classList.add('active');
            }
            
            let phaseText = '';
            if (phase === 'placing') {
                phaseText = 'Phase: Placing pieces';
            } else if (phase === 'moving') {
                const currentPlayerPieces = board.filter(p => p === currentPlayer).length;
                if (currentPlayerPieces === 3) {
                    phaseText = 'Phase: Flying mode 🦅';
                } else {
                    phaseText = 'Phase: Moving pieces';
                }
            } else if (phase === 'removing') {
                phaseText = 'Phase: Removing opponent’s piece';
            } else if (phase === 'gameover') {
                phaseText = 'Game over';
            }
            
            document.getElementById('phaseIndicator').textContent = phaseText;
        }

        function updateUI() {
            document.getElementById('p1-count').textContent = piecesLeft[1];
            document.getElementById('p2-count').textContent = piecesLeft[2];
        }

        function showCelebration(winner) {
            console.log('🎉 showCelebration called with winner:', winner);
            
            const modal = document.getElementById('celebrationModal');
            const message = document.getElementById('winnerMessage');
            const loserModal = document.getElementById('loserModal');
            const loserMessage = document.getElementById('loserMessage');
            const loserSubMessage = document.getElementById('loserSubMessage');
            const emoji = document.querySelector('.celebration-emoji');

            if (isOnlineMode) {
                if (winner === playerNumber) {
                    
                    message.textContent = `Congratulations! You won!`;
                    emoji.textContent = '🏆';
                    modal.style.display = 'flex';
                    createConfetti();
                    playSound('win');
                    console.log('✅ Winner modal displayed (online mode)');
                } else {
                    
                    loserMessage.textContent = `You lost!`;
                    loserSubMessage.textContent = `${opponentName} defeated you 💀`;
                    playSound('error');

                    
                    loserModal.style.display = 'flex';
                    console.log('✅ Loser modal displayed (online mode)');
                }
            } else {
                
                message.textContent = `Player ${winner} wins!`;
                emoji.textContent = '🏆';
                modal.style.display = 'flex';
                createConfetti();
                playSound('win');
                console.log('✅ Winner modal displayed (offline mode)');
            }
        }

        function closeLoser() {
            const loserModal = document.getElementById('loserModal');
            loserModal.style.display = 'none';
            loserModal.classList.remove('creepy-active');
            playSound('click');
        }

        function createConfetti() {
            const celebrationContent = document.querySelector('.celebration-content');
            
            if (!celebrationContent) {
                console.error('❌ celebration-content element not found!');
                return;
            }
            
            console.log('🎊 Creating confetti...');
            const colors = ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3'];
            
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = Math.random() * 3 + 's';
                    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                    celebrationContent.appendChild(confetti);
                    
                    setTimeout(() => confetti.remove(), 5000);
                }, i * 100);
            }
        }

        function closeCelebration() {
            document.getElementById('celebrationModal').style.display = 'none';
            playSound('click');
        }

        function playAgain() {
            closeCelebration();
            closeLoser();
            resetGame();
        }

        function resetGame() {
            
            if (typeof endCall === 'function') {
                endCall();
            }
            
            playSound('click');
            board.fill(null);
            currentPlayer = 1;
            phase = 'placing';
            piecesLeft = {1: 9, 2: 9};
            selectedPos = null;
            removingMode = false;
            gameWinner = null; 
            document.querySelectorAll('.piece').forEach(p => p.remove());
            clearMovablePoints();
            clearRemovableHighlights();
            updateUI();
            updatePhaseIndicator();
            closeMenu();
            
            if (isOnlineMode && gameRef) {
                updateGameState();
                showNotification('New game started!', 'success');
            } else {
                
                if (gameRef) {
                    gameRef.off();
                    gameRef.remove();
                }
                isOnlineMode = false;
                isAIMode = false;
                aiThinking = false;
                gameRoomId = null;
                playerNumber = null;
                gameRef = null;
                chatListenerActive = false;
                unreadChatCount = 0;
                onlineGameStarted = false;
                isSpectator = false;
                spectatorId = null;
                const toast = document.getElementById('spectatorToast');
                if (toast) toast.style.display = 'none';
                const eye = document.getElementById('spectatorEye');
                if (eye) eye.style.display = 'none';
                if (chatListenerRef) {
                    chatListenerRef.off('child_added');
                    chatListenerRef = null;
                }
                document.getElementById('p1-online').innerHTML = '';
                document.getElementById('p2-online').innerHTML = '';
                document.getElementById('lobbyModal').style.display = 'flex';
                document.getElementById('createGameScreen').style.display = 'none';
                document.getElementById('joinGameScreen').style.display = 'none';
                document.getElementById('lobbyOptions').style.display = 'block';
            }
        }
