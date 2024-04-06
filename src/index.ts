import express from 'express';
import https from 'https';
import fs from 'fs';
import http from 'http';
import morgan from 'morgan';
import multer from 'multer';

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//has to be ../ from __dirname because __dirname is /spooktube/dist
const __proddirname = path.resolve(__dirname, '../');

const app = express();
const port = 443;

app.use(morgan('combined'));

app.enable('trust proxy');

// host static files in static folder
app.use(express.static(__proddirname + '/static'));


app.use((req, res, next) => {
    if (req.secure) {
        next();
    } else {
        console.log('Request to HTTP://' + req.headers.host + req.url + ' redirected to HTTPS')
        res.redirect('https://' + req.headers.host + req.url);
    }
});

function getVideoCount() {
    return fs.readdirSync('/spooktube/videos').length.toString();
}

app.route('/').get((req, res) => {
    //res.redirect('https://store.steampowered.com/app/2881650/Content_Warning/');

    //send index.html in the html folder, but replace the text __VIDEOCOUNT__ with the number of videos in the videos folder
    const index = fs.readFileSync(__proddirname + '/html/index.html', 'utf8');
    res.send(index.replace('__VIDEOCOUNT__', getVideoCount()));
});

app.route('/upload').get((req, res) => {
    res.sendFile(__proddirname + '/html/upload.html');
});

app.route('/success').get((req, res) => {
    res.sendFile(__proddirname + '/html/success.html');
});

app.route('/random').get((req, res) => {
    //return a random video from the videos folder
    const videos = fs.readdirSync('/spooktube/videos');
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    res.sendFile('/spooktube/videos/' + randomVideo);
});

// Set up multer storage
const storage = multer.diskStorage({
    destination: '/spooktube/temp',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Create multer upload instance
const upload = multer({ storage });

// Define the upload route
app.post('/api/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        res.status(400).send('No file selected');
        //delete the file if it exists
        return;
    }

    //if file name already exists
    if (fs.existsSync(`/spooktube/videos/${req.file.originalname}`)) {
        res.status(400).send('File name already exists');
        return;
    }

    //file must be of type webm
    if (req.file.mimetype !== 'video/webm') {
        res.status(400).send('File must be of type webm');
        return;
    }

    //file must be less than 5MiB
    if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).send('File must be less than 5MiB');
        return;
    }

    // Move the file saving logic here, after all checks pass
    fs.rename(req.file.path, `/spooktube/videos/${req.file.originalname}`, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
            return;
        }
        res.redirect('/success');
    });
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