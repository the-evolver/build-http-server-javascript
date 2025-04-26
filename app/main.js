const net = require("net");

console.log(" net ",net);
console.log("Logs from your program will appear here!");


const server = net.createServer((socket) => {
 // console.log(" socket ",socket);
  //socket.write(" Status : 200");
  socket.on('data',(data)=> {
    const dataStr = data.toString();
    if(dataStr[5] == ' '){
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    }
    else{
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
    
  })
  // socket.on("close", () => {
  //   socket.end();
  // });
});

server.listen(4221, "localhost");
