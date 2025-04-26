const net = require("net");

console.log(" net ",net);
console.log("Logs from your program will appear here!");


const server = net.createServer((socket) => {
  socket.on('data',()=> {
    console.log("goota a connection mate ....");
  })
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
