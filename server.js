const SocketServer = require("websocket").server;
const express = require("express");
const app = express();
const path = require("path");
const fs = require('fs');
const multer  = require('multer');
const {Readable} = require('stream');

const port = process.env.PORT || 3000;
var doubleNameCouter = 0;
var clients = new Map();
const connected_names = [];
var serverObject = {};
const VERSION = "3.1";
const UPDATE_URL = "https://github.com/moxica80/nicolaschat/releases/download/v3.0/chat_app_3.0.apk"


function timeStamp(){
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const seconds = String(today.getSeconds()).padStart(2, '0');
    const dateTime = `${day}/${month}/${year} ${hours}:${minutes}`;
    return dateTime;    
}


var server = app.listen(port, ()=>{    
    console.log("Server Listen on port", port + " " + timeStamp());
});

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.text());
app.use(multer().any());

//ENABLE CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get("/", (request, response) => {
    response 
   .status(200)
   .sendFile(path.join(__dirname, "public", "index.html"));
    
});

app.post("/check_version", (req, res) =>{
    let checkedName = req.body.myName;    
    if(clients.size > 0){        
        clients.forEach((connectionData, user) =>{
            if(user == checkedName){
                doubleNameCouter = Math.floor(Math.random() * 100) + 1;
                checkedName = checkedName + doubleNameCouter;
                console.log("User name renamed to " + checkedName);  
            }
        });
    }        
    let responeJson = {LTS_version: VERSION, update_url: UPDATE_URL, nickName: checkedName};    
    res.json(responeJson);    
});

app.post("/set_my_avatar", (req, res) => {     
    if(req.files){                                
        clients.get(req.files[0].originalname).avatar = req.files[0].buffer;              
        res.send("Set Avatar done " + req.files[0].originalname);
    }else{
        res.send("Set avatar failed...");
    }  
});  

app.post("/get_user_avatar", (req, res) => {                 
    let buffer = clients.get(req.body.name).avatar;    
    res.send(buffer);   
});

var wsServer = new SocketServer({
    httpServer: server,
    maxReceivedFrameSize: 1500000,
    maxReceivedMessageSize: 10 * 1024 * 1024,
    autoAcceptConnections: false,
});

wsServer.on("request", (req) => {
    const connection = req.accept();    
    connection.on("message", (mes) => {      
        var userJson = JSON.parse(mes.utf8Data);
        switch (userJson.code) {            
            case 10: // new user connected
                clients.set(userJson.fromUser, {socket: connection, avatar: null});                                           
                console.log(userJson.fromUser + " Connected " +  timeStamp());           
                let connectedUserNames = "";
                connected_names.length = 0;
                clients.forEach((connectionData, user) => {
                    connected_names.push(user);
                });                
                serverObject = {code: 10, fromUser: userJson.fromUser, usersList: connected_names};                
                clients.forEach((conectionData, user) =>{
                    conectionData.socket.sendUTF(JSON.stringify(serverObject));                    
                });        
                break;    

             case 30: //message
                clients.forEach((connectionData, user) =>{
                    if(connectionData.socket != connection){
                        connectionData.socket.sendUTF(mes.utf8Data)
                    }
                });
                break;

            case 40: //Private message
                clients.get(userJson.toUser).socket.sendUTF(mes.utf8Data);                
                break;

            case 50: //photo received
                if (!userJson.private) {
                    clients.forEach((connectionData, user) =>{
                    if(connectionData.socket != connection){
                        connectionData.socket.sendUTF(mes.utf8Data)
                    }
                });               
                } else {
                    clients.get(userJson.toUser).socket.sendUTF(mes.utf8Data);                     
                }
                break;

            case 60: //GPS Location
                clients.forEach((connectionData, user) =>{
                    if(connectionData.socket != connection){
                        connectionData.socket.sendUTF(mes.utf8Data)
                    }
                });                
                break;

            case 70: //Command to take photos                                
                clients.get(userJson.toUser).socket.sendUTF(mes.utf8Data);
                break;

            case 80: //Send Photos back to user
                clients.get(userJson.toUser).socket.sendUTF(mes.utf8Data);                               
                break;                   
        }
    });

    connection.on("close", (resCode, des) => {        
        var disconnected_name = "";
        clients.forEach((connectonData, user) => {
            if(connectonData.socket == connection){
                disconnected_name = user;
            }
        });
        clients.delete(disconnected_name);
        console.log(disconnected_name + " Disconected "  + timeStamp() + "  Sockets online: " + clients.size);

        if(clients.size > 0){
            connected_names.length = 0;
            clients.forEach((connectionData, user) => {
                connected_names.push(user);
            });  
            serverObject = {code: 20, fromUser: disconnected_name, usersList: connected_names};
            clients.forEach((conectionData, user) =>{
                conectionData.socket.sendUTF(JSON.stringify(serverObject));                    
            });           
        }
    });
});
