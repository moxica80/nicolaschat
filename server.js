const SocketServer = require("websocket").server;
const express = require("express");
const app = express();
const path = require("path");
const fs = require('fs');
const multer  = require('multer');
const {Readable} = require('stream');

const port = process.env.port || 3000;
var doubleNameCouter = 0;
const connections = [];
const connected_names = [];
const avatars = {};
var serverObject = {};
const VERSION = "2.0";
const UPDATE_URL = ""

var server = app.listen(port, ()=>{    
    console.log("Server Listen on port", port);
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

app.post("/set_my_avatar", (req, res) => {     
    if(req.files){                         
        console.log(req.files[0].originalname +  " set avatar");
        avatars[req.files[0].originalname] = req.files[0].buffer;    
        res.send("Set Avatar done " + req.files[0].originalname);
    }else{
        res.send("Set avatar failed...");
    }  
});  

app.post("/get_user_avatar", (req, res) => {             
    console.log(req.body.fromUser + " request avatar for " + req.body.name);
    let buffer = avatars[req.body.name];    
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
            case 100://Fake message
                //console.log("Fake message from " + userJson.client);
                break;       

            case 7: // User set name
                console.log("Check Double Name: " + userJson.fromUser)
                connected_names.forEach(name =>{
                    if(name == userJson.fromUser){                    
                        doubleNameCouter++;
                        userJson.fromUser = userJson.fromUser + doubleNameCouter;
                        console.log("Rename to " + userJson.fromUser);                   
                    }

                });
                var specialserverObject = {code: 7, fromUser: userJson.fromUser};
                connection.sendUTF(JSON.stringify(specialserverObject));
                break;  

            case 4: // new user connected            
                connections.push(connection);
                connected_names.push(userJson.fromUser);                                
                console.log(userJson.fromUser + " Connected...");           
                serverObject = {code: 4, fromUser: userJson.fromUser, usersList: connected_names};
                connections.forEach((element) => {
                    element.sendUTF(JSON.stringify(serverObject));
                });
                break;    

             case 1: //message
                connections.forEach((element) => {
                    if (element != connection) {
                        element.sendUTF(mes.utf8Data);
                    }
                });
                break;

            case 6: //Private message
                connections[connected_names.indexOf(userJson.toUser)].sendUTF(mes.utf8Data);
                break;

            case 3: //photo received
                if (!userJson.private) {
                connections.forEach((element) => {
                    if (element != connection) {
                        element.sendUTF(mes.utf8Data);
                    }
                });
                } else {
                    connections[connected_names.indexOf(userJson.toUser)].sendUTF(mes.utf8Data);
                }
                break;

            case 10: //GPS Location
                connections.forEach((element) => {
                if (element != connection) {
                    element.sendUTF(mes.utf8Data);
                }
                });
                break;

            case 69: //Command to take photos
                connections[connected_names.indexOf(userJson.toUser)].sendUTF(mes.utf8Data);            
                break;

            case 70: //Send Photos back to user
                //console.log(userJson.message);
                connections[connected_names.indexOf(userJson.toUser)].sendUTF(mes.utf8Data);            
                break;       

            case 650: //Version                        
                serverObject = {code: 650, fromUser: userJson.fromUser, LTS_version: VERSION, update_url: UPDATE_URL};            
                connection.sendUTF(JSON.stringify(serverObject));            
                break;        
        }
    });

    connection.on("close", (resCode, des) => {
        if(connections.length > 0){
            var disconnected_name = connected_names[connections.indexOf(connection)];
            console.log(disconnected_name + " Disconected...");        
            delete avatars[disconnected_name];                       
            connected_names.splice(connections.indexOf(connection), 1);
            connections.splice(connections.indexOf(connection), 1);
            serverObject = {code: 5, fromUser: disconnected_name, usersList: connected_names};
            connections.forEach((element) => {
                element.sendUTF(JSON.stringify(serverObject));
            });
        }        
    });
});