import express from 'express';
import https from 'https';
import fs from 'fs';
const app = express();
const port = 443;
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
