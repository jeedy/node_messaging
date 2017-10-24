'use strict'

const
    cluster = require('cluster'),
    zmq = require('zmq');
    

let
    readyWorkerCnt = 0;
if(cluster.isMaster){
    let
        pusher = zmq.socket('push').bind('ipc://filer-pusher.ipc'),
        puller = zmq.socket('pull').bind('ipc://filer-puller.ipc');
    
    // pusher.on('message',function(data){
    //     let response = JSON.parse(data);
    //     console.log('master :: pusher in ' + response);
    // });

    puller.on('message', function(data){
        let response = JSON.parse(data);
        console.log('master :: puller.message in ' + data);

        if(response.ready){
            readyWorkerCnt+=1;

            if(readyWorkerCnt>=3){
                console.log('master :: on ready all workers. ')
                for(let i=0; i<30; i++){
                    pusher.send(JSON.stringify({
                        details: 'details about this job.',
                        index: i
                    }));
                }
            }
        }else if(response.result){
            console.log('master :: received: '+ data);
        }

    });

    cluster.on('online', function(worker){
        console.log('master :: worker' + worker.process.pid + ' is online.');

    });

    for(let i=0; i<3; i++){
        cluster.fork();
    }
}
else{

    console.log('worker :: created worker'+process.pid);
    let
        pusher_worker = zmq.socket('push').connect('ipc://filer-puller.ipc'),
        puller_worker = zmq.socket('pull').connect('ipc://filer-pusher.ipc');

    puller_worker.on('message', function(data){
        let response = JSON.parse(data);
        console.log('worker :: puller_worker do something... . ' + process.pid);
        pusher_worker.send(JSON.stringify({
            pid: process.pid,
            result: 'complete job',
            index: response.index
        }));
    });

    pusher_worker.send(JSON.stringify({
        ready: true,
        pid: process.pid
    }));
}
