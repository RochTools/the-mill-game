
# The Mill Game

A feature-rich version of the classic Nine Men's Morris board game, offering offline gameplay, online multiplayer, real-time voice chat, text messaging, emoji reactions, and spectator interaction.

## Features

### 🎮 Game Modes

- **Play Against the Computer:** Challenge the computer in an offline game.
- **Offline Two-Player Mode:** Play with a friend on the same device without an internet connection.
- **Online Multiplayer:** Play with another player over the internet.

### 🌐 Online Multiplayer

- Real-time online matches between two players.
- WebRTC-based voice chat.
- Text messaging between players.
- Emoji reactions during matches.
- Support for up to two spectators per online match.
- Spectators can watch the board and communicate through voice and text chat.
- Spectators cannot move pieces or interfere with gameplay.

### 📴 Offline Gameplay

The **Play Offline** option supports:

- Playing against the computer.
- Playing with another person on the same device.
- No internet connection required for these offline game modes.

### 👀 Spectator Mode

- Up to two spectators can join an online match.
- Spectators can watch the match in progress.
- Voice chat and text messaging are available to participants.
- Spectators cannot move pieces on the game board.

### 📱 Progressive Web App (PWA)

- Installable through supported browsers.
- App icons and web app manifest.
- Service worker for supported offline functionality.
- Designed for mobile and desktop browsers.

## Technology Stack

- HTML
- CSS
- JavaScript
- WebRTC for voice communication
- Firebase-related online functionality
- Progressive Web App technologies

## Project Structure

The project uses separate modules for game logic, online functionality, chat, voice communication, sound effects, security, and PWA support.

Key files include:

- `index.html` — Main game interface
- `manifest.json` — PWA configuration
- `service-worker.js` — Service worker
- `game-core.js` — Core game logic
- `online-firebase.js` — Online functionality
- `pwa-register.js` — PWA registration
- `chat.js` — Chat functionality
- `voice.js` — Voice communication
- `sound.js` — Sound effects
- `security.js` — Security-related functionality

## How to Play

1. Open the game.
2. Choose an available game mode.
3. Play against the computer, play locally with a friend, or join an online match.
4. Place and move pieces strategically to form mills.
5. Form a mill by aligning three pieces and remove an eligible opponent's piece.
6. Block your opponent and plan your moves carefully.

## Getting Started

1. Download or clone the project source code.
2. Run it using a suitable local development server or static hosting.
3. Open the game in a compatible browser.
4. Choose a game mode and start playing.

Online features may require an internet connection and appropriate service configuration.

## License

Specify the project's actual open-source license here before distributing the source code.

---

**The Mill Game — Think Ahead. Form Your Mills. Win the Match.**

---
**mode with StepTuDeen**