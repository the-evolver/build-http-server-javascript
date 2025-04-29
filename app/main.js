const net = require("net");
const path = require('path')
const fs = require('fs');
const zlib = require('zlib');

//console.log(" net ",net);
//console.log("Logs from your program will appear here!");
//TODO: How js handles events such that Concurrent connections are managed by default ...

let directoryPath = __dirname;
let filepath = null;
let requestType = null;
let requestBody = null;
let clientSupportedEncodings = [];
let ServerSupportedEncodings = ['gzip'];

if(process.argv.indexOf("--directory") != -1 && process.argv[process.argv.indexOf("--directory") + 1]){
  directoryPath = process.argv[process.argv.indexOf("--directory") + 1];
}

const server = net.createServer((socket) => {
   
  socket.on('data',async (data)=> {
    console.log(" data =>  ", data.toString() );
    const dataStr = data.toString();
    let dataSplit  = dataStr.split(' ');
    let reqRoute = dataSplit[1];
    requestType = dataSplit[0];
    //TODO: MAKE FETCHING REQUEST BODY MORE ROBOUST .. CURENLTY IF IN REQUEST BODY WE ADD NEW LINE AT END IT WILL NOT BREAK THE LOGIC WHICH SHOULDNT ....
    requestBody = dataStr.split('\n')[dataStr.split('\n').length - 1];
    for(let str of dataStr.split('\n')){
      if(str.startsWith('Accept-Encoding')){
          clientSupportedEncodings = str.split(':')[1].split(',');
          clientSupportedEncodings = clientSupportedEncodings.map((currEl) => currEl.trim());
      }
    }
    console.log(" clientSupportedEncodings ",clientSupportedEncodings);
    console.log(" split data ",dataStr.split('\n'));
    console.log(" request type  ",requestType);
    console.log(" request body ",requestBody);
    console.log(" ⛔️ ⛔️ ⛔️ ⛔️ ⛔️   ");
   
    if(reqRoute.length == 1){
      
      console.log(" In basic / get route ....");
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
      
    }else{
      let parentRoute = reqRoute.split('/')[1];
      if( parentRoute == 'echo'){
          console.log(" In basic /echo get route ....");
          let echoRes = reqRoute.split('/')[2] || '';
          let compress = false;
          let compressFormat = null;
          clientSupportedEncodings.forEach((cEnconding) => {
            ServerSupportedEncodings.forEach((sEncoding) => {
              if(cEnconding == sEncoding){
                compress = true;
                compressFormat = cEnconding;
              }
            })
          })
          
          if(echoRes){
            let encodingHeader = compress ? `Content-Encoding: ${compressFormat}\r\n`:"" ;
            console.log(" encoding header ........ ",encodingHeader);
           if(compress){
            console.log('in compress ..');
            zlib.gzip(echoRes,(err,buffer)=> {
              
              if(err){
                console.log(" error occured while compressing to gzip ",buffer.toString('base64'))
              }else{
                 echoRes = buffer.toString('base64');
                 console.log(" data compressed ",buffer.toString('base64'));
              }
            })    
           }
        
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoRes.length}\r\n${encodingHeader}\r\n${echoRes}`);
          }else{
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
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
        else{
          socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        }
      }else if(parentRoute == 'files'){
        console.log("process.argv ",process.argv);
        let currRoute = reqRoute.split('/')[2];
        filepath = path.join(directoryPath,currRoute);
        

        if(requestType == 'GET'){
        console.log(" in file route GET ",parentRoute,currRoute);
        let contentLen = parentRoute.length + currRoute.length;
        let contentVal = currRoute;
        console.log(" filepath ",filepath);
        fs.readFile(filepath,'utf-8',(err,data)=>{
            console.log("_",data);
            if(err){
              socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            }
            else{
               console.log('-----');
                contentLen = data.length;
                contentVal = data;
                socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${contentLen}\r\n\r\n${contentVal}}`);
            }
        })

        }else if (requestType == 'POST'){
        console.log(" in file route POST",parentRoute,currRoute);
         // create file with request body content and return response ....
         fs.writeFile(filepath,requestBody,(err) => {
              if(err){
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
              }else{
                socket.write('HTTP/1.1 201 Created\r\n\r\n');
              }
         })

        }
        
      }else{
        console.log(" Not in echo,user-agent,file route ... no route found ...");
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      }
      
      
    }
    console.log(' ---------------- ::: ');
    

  })
   console.log("++++++");
});

server.listen(4221, "localhost");
