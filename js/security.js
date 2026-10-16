// ===== Mill Game: Security / Domain Verification =====

const SECURITY_CONFIG = {
allowedDomains: [
'balochzameer409-oss.github.io',
],

allowedUserAgents: [
'appsgeyser',
'AppsGeyser'
],

securityToken: 'WkJQcm9qZWN0MjAyNEBTZWN1cmUjWHlaNzg5IQ=='
};

function verifyDomain() {
    const currentDomain = window.location.hostname;
    // Allow localhost and all local IP addresses
    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') return true;
    if (currentDomain.startsWith('192.168.') || currentDomain.startsWith('10.') || currentDomain.startsWith('172.')) return true;
    return SECURITY_CONFIG.allowedDomains.includes(currentDomain);
}

function showError(message = null) {
document.getElementById('loadingScreen').style.display = 'none';
document.getElementById('gameContent').style.display = 'none';
document.getElementById('errorScreen').style.display = 'block';

if (message) {
document.querySelector('#errorScreen p').textContent = message;
}
}

function startGame() {
document.getElementById('loadingScreen').style.display = 'none';
document.getElementById('gameContent').style.display = 'block';
}

function initSecurity() {
return new Promise((resolve, reject) => {
setTimeout(() => {
if (!verifyDomain()) {
console.error('Unauthorized Domain');
reject('Unauthorized Domain');
return;
}

sessionStorage.setItem('gameAuth', SECURITY_CONFIG.securityToken);
sessionStorage.setItem('authTime', Date.now());

console.log('Security check passed!');
resolve(true);
}, 1000);
});
}

function isAuthorized() {
const token = sessionStorage.getItem('gameAuth');
const authTime = sessionStorage.getItem('authTime');

if (!token || token !== SECURITY_CONFIG.securityToken) {
return false;
}

const now = Date.now();
if (now - parseInt(authTime) > 3600000) {
sessionStorage.removeItem('gameAuth');
sessionStorage.removeItem('authTime');
return false;
}

return true;
}

document.addEventListener('contextmenu', e => {
e.preventDefault();
return false;
});

document.addEventListener('keydown', e => {
if (e.keyCode === 123 ||
(e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
(e.ctrlKey && e.keyCode === 85)) {
e.preventDefault();
return false;
}
});

window.addEventListener('DOMContentLoaded', async () => {
try {
await initSecurity();
setTimeout(startGame, 500);
} catch (error) {
console.error('Security check failed:', error);
showError();
}
});

window.gameAuth = {
isAuthorized: isAuthorized,
getToken: () => SECURITY_CONFIG.securityToken
};
