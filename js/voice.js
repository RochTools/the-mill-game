// ===== Mill Game: Voice Call (WebRTC) + Voice Message Recording =====

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let isVoiceEnabled = false;
let isCallActive = false;
let dataChannel = null;

const iceServers = {
    iceServers: [
        
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

function toggleVoicePanel() {
    if (!isOnlineMode) {
        showNotification('Use voice chat in an online game', 'error');
        playSound('error');
        return;
    }
    
    const voiceControls = document.getElementById('voiceControls');
    
    
    if (voiceControls.style.display === 'none' || voiceControls.style.display === '') {
        voiceControls.style.display = 'block';
        
        showNotification('Voice chat on 🎤', 'success');
    } else {
        voiceControls.style.display = 'none';
        
        showNotification('Voice chat off 🔇', 'info');
    }
    playSound('click');
}
    

async function toggleMicrophone() {
    const micBtn = document.getElementById('micToggleBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (!localStream) {
        try {
            console.log('🎤 Requesting microphone access...');
            localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1
                },
                video: false 
            });
            
            console.log('✅ Microphone access granted');
            console.log('Audio tracks:', localStream.getAudioTracks());
            
            isVoiceEnabled = true;
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            micBtn.style.background = '#f44336';
            voiceStatus.innerHTML = 'Mic on 🎤';
            voiceStatus.style.color = '#4CAF50';
            const vcb = document.getElementById('voiceInChatBtn');
            if(vcb){vcb.style.background='#f44336'; vcb.innerHTML='<i class="fas fa-microphone-slash"></i>';}
            const vfb = document.getElementById('voiceFloatBtn');
            if(vfb){vfb.style.background='linear-gradient(135deg,#f44336,#b71c1c)'; vfb.innerHTML='<i class="fas fa-microphone-slash" style="font-size:20px;"></i>';}
            showNotification('Mic is on ✅', 'success');
            playSound('place');
        } catch (error) {
            console.error('❌ Cannot access microphone:', error);
            showNotification('Microphone permission required', 'error');
            playSound('error');
            return;
        }
    } else {
        
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            console.log('Track', track.kind, 'enabled:', track.enabled);
        });
        
        isVoiceEnabled = !isVoiceEnabled;
        if (isVoiceEnabled) {
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            micBtn.style.background = '#f44336';
            voiceStatus.innerHTML = 'Mic on 🎤';
            voiceStatus.style.color = '#4CAF50';
            showNotification('Mic on', 'info');
        } else {
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            micBtn.style.background = '#4CAF50';
            voiceStatus.innerHTML = 'Mic off 🔇';
            voiceStatus.style.color = '#f44336';
            showNotification('Mic off', 'warning');
            
            const vcb = document.getElementById('voiceInChatBtn');
            if(vcb){vcb.style.background='#2196F3'; vcb.innerHTML='<i class="fas fa-microphone"></i>';}
        }
        playSound('click');
    }
}

async function toggleCall() {
    const callBtn = document.getElementById('callToggleBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (!isOnlineMode || !gameRef) {
        showNotification('Start a call in an online game', 'error');
        playSound('error');
        return;
    }
    
    if (!localStream) {
        showNotification('Turn on the mic first', 'error');
        playSound('error');
        return;
    }
    
    if (!isCallActive) {
        
        try {
            await createPeerConnection();
            
            
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            
            await gameRef.update({
                voiceSignal: {
                    type: 'offer',
                    from: playerNumber,
                    to: playerNumber === 1 ? 2 : 1,
                    sdp: offer.sdp,
                    timestamp: Date.now()
                }
            });
            
            isCallActive = true;
            callBtn.innerHTML = '<i class="fas fa-phone-slash"></i>';
            callBtn.style.background = '#f44336';
            voiceStatus.innerHTML = 'Call in progress 📞';
            voiceStatus.style.color = '#2196F3';
            
            showNotification('Call started', 'success');
            playSound('mill');
        } catch (error) {
            console.error('Problem starting the call:', error);
            showNotification('Could not start the call', 'error');
            playSound('error');
        }
    } else {
        
        endCall();
        callBtn.innerHTML = '<i class="fas fa-phone"></i>';
        callBtn.style.background = '#2196F3';
        voiceStatus.innerHTML = 'Voice is off';
        voiceStatus.style.color = 'white';
        
        showNotification('Call ended', 'info');
        playSound('click');
    }
}

async function createPeerConnection() {
    console.log('🔧 Creating peer connection...');
    peerConnection = new RTCPeerConnection(iceServers);
    
    
    dataChannel = peerConnection.createDataChannel('gameData');
    dataChannel.onopen = () => {
        console.log('✅ Data channel opened');
    };
    dataChannel.onmessage = (event) => {
        console.log('📨 Message received:', event.data);
    };
    
    
    if (localStream) {
        console.log('🎤 Adding local audio tracks...');
        localStream.getTracks().forEach(track => {
            console.log('Track added:', track.kind, track.enabled);
            peerConnection.addTrack(track, localStream);
        });
    } else {
        console.error('❌ No local stream available!');
    }
    
    
    peerConnection.ontrack = (event) => {
        console.log('🔊 Remote track received:', event.track.kind);
        remoteStream = event.streams[0];
        const remoteAudio = document.getElementById('remoteAudio');
        remoteAudio.srcObject = remoteStream;
        
        
        remoteAudio.play().then(() => {
            console.log('✅ Remote audio playing');
        }).catch(err => {
            console.error('❌ Remote audio play failed:', err);
        });
    };
    
    
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('🧊 ICE candidate found:', event.candidate.type);
            if (gameRef) {
                gameRef.update({
                    voiceSignal: {
                        type: 'ice-candidate',
                        from: playerNumber,
                        to: playerNumber === 1 ? 2 : 1,
                        candidate: event.candidate.toJSON(),
                        timestamp: Date.now()
                    }
                });
            }
        } else {
            console.log('✅ All ICE candidates gathered');
        }
    };
    
    
    peerConnection.oniceconnectionstatechange = () => {
        console.log('🧊 ICE Connection State:', peerConnection.iceConnectionState);
    };
    
    
    peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
            showNotification('Audio connected! 🎧', 'success');
        }
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed' || 
            peerConnection.connectionState === 'closed') {
            endCall();
        }
    };
}

function setupVoiceSignalListener() {
    if (!gameRef) return;
    
    gameRef.child('voiceSignal').on('value', (snapshot) => {
        const signal = snapshot.val();
        if (!signal) return;
        
        
        if (signal.to !== playerNumber) return;
        
        processVoiceSignal(signal);
    });
}

async function processVoiceSignal(signal) {
    console.log('📡 Processing signal:', signal.type, 'from player', signal.from);
    
    if (!peerConnection) {
        console.log('⚠️ No peer connection, creating one...');
        await createPeerConnection();
    }
    
    try {
        switch (signal.type) {
            case 'offer':
                console.log('📥 Received offer');
                await peerConnection.setRemoteDescription(new RTCSessionDescription({
                    type: 'offer',
                    sdp: signal.sdp
                }));
                
                
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                console.log('📤 Sending answer');
                
                
                await gameRef.update({
                    voiceSignal: {
                        type: 'answer',
                        from: playerNumber,
                        to: signal.from,
                        sdp: answer.sdp,
                        timestamp: Date.now()
                    }
                });
                
                isCallActive = true;
                updateVoiceUI(true);
                showNotification(`Incoming call 📞`, 'success');
                playSound('place');
                break;
                
            case 'answer':
                console.log('📥 Received answer');
                await peerConnection.setRemoteDescription(new RTCSessionDescription({
                    type: 'answer',
                    sdp: signal.sdp
                }));
                
                isCallActive = true;
                updateVoiceUI(true);
                showNotification('Call connected ✅', 'success');
                playSound('mill');
                break;
                
            case 'ice-candidate':
                if (signal.candidate) {
                    console.log('🧊 Adding ICE candidate');
                    await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
                break;
                
            case 'hangup':
                console.log('📴 Call ended by remote');
                endCall();
                showNotification(`${opponentName} ended the call`, 'info');
                playSound('error');
                break;
        }
    } catch (error) {
        console.error('❌ Problem processing signal:', error);
        showNotification('Voice connection problem: ' + error.message, 'error');
        playSound('error');
    }
}

function updateVoiceUI(isActive) {
    const callBtn = document.getElementById('callToggleBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (isActive) {
        callBtn.innerHTML = '<i class="fas fa-phone-slash"></i>';
        callBtn.style.background = '#f44336';
        voiceStatus.innerHTML = 'Call in progress 📞';
        voiceStatus.style.color = '#2196F3';
        isCallActive = true;
    } else {
        callBtn.innerHTML = '<i class="fas fa-phone"></i>';
        callBtn.style.background = '#2196F3';
        voiceStatus.innerHTML = 'Voice is off';
        voiceStatus.style.color = 'white';
        isCallActive = false;
    }
}

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (remoteStream) {
        remoteStream = null;
        document.getElementById('remoteAudio').srcObject = null;
    }
    
    
    if (gameRef && isCallActive) {
        gameRef.update({
            voiceSignal: {
                type: 'hangup',
                from: playerNumber,
                to: playerNumber === 1 ? 2 : 1,
                timestamp: Date.now()
            }
        });
    }
    
    updateVoiceUI(false);
    isVoiceEnabled = false;
    
    
    const micBtn = document.getElementById('micToggleBtn');
    micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    micBtn.style.background = '#4CAF50';
}

function setupVoiceEventListeners() {
    document.getElementById('micToggleBtn').addEventListener('click', toggleMicrophone);
    document.getElementById('callToggleBtn').addEventListener('click', toggleCall);
}

function onOnlineGameStart() {
    document.getElementById('chatToggleBtn').style.display = 'flex';

    // Audio unlock - browsers require a user interaction first
    // Play a silent sound so the audio context unlocks
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        // Preload all audio files
        Object.values(audio).forEach(a => {
            if (a) { a.load(); }
        });
    } catch(e) {}

    // Reset the chat listener so it works in the new game
    chatListenerActive = false;
    unreadChatCount = 0;

    setupVoiceEventListeners();
    setupVoiceSignalListener();
    setupChatListener();
    
    showNotification('Voice and text chat are available 🎧💬', 'info');
}

function playVoiceMsg(btn, uid) {
    const audio = document.getElementById(uid);
    const prog = document.getElementById('prog_' + uid);
    const dur = document.getElementById('dur_' + uid);
    const icon = btn.querySelector('i');
    
    if (!audio) return;
    
    if (audio.paused) {
        
        document.querySelectorAll('audio').forEach(a => {
            if (a.id !== uid && !a.paused) {
                a.pause();
                const ob = document.getElementById('btn_' + a.id);
                if(ob) ob.querySelector('i').className = 'fas fa-play';
            }
        });
        
        audio.play();
        icon.className = 'fas fa-pause';
        btn.style.background = 'rgba(255,255,255,0.4)';
        
        
        audio.ontimeupdate = () => {
            if (!audio.duration) return;
            const pct = (audio.currentTime / audio.duration) * 100;
            prog.style.width = pct + '%';
            const s = Math.floor(audio.currentTime);
            dur.textContent = Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
        };
        
        audio.onended = () => {
            icon.className = 'fas fa-play';
            prog.style.width = '0%';
            dur.textContent = '0:00';
            btn.style.background = 'rgba(255,255,255,0.25)';
        };
        
    } else {
        audio.pause();
        icon.className = 'fas fa-play';
        btn.style.background = 'rgba(255,255,255,0.25)';
    }
}

let voiceMsgRecorder = null;
let voiceMsgChunks = [];
let isRecording = false;
let voiceStream = null;

async function startVoiceRecord(e) {
    if(e) e.preventDefault();
    if (!isOnlineMode || !gameRef) {
        showNotification('Send voice messages in an online game', 'error');
        return;
    }
    
    if (voiceMsgRecorder && voiceMsgRecorder.state !== 'inactive') {
        voiceMsgRecorder.stop();
    }
    if (voiceStream) {
        voiceStream.getTracks().forEach(t => t.stop());
        voiceStream = null;
    }
    if (isRecording) return;
    
    try {
        voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        voiceMsgChunks = [];
        
        voiceMsgRecorder = new MediaRecorder(voiceStream, { mimeType: 'audio/webm' });
        
        voiceMsgRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) voiceMsgChunks.push(e.data);
        };
        
        voiceMsgRecorder.onstop = () => {
            
            if (voiceStream) {
                voiceStream.getTracks().forEach(t => t.stop());
                voiceStream = null;
            }
            
            if (voiceMsgChunks.length === 0) return;
            
            const blob = new Blob(voiceMsgChunks, { type: 'audio/webm' });
            voiceMsgChunks = [];
            
            if (blob.size > 1000000) {
                showNotification('Recording is too long! Keep it under 30 seconds', 'error');
                return;
            }
            if (blob.size < 100) {
                showNotification('Recording is too short!', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                gameRef.child('chatMessages').push({
                    sender: playerNumber,
                    name: playerName || ('Player ' + playerNumber),
                    type: 'voice',
                    audio: reader.result,
                    time: Date.now()
                });
                showNotification('Voice message sent ✅', 'success');
                playSound('place');
            };
            reader.readAsDataURL(blob);
        };
        
        
        voiceMsgRecorder.start(100);
        isRecording = true;
        
        const btn = document.getElementById('voiceMsgBtn');
        btn.style.background = '#f44336';
        btn.innerHTML = '<i class="fas fa-circle" style="color:white; animation:pulse 0.8s infinite;"></i>';
        showNotification('🔴 Recording... release to send', 'info');
        
    } catch(err) {
        isRecording = false;
        showNotification('Microphone permission required', 'error');
    }
}

function stopVoiceRecord(e) {
    if(e) e.preventDefault();
    if (!isRecording || !voiceMsgRecorder) return;
    
    try {
        if (voiceMsgRecorder.state === 'recording') {
            voiceMsgRecorder.stop();
        }
    } catch(err) {}
    
    isRecording = false;
    
    const btn = document.getElementById('voiceMsgBtn');
    btn.style.background = '#2196F3';
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
}

