const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 3000, subdomain: 'smartdigitalhub' + Math.floor(Math.random() * 899 + 100) });
    console.log('Tunnel URL:', tunnel.url);
    fs.writeFileSync('public_live_url.txt', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Tunnel error:', err);
  }
})();
