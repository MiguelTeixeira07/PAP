const form=document.querySelector("form");
const notificationMsg=document.getElementById("errorMsg");

form.addEventListener("submit",(e)=>{
   e.preventDefault();
   
   const fd=new FormData(form);
   
   const urlEncoded=new URLSearchParams(fd).toString();
   
   fetch("http://192.168.1.76:8000/login",{
      method: "POST",
      body: urlEncoded,
      headers: {
         "Content-type":"application/x-www-form-urlencoded",
      }
   })
   .then(res=>res.json())
   .then(data=>{
      const success=data.success;
      const errormsg=data.errormsg;
      
      if(success)
      {
         location.href="HTML/main_page.html";
      } else {
         notification(errormsg);
         console.log(errormsg);
      }
   })
   .catch(err=>console.error("Error:",err));
})

function notification(message) {
   notificationMsg.innerHTML=message;
}

function back() {
   location.href="../index.html";
}