
import express from "express";
import cors from "cors";
import 'dotenv/config'
import routes from './routes/index.js'

const app = express()
const PORT = process.env.PORT || 3000

app.get("/", (req, res) => {
    res.send("Ayo👋! Hello World from NIT")
})

// CORS configuration - Explicit for development
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all origins for development
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'x-requested-with'],
    optionsSuccessStatus: 200
}))

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning, x-requested-with');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Route File
app.use(routes)

app.listen(PORT, () => console.log(`CamPass Server running on port: ${PORT} `))
