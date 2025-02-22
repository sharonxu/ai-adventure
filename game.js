const firebaseConfig = {
  apiKey: "AIzaSyCzZ-Pnv6RZ7z4ru1YJqFJOjAA9QyshRTM",
  authDomain: "ai-adventure-b3722.firebaseapp.com",
  databaseURL: "https://ai-adventure-b3722-default-rtdb.firebaseio.com",
  projectId: "ai-adventure-b3722",
  storageBucket: "ai-adventure-b3722.firebasestorage.app",
  messagingSenderId: "193826013217",
  appId: "1:193826013217:web:6221934bb93e515ef5a360",
  measurementId: "G-NZKP06LRCQ"
};

  
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Add initialization verification
database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        console.log('Connected to Firebase');
    } else {
        console.log('Not connected to Firebase');
    }
});

let gameId = null;
let playerId = null;

// Generate a random ID for the game session
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

// Create a new game session
document.getElementById('createGame').addEventListener('click', () => {
    try {
        gameId = generateId();
        playerId = 'player1';
        console.log('Creating new game with ID:', gameId);
        
        // Test database connection first
        database.ref('.info/connected').once('value')
            .then((snapshot) => {
                if (snapshot.val() === true) {
                    return database.ref('games/' + gameId).set({
                        player1: true,
                        player2: false,
                        messages: [],
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    });
                } else {
                    throw new Error('Not connected to Firebase');
                }
            })
            .then(() => {
                console.log('Game created successfully');
                
                // Show the game link
                const gameLink = `${window.location.href}?game=${gameId}`;
                document.getElementById('gameLink').style.display = 'block';
                document.getElementById('linkText').textContent = gameLink;
                
                // Hide the create game button
                document.getElementById('createGame').style.display = 'none';
                
                // Listen for game updates
                listenToGame();
            })
            .catch((error) => {
                console.error('Detailed error:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                alert(`Failed to create game: ${error.message}`);
            });
    } catch (error) {
        console.error('Error in create game handler:', error);
        alert('An error occurred while creating the game.');
    }
});

// Check if joining an existing game
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinGameId = urlParams.get('game');
    
    if (joinGameId) {
        gameId = joinGameId;
        playerId = 'player2';
        
        // Join the game in Firebase and verify connection
        const gameRef = database.ref('games/' + gameId);
        gameRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                gameRef.child('player2').set(true);
                console.log('Successfully joined game:', gameId);
                
                // Hide the create game button
                document.getElementById('createGame').style.display = 'none';
                
                // Listen for game updates
                listenToGame();
            } else {
                console.error('Game not found:', gameId);
                alert('Game session not found!');
            }
        });
    }
};

// Listen for game updates
function listenToGame() {
    const gameRef = database.ref('games/' + gameId);
    console.log('Listening for updates in game:', gameId);
    
    // Listen for new messages
    gameRef.child('messages').on('child_added', (snapshot) => {
        const message = snapshot.val();
        console.log('Received message:', message);
        displayMessage(message.player, message.text);
    }, (error) => {
        console.error('Error listening to messages:', error);
    });
}

// Send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message && gameId && playerId) {
        console.log('Sending message as:', playerId);
        // Add message to Firebase
        database.ref('games/' + gameId + '/messages').push({
            player: playerId,
            text: message
        }).then(() => {
            console.log('Message sent successfully');
            messageInput.value = '';
        }).catch((error) => {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        });
    }
}

// Also add enter key support for sending messages
document.getElementById('messageInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Display a message in the chat area
function displayMessage(player, text) {
    const chatArea = document.getElementById('chatArea');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${player}: ${text}`;
    chatArea.appendChild(messageElement);
    chatArea.scrollTop = chatArea.scrollHeight;
} 