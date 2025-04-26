const net = require("net");

//console.log(" net ",net);
//console.log("Logs from your program will appear here!");


const server = net.createServer((socket) => {
 
  socket.on('data',(data)=> {
    const dataStr = data.toString();
    console.log(" data str => ",dataStr);
    
    let reqRoute = dataStr.split(' ')[1];
    console.log('reqRoute',reqRoute,reqRoute.length);
    if(reqRoute.length == 1){
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
    }else{
      let echoRes = reqRoute.split('/')[2] || '';
      if(echoRes){
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoRes.length}\r\n\r\n${echoRes}`);
      }else{
        socket.write('HTTP/1.1 404 Bad request\r\n\r\n');
      }
      
    }
    
  
  })
  // socket.on("close", () => {
  //   socket.end();
  // });
});

server.listen(4221, "localhost");
