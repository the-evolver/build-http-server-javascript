const net = require("net");
const path = require('path')
const fs = require('fs');

//console.log(" net ",net);
//console.log("Logs from your program will appear here!");
//TODO: How js handles events such that Concurrent connections are managed by default ...

let directoryPath = null;
let filepath = null;
if(process.argv.indexOf("--directory") != -1 && process.argv[process.argv.indexOf("--directory") + 1]){
  directoryPath = process.argv[process.argv.indexOf("--directory") + 1];
}

const server = net.createServer((socket) => {
   
  socket.on('data',(data)=> {
    console.log(" data ... ", data.toString() );
    const dataStr = data.toString();
    let dataSplit  = dataStr.split(' ');
    let reqRoute = dataSplit[1];
   
    if(reqRoute.length == 1){
      console.log(" In basic / get route ....");
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
      
    }else{
      let parentRoute = reqRoute.split('/')[1];
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
      }else if(parentRoute == 'files'){
        console.log("process.argv ",process.argv);
        let currRoute = reqRoute.split('/')[2];
        filepath = path.join(directoryPath,currRoute);
        console.log(" in file route",parentRoute,currRoute);
        let contentLen = parentRoute.length + currRoute.length;
        let contentVal = currRoute;
        console.log(" filepath ",filepath);
        fs.readFileSync(filepath,'utf-8',(err,data)=>{
            console.log("_",data);
            if(!err){
               console.log('-----');
                contentLen = data.length;
                contentVal = data;
                socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${contentLen}\r\n\r\n${contentVal}}`);
            }
        })
      }
      console.log(" ............ ");
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    }
  })

});

server.listen(4221, "localhost");
