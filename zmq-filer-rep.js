'use strict';

const
    fs = require('fs'),
    zmq = require('zmq'),
    filename = 'target.txt',
    responder = zmq.socket('rep');

responder.on('message',function(data){

    let request = JSON.parse(data);
    console.log('Received request to get: '+ request.path);

    fs.readFile(request.path, function(err, content){
        console.log("error: ", err);
        console.log('sending response content.');
        
        responder.send(JSON.stringify({
            'content': content.toString(),
            timestamp: Date.now(),
            pid: process.pid
        }));

        console.log("done.");
    });

});

/*
    쌍방향 통신을 만드려 했으나 잘되지 않았음.
    zmq.socket으로 response 객체를 받았기 때문에 브로드캐스트가 불가능하다
    zmq.socket으로 publisher 객체를 받아야 브로드캐스트가 가능하다.
    
fs.watch(filename, function(){
    console.log('sending response content of Watch');
    responder.send(JSON.stringify({
        type: 'changed',
        file: filename,
        timestamp: Date.now()
    }));
});
*/
responder.bind('tcp://127.0.0.1:5433', function(err){
    console.log("Listening for zmq requesters .... ");
});

process.on("SIGINT", function(){
    console.log('Shutting down ...');
    responder.close();
});

