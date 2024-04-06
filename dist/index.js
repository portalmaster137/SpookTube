import express from 'express';
import https from 'https';
import fs from 'fs';
import morgan from 'morgan';
const app = express();
const port = 443;
app.use(morgan('combined'));
app.enable('trust proxy');
app.use((req, res, next) => {
    if (req.secure) {
        next();
    }
    else {
        console.log('Request to HTTP://' + req.headers.host + req.url + ' redirected to HTTPS');
        res.redirect('https://' + req.headers.host + req.url);
    }
});
app.route('/').get((req, res) => {
    res.redirect('https://store.steampowered.com/app/2881650/Content_Warning/');
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
const httpsServer = https.createServer(credentials, app);
// Start the server
httpsServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
