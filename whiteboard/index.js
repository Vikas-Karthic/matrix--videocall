const express = require('express');
const session = require('express-session');
const app = express();
const httpsserver = require('http').createServer(app);
const io = require('socket.io')(httpsserver);

let connections = [];
let host = null;  // Store the socket ID of the host

// Configure express-session for session handling
app.use(
    session({
        secret: 'your-secret-key', // Replace with a strong secret key
        resave: false,
        saveUninitialized: false,
    })
);

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/login');
}

io.on("connect", (socket) => {
    connections.push(socket);

    // Assign the first connection as the host
    if (!host) {
        host = socket.id;
        socket.emit('hostStatus', { isHost: true });
        console.log(`Host connected: ${socket.id}`);
    } else {
        socket.emit('hostStatus', { isHost: false });
    }

    console.log(`${socket.id} has connected`);

    // Listen for 'imageUploaded' and broadcast it to all clients
    socket.on("imageAction", (data) => {
        if (socket.id === host) {
          socket.broadcast.emit("imageAction", data);
        }
      });

    // Handle drawing data only from the host
    socket.on('drawing', (data) => {
        if (socket.id === host) {
            socket.broadcast.emit('drawing', data);
        }
    });

    // Handle canvas extension
    socket.on('canvas-extend', (data) => {
        if (socket.id === host) { // Only the host can extend the canvas
            io.emit('updateCanvasHeight', data); // Broadcast the update to all clients
        }
    });

        // Handle spotlight movements only from the host
socket.on('spotlightMove', (data) => {
    if (socket.id === host) {
        socket.broadcast.emit('spotlightUpdate', data); // Broadcast the spotlight movement
    }
});


  

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`${socket.id} has disconnected`);
        connections = connections.filter((con) => con.id !== socket.id);

        // If the host disconnects, assign a new host
        if (socket.id === host) {
            if (connections.length > 0) {
                host = connections[0].id;
                connections[0].emit('hostStatus', { isHost: true });
                console.log(`New host assigned: ${connections[0].id}`);
            } else {
                host = null;
            }
        }
    });
});


// Serve static files from the Public directory
app.use(express.static('Public'));

// Route to serve the login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/Public/login.html');
});

// Route to serve the registration page
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/Public/registration.html');
});

// Handle login request
app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;

    // Simple authentication logic (replace with actual authentication logic)
    if (username === 'user@user' && password === 'password') { // Replace with actual credentials
        req.session.isAuthenticated = true;
        res.redirect('/'); // Redirect to the protected root route after login
    } else {
        res.send('Invalid credentials');
    }
});



// Protect the root route
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/Public/index.html');
});

// Handle logout to destroy session
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login');
    });
});

const PORT = 8080;
httpsserver.listen(PORT, () => console.log(`Server active on port ${PORT}`));
