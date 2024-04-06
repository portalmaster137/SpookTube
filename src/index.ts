import express from 'express';
import https from 'https';
import fs from 'fs';
import http from 'http';
import morgan from 'morgan';
import multer from 'multer';

const app = express();
const port = 443;

app.use(morgan('combined'));

app.enable('trust proxy');

app.use((req, res, next) => {
    if (req.secure) {
        next();
    } else {
        console.log('Request to HTTP://' + req.headers.host + req.url + ' redirected to HTTPS')
        res.redirect('https://' + req.headers.host + req.url);
    }
});

app.route('/').get((req, res) => {
    res.redirect('https://store.steampowered.com/app/2881650/Content_Warning/');
});

// Set up multer storage
const storage = multer.diskStorage({
    destination: '/spooktube/videos',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Create multer upload instance
const upload = multer({ storage });

// Define the upload route
app.post('/api/upload', upload.single('video'), (req, res) => {
    // Handle the uploaded file here
    res.send('File uploaded successfully');
});

// Configure your routes and middleware here

// Load SSL certificate and key
const privateKey = fs.readFileSync('/etc/letsencrypt/live/spooktu.be/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/spooktu.be/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/spooktu.be/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};



// Create HTTPS server
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80');
});

// Start the server
httpsServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});