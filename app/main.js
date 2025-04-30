const net = require("net");
const path = require('path')
const fs = require('fs');
const zlib = require('zlib');

const compressHelper = (echoRes) => {
  console.log('compression started ....',echoRes);
  
  return new Promise((resolve,reject) => {
    zlib.gzip(echoRes,{
      level: zlib.constants.Z_BEST_SPEED,
      memLevel: zlib.constants.Z_BEST_SPEED,
      timestamp: 0 // This ensures the header is deterministic
    },(err,buffer)=> {
              
      if(err){
        console.log(" error occured while compressing to gzip ",buffer.toString('hex'));
        reject('');
      }
         console.log(" data compressed ",buffer);
         resolve(buffer);
      
    });   
  })
}

const customResponse  = (responseCode,responseMessage,headers = [] ,responseBody = '',connectionHeaderRequest,currActiveSocket) => {
  let responseStr = '';
  if(connectionHeaderRequest == 'close'){
    headers.push('Connection: close');
  }
  if(!currActiveSocket){
    console.log(" No active channel to send response please activate the socket first .... ");
    return;
  }
  if(headers.length == 0 && responseBody == ''){
       responseStr = `HTTP/1.1 ${responseCode} ${responseMessage}\r\n\r\n`;
  }else if(responseCode == null && responseMessage == null ){
       responseStr = responseBody;
  }else{
        
        responseStr = `HTTP/1.1 ${responseCode} ${responseMessage}\r\n${headers.join('\r\n')}\r\n\r\n` ;
    if(responseBody != ''){
        responseStr += responseBody;
    }
  }
  
  // write to socket
  console.log("response str",responseStr);
 
  currActiveSocket.write(responseStr);
}

const server = net.createServer((socket) => {
 
  socket.on('data',async (data)=> {
    // state of a connection 
    let directoryPath = __dirname;
    let filepath = null;
    let requestType = null;
    let requestBody = null;
    let clientSupportedEncodings = [];
    let ServerSupportedEncodings = ['gzip'];
    let connectionHeaderRequest = '';
    let currActiveSocket = socket;
    if(process.argv.indexOf("--directory") != -1 && process.argv[process.argv.indexOf("--directory") + 1]){
      directoryPath = process.argv[process.argv.indexOf("--directory") + 1];
    }

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
      if(str.startsWith('Connection')){
        connectionHeaderRequest = str.split(':')[1].trim();
    }
    }
    
   
    if(reqRoute.length == 1){
      
      console.log(" In basic / get route ....");
      //socket.write('HTTP/1.1 200 OK\r\n\r\n');
      
      customResponse(200,'OK',[],'',connectionHeaderRequest,currActiveSocket);
      
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
            let encodingHeader = compress ? `Content-Encoding: ${compressFormat}`:"" ;
           
           if(compress){
              console.log('in compress ..');
              echoRes = await compressHelper(echoRes);
              customResponse(200,'OK',[encodingHeader,'Content-Type: text/plain',`Content-Length: ${echoRes.length}`],'',connectionHeaderRequest,currActiveSocket);
              customResponse(null,null,[],echoRes,connectionHeaderRequest,currActiveSocket);
           }else{
              customResponse(200,'OK',['Content-Type: text/plain',`Content-Length: ${echoRes.length}`],echoRes,connectionHeaderRequest,currActiveSocket);
           }
          }else{
              customResponse(404,'Not Found',[],'',connectionHeaderRequest,currActiveSocket);
          }
      }
      else if(parentRoute == 'user-agent'){
        console.log(" In basic /user-agent get route ....");
        const dataReqArr = dataStr.split('\n');
        let userAgentStr = '';
        for(let str of dataReqArr){
            if(str.startsWith("User-Agent")){
                userAgentStr = str.split(':')[1].trim();
                break;
            }
        }

        if(userAgentStr){
          customResponse(200,'OK',['Content-Type: text/plain',`Content-Length: ${userAgentStr.length}`],userAgentStr,connectionHeaderRequest,currActiveSocket);
          
        }
        else{
          customResponse(404,'Not Found',[],'',connectionHeaderRequest,currActiveSocket);
        }
      }else if(parentRoute == 'files'){
        
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
              customResponse(404,'Not Found',[],'',connectionHeaderRequest,currActiveSocket);
              
            }
            else{
               
                contentLen = data.length;
                contentVal = data;
                customResponse(200,'OK',['Content-Type: application/octet-stream',`Content-Length: ${contentLen}`],contentVal,connectionHeaderRequest,currActiveSocket);
               
            }
        })

        }else if (requestType == 'POST'){
        console.log(" in file route POST",parentRoute,currRoute);
        
         fs.writeFile(filepath,requestBody,(err) => {
              if(err){
                customResponse(404,'Not Found',[],'',connectionHeaderRequest,currActiveSocket);
              }else{
                customResponse(201,'Created',[],'',connectionHeaderRequest,currActiveSocket);
              }
         })

        }
        
      }else{
        
        customResponse(404,'Not Found',[],'',connectionHeaderRequest,currActiveSocket);
       
      }
      
      
    }
    
    if(connectionHeaderRequest == 'close'){
      console.log(" destroy Connection...");
      socket.end();
     }

  })
   
});

server.listen(4221, "localhost");














