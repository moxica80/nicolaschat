var btn_chat = document.querySelector("#chat_btn");
var btn_my_spot = document.querySelector("#my_spot_btn");

btn_chat.addEventListener("click", ()=>{  

    btn_chat.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = "https://drive.google.com/uc?export=download&id=13-IjaSSxiFRXNdGLbbVTgX0lh3UUCBeb";
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

