// ===== Mill Game: Text Chat System =====

function toggleChatPanel() {
    const panel = document.getElementById('chatPanel');
    const btn = document.getElementById('chatToggleBtn');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'flex';
        // Reset counter
        unreadChatCount = 0;
        const dot = document.getElementById('chatUnreadDot');
        dot.style.display = 'none';
        dot.textContent = '';
        // Hide popup
        document.getElementById('chatMsgPopup').style.display = 'none';
    } else {
        panel.style.display = 'none';
        btn.innerHTML = '💬';
    }
}

function sendChatMessage() {
    if (!isOnlineMode || !gameRef) {
        showNotification('Chat in an online game', 'error');
        return;
    }
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    
    const myName = playerName;
    gameRef.child('chatMessages').push({
        sender: playerNumber,
        name: myName || ('Player ' + playerNumber),
        text: msg,
        time: Date.now()
    });
    input.value = '';
    playSound('click');
}

let chatListenerActive = false;
let chatListenerRef = null; // Keep track of the old listener

function setupChatListener() {
    if (!gameRef) return;

    // Remove the old listener
    if (chatListenerRef) {
        chatListenerRef.off('child_added');
        chatListenerRef = null;
    }
    chatListenerActive = true;

    const startTime = Date.now();
    chatListenerRef = gameRef.child('chatMessages');

    chatListenerRef.on('child_added', (snapshot) => {
        const msg = snapshot.val();
        if (!msg) return;
        if (msg.time < startTime - 5000) return;
        appendChatMessage(msg);
    });
}

function appendChatMessage(msg) {
    const container = document.getElementById('chatMessages');
    const panel = document.getElementById('chatPanel');
    const isMe = msg.sender === playerNumber;
    
    const time = new Date(msg.time).toLocaleTimeString('ur-PK', {hour:'2-digit', minute:'2-digit'});
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex; flex-direction:' + (isMe ? 'row-reverse' : 'row') + '; align-items:flex-end; gap:6px; margin-bottom:8px; padding:0 4px;';
    
    
    const avatar = document.createElement('div');
    avatar.style.cssText = 'width:28px; height:28px; border-radius:50%; background:' + (isMe ? 'linear-gradient(135deg,#4CAF50,#2e7d32)' : 'linear-gradient(135deg,#6a11cb,#2575fc)') + '; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; color:white; flex-shrink:0;';
    avatar.innerText = (msg.name || 'U').charAt(0).toUpperCase();
    
    
    const bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:180px; display:flex; flex-direction:column; gap:2px; align-items:' + (isMe ? 'flex-end' : 'flex-start') + ';';
    
    const bgColor = isMe ? 'linear-gradient(135deg,#4CAF50,#2e7d32)' : 'linear-gradient(135deg,#3a3a6e,#4a4a8e)';
    const borderR = isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px';
    
    let msgContent = '';
    if (msg.type === 'voice' && msg.audio) {
        const uid = 'vp_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
        msgContent = '<div style="background:' + bgColor + '; padding:10px 14px; border-radius:' + borderR + '; box-shadow:0 2px 8px rgba(0,0,0,0.4); display:flex; align-items:center; gap:10px; min-width:200px; max-width:220px;">' +
            '<button id="btn_' + uid + '" onclick="playVoiceMsg(this, \'' + uid + '\')" style="background:rgba(255,255,255,0.25); border:none; border-radius:50%; width:38px; height:38px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;">' +
                '<i class="fas fa-play" style="color:white; font-size:14px; margin-left:2px;"></i>' +
            '</button>' +
            '<div style="flex:1; display:flex; flex-direction:column; gap:4px;">' +
                '<div id="bar_' + uid + '" style="height:4px; background:rgba(255,255,255,0.3); border-radius:4px; overflow:hidden; cursor:pointer; direction:ltr;">' +
                    '<div id="prog_' + uid + '" style="height:100%; width:0%; background:white; border-radius:4px; transition:width 0.1s linear;"></div>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                    '<span id="dur_' + uid + '" style="font-size:10px; color:rgba(255,255,255,0.8);">0:00</span>' +
                    '<i class="fas fa-microphone" style="font-size:10px; color:rgba(255,255,255,0.6);"></i>' +
                '</div>' +
            '</div>' +
            '<audio id="' + uid + '" src="' + msg.audio + '"></audio>' +
        '</div>';
    } else {
        msgContent = '<div style="background:' + bgColor + '; color:white; padding:8px 12px; border-radius:' + borderR + '; font-size:13px; word-break:break-word; box-shadow:0 2px 6px rgba(0,0,0,0.3);">' + msg.text + '</div>';
    }
    
    bubble.innerHTML = 
        '<span style="font-size:10px; color:rgba(255,255,255,0.55); padding:0 4px;">' + msg.name + ' · ' + time + '</span>' + msgContent;
    
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
    
    const panelOpen = panel.style.display === 'flex';
    if (!isMe && !panelOpen) {
        // Update counter
        unreadChatCount++;
        const dot = document.getElementById('chatUnreadDot');
        dot.style.display = 'inline-block';
        dot.textContent = unreadChatCount > 9 ? '9+' : unreadChatCount;

        // Play sound
        playChatSound();

        // Show message popup
        if (msg.type !== 'voice') {
            showChatPopup(msg.name, msg.text);
        } else {
            showChatPopup(msg.name, '🎤 Voice message');
        }
    } else if (!isMe && panelOpen) {
        // Panel is open - just play the sound
        playChatSound();
    }
}

// Unread counter
let unreadChatCount = 0;

// Chat notification sound
function playChatSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

// Show and hide message popup
let chatPopupTimer = null;
function showChatPopup(name, text) {
    const popup = document.getElementById('chatMsgPopup');
    document.getElementById('chatMsgPopupName').textContent = name;
    document.getElementById('chatMsgPopupText').textContent = text;
    popup.style.display = 'block';
    popup.style.animation = 'none';
    popup.offsetHeight; // reflow
    popup.style.animation = 'slideUp 0.3s ease';
    if (chatPopupTimer) clearTimeout(chatPopupTimer);
    chatPopupTimer = setTimeout(() => { popup.style.display = 'none'; }, 4000);
}
