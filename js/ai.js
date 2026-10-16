// ===== Mill Game: AI (Computer Player) =====

        function playVsAI() {
            isOnlineMode = false;
            isAIMode = true;
            playerNumber = 1;
            aiMoveHistory = [];
            document.getElementById('lobbyModal').style.display = 'none';
            document.getElementById('voiceControls').style.display = 'none';
            document.getElementById('p1-online').innerHTML = '<span style="color:gold">👤 You</span>';
            document.getElementById('p2-online').innerHTML = '<span style="color:#ff6b35">🤖 AI</span>';
            showNotification('AI mode started! You play first', 'success');
            playSound('click');
        }

        // ─── Claude AI ───────────────────────────────────────────────
        function makeAIMove() {
            if (aiThinking || phase === 'gameover') return;
            aiThinking = true;
            document.getElementById('phaseIndicator').textContent = '🤖 AI is thinking...';

            setTimeout(() => {
                try {
                    const move = minimaxBestMove();
                    if (!move) { fallbackAIMove(); aiThinking = false; return; }

                    aiExecuting = true;
                    if (move.action === 'place') {
                        handlePointClick(move.pos);
                        aiExecuting = false;
                    } else if (move.action === 'move') {
                        selectedPos = move.from;
                        highlightPiece(move.from);
                        highlightMovablePoints(move.from);
                        setTimeout(() => {
                            aiExecuting = true;
                            handlePointClick(move.to);
                            aiExecuting = false;
                        }, 400);
                    } else if (move.action === 'remove') {
                        handlePieceClick(move.pos);
                        aiExecuting = false;
                    }
                } catch(e) {
                    console.log('AI error:', e);
                    fallbackAIMove();
                }
                aiThinking = false;
            }, 300);
        }

        // ═══════════════════════════════════════════
        // MINIMAX ENGINE
        // ═══════════════════════════════════════════
        function minimaxBestMove() {
            const b = board.map(v => v === null ? 0 : v);
            const aiLeft = piecesLeft[2];
            const oppLeft = piecesLeft[1];

            if (phase === 'placing') {
                return bestPlaceMove(b, aiLeft, oppLeft);
            } else if (phase === 'moving') {
                return bestMoveMove(b);
            } else if (phase === 'removing') {
                return bestRemoveMove(b);
            }
            return null;
        }

        function countMills(b, player) {
            return mills.filter(mill => mill.every(p => b[p] === player)).length;
        }

        function formsMill(b, pos, player) {
            return mills.some(mill => mill.includes(pos) && mill.every(p => p === pos ? player === player : b[p] === player));
        }

        function isInMill(b, pos) {
            const player = b[pos];
            if (!player) return false;
            return mills.some(mill => mill.includes(pos) && mill.every(p => b[p] === player));
        }

        function evaluateBoard(b) {
            let score = 0;
            // mills count
            score += countMills(b, 2) * 100;
            score -= countMills(b, 1) * 100;
            // pieces count
            const aiPieces = b.filter(v => v === 2).length;
            const oppPieces = b.filter(v => v === 1).length;
            score += aiPieces * 10;
            score -= oppPieces * 10;
            // near mills (2 in a row)
            mills.forEach(mill => {
                const ai2 = mill.filter(p => b[p] === 2).length;
                const opp2 = mill.filter(p => b[p] === 1).length;
                const empty = mill.filter(p => b[p] === 0).length;
                if (ai2 === 2 && empty === 1) score += 50;
                if (opp2 === 2 && empty === 1) score -= 50;
                if (ai2 === 1 && empty === 2) score += 5;
            });
            // center positions are valuable
            [4, 7, 10, 13, 16, 19].forEach(p => {
                if (b[p] === 2) score += 3;
                if (b[p] === 1) score -= 3;
            });
            return score;
        }

        function bestPlaceMove(b, aiLeft, oppLeft) {
            let best = -Infinity, bestPos = -1;

            // 1. If a mill can be formed, do it immediately
            for (let i = 0; i < 24; i++) {
                if (b[i] !== 0) continue;
                const nb = [...b]; nb[i] = 2;
                if (formsMill(nb, i, 2)) return { action: 'place', pos: i };
            }

            // 2. Block the opponent’s mill
            for (let i = 0; i < 24; i++) {
                if (b[i] !== 0) continue;
                const nb = [...b]; nb[i] = 1;
                if (formsMill(nb, i, 1)) return { action: 'place', pos: i };
            }

            // 3. Choose the best spot
            for (let i = 0; i < 24; i++) {
                if (b[i] !== 0) continue;
                const nb = [...b]; nb[i] = 2;
                const score = evaluateBoard(nb);
                if (score > best) { best = score; bestPos = i; }
            }
            return bestPos >= 0 ? { action: 'place', pos: bestPos } : null;
        }

        function bestMoveMove(b) {
            const aiPieces = b.map((v,i) => v===2?i:-1).filter(i=>i>=0);
            const canFly = aiPieces.length === 3;
            let best = -Infinity, bestFrom = -1, bestTo = -1;

            for (const from of aiPieces) {
                const targets = canFly
                    ? b.map((v,i) => v===0?i:-1).filter(i=>i>=0)
                    : (directConnections[from]||[]).filter(n => b[n]===0);

                for (const to of targets) {
                    const nb = [...b];
                    nb[to] = 2; nb[from] = 0;

                    // Does this form a mill?
                    if (formsMill(nb, to, 2)) return { action: 'move', from, to };

                    const score = evaluateBoard(nb);
                    if (score > best) { best = score; bestFrom = from; bestTo = to; }
                }
            }

            // Block the opponent’s mill
            const oppPieces = b.map((v,i) => v===1?i:-1).filter(i=>i>=0);
            for (const from of oppPieces) {
                const targets = (directConnections[from]||[]).filter(n => b[n]===0);
                for (const to of targets) {
                    const nb = [...b]; nb[to] = 1;
                    if (formsMill(nb, to, 1)) {
                        // Block this spot
                        const myMoves = [];
                        for (const mf of aiPieces) {
                            const mt = canFly
                                ? b.map((v,i)=>v===0?i:-1).filter(i=>i>=0)
                                : (directConnections[mf]||[]).filter(n=>b[n]===0);
                            mt.forEach(t => { if(t===to) myMoves.push({from:mf,to:t}); });
                        }
                        if (myMoves.length > 0) return { action: 'move', from: myMoves[0].from, to: myMoves[0].to };
                    }
                }
            }

            return bestFrom >= 0 ? { action: 'move', from: bestFrom, to: bestTo } : null;
        }

        function bestRemoveMove(b) {
            const oppPieces = b.map((v,i) => v===1 ? i : -1).filter(i=>i>=0);
            
            // Remove pieces that are not in a mill
            const notInMill = oppPieces.filter(i => !mills.some(mill => mill.includes(i) && mill.every(p => b[p] === 1)));
            const targets = notInMill.length > 0 ? notInMill : oppPieces; // If all are in mills, any one will do

            let best = -Infinity, bestPos = -1;
            for (const pos of targets) {
                const nb = [...b]; nb[pos] = 0;
                const score = evaluateBoard(nb);
                if (score > best) { best = score; bestPos = pos; }
            }
            return bestPos >= 0 ? { action: 'remove', pos: bestPos } : null;
        }
        // ═══════════════════════════════════════════

        function fallbackAIMove() {
            if (phase === 'placing') {
                const empty = board.map((v, i) => (!v || v === 0) ? i : -1).filter(i => i >= 0);
                if (empty.length > 0) handlePointClick(empty[Math.floor(Math.random() * empty.length)]);
            } else if (phase === 'removing') {
                const targets = board.map((v, i) => v === 1 ? i : -1).filter(i => i >= 0);
                if (targets.length > 0) handlePieceClick(targets[Math.floor(Math.random() * targets.length)]);
            } else if (phase === 'moving') {
                const aiPieces = board.map((v, i) => v === 2 ? i : -1).filter(i => i >= 0);
                const aiCount = aiPieces.length;
                for (const from of aiPieces) {
                    const neighbors = aiCount === 3
                        ? board.map((v, i) => (!v || v === 0) ? i : -1).filter(i => i >= 0)
                        : (directConnections[from] || []).filter(n => !board[n] || board[n] === 0);
                    if (neighbors.length > 0) {
                        selectedPos = from;
                        handlePointClick(neighbors[0]);
                        break;
                    }
                }
            }
        }
        // ─────────────────────────────────────────────────────────────
