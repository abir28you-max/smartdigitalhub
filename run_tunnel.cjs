const { spawn } = require('child_process');
const fs = require('fs');

console.log('Starting Pinggy tunnel for port 3000...');

const ssh = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=no',
  '-p', '443',
  '-R0:localhost:3000',
  'a.pinggy.io'
], { shell: true });

ssh.stdout.on('data', (data) => {
  const text = data.toString();
  console.log('[Tunnel Output]:', text);
  fs.appendFileSync('tunnel_info.txt', text);
});

ssh.stderr.on('data', (data) => {
  const text = data.toString();
  console.log('[Tunnel Stderr]:', text);
  fs.appendFileSync('tunnel_info.txt', text);
});

ssh.on('close', (code) => {
  console.log('Tunnel closed with code:', code);
});
