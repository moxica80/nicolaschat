var btn_chat = document.querySelector("#chat_btn");
var btn_my_spot = document.querySelector("#my_spot_btn");

btn_chat.addEventListener("click", ()=>{      
    const a = document.createElement("a");
    a.href = "https://github.com/moxica80/nicolaschat/releases/download/v3.0/chat_app_3.0.apk";
    a.setAttribute("download", "chat-app.png");
    a.click();
    a.remove();
});   
    

// btn_my_spot.addEventListener("click", ()=>{  
//     var a = document.createElement("a");      
//     a.href = "https://drive.google.com/file/d/1U6DSzDo6jjUCRcIG3LpMvBFWb8qYIp2v/view?usp=drive_link"
//     a.referrerPolicy = "origin";
//     a.setAttribute("download", "chat-app.png");    
//     a.click();
//     a.remove();    
// });

