const net = require("net");

//console.log(" net ",net);
//console.log("Logs from your program will appear here!");


const server = net.createServer((socket) => {
 
  socket.on('data',(data)=> {
    const dataStr = data.toString();
    //console.log(" data str => ",dataStr);
  
    let dataSplit  = dataStr.split(' ');
    //console.log(' data split ',dataSplit);
    let reqRoute = dataSplit[1];
    //console.log('reqRoute',reqRoute,reqRoute.length);
    if(reqRoute.length == 1){
      console.log(" In basic / get route ....");
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
      
    }else{
      let parentRoute = reqRoute.split('/')[1]
      if( parentRoute == 'echo'){
          console.log(" In basic /echo get route ....");
          let echoRes = reqRoute.split('/')[2] || '';
          if(echoRes){
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoRes.length}\r\n\r\n${echoRes}`);
          }
      }
      else if(parentRoute == 'user-agent'){
        console.log(" In basic /user-agent get route ....");
        const dataReqArr = dataStr.split('\n');
        let userAgentStr = '';
        for(let str of dataReqArr){
            //console.log(" str ",str);
            if(str.startsWith("User-Agent")){
                console.log("---",str);
                userAgentStr = str.split(':')[1].trim();
                break;
            }
        }
        console.log(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgentStr.length}\r\n\r\n${userAgentStr}`)
        if(userAgentStr){
          
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgentStr.length}\r\n\r\n${userAgentStr}`)
        }
      }
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      
    }
    
  
  })
  // socket.on("close", () => {
  //   socket.end();
  // });
});

server.listen(4221, "localhost");
