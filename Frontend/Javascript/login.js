const form=document.querySelector("form");
const notificationMsg=document.getElementById("errorMsg");
const username=document.getElementById('username');
const password=document.getElementById('password');

form.addEventListener("submit",(e)=>{
   e.preventDefault();

   const regex=/['",()\/\\|&%$#€§`]/;

   if(regex.test(username.value)||username.value=="") {
      username.placeholder="Nome de utilizador inválido";
      username.value="";
      return;
   }
   if(password.value=="") {
      password.placeholder="Palavra-passe tem de ter valor";
      return;
   }
   if(regex.test(password.value)) {
      password.placeholder="Palavra passe não pode conter "+'"['+"'"+'",()\/\\|&%$#€§`]';
      password.value="";
      return;
   }
   
   const fd=new FormData(form);
   
   const urlEncoded=new URLSearchParams(fd).toString();
   
   fetch("http://25.49.11.93:8000/login",{
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
      
      if(!success){
         notification(errormsg);
      }else{
         location.replace("index.html");
      }
   }).catch(err=>console.error("Error:",err));
});

function notification(message) {
   notificationMsg.innerHTML=message;
}

function back() {
   location.replace("choose_login.html");
}