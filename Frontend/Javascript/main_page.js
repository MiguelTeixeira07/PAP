const addBtn=document.getElementById('addDivisao');
const roomList=document.getElementById('roomList');
const sidebar=document.getElementById('sidebar');
const menu=document.getElementById('customRoomMenu');
const accMenu=document.getElementById('menuConta');
const movelMenu=document.getElementById('custoMovelMenu');
const accountButton=document.getElementById('account');
const addMovelBtn=document.getElementById('addMovel');

let selectedRoom;
let loggedUser;

//lista das divisões
async function renderRoomList() {
   await fetch("http://25.49.11.93:8000/rooms")
   .then(res=>res.json())
   .then(data=>{
      const rooms=data.rooms;
      
      //Esvazia a lista
      roomList.innerHTML='';

      //apaga todas as divisoes da lista
      sidebar.querySelectorAll('button.roomAccordion').forEach(btn=>btn.remove());

      //Adiciona as divisões à lista
      rooms.forEach((room,i)=>{
         const li=document.createElement('button');
         li.className='roomAccordion';
         li.id="room"+(i+1);
         console.log(li.id);
         li.innerHTML=room.nome;
         
         sidebar.insertBefore(li,addBtn);
         
         document.addEventListener("click", function() {
            menu.style.display = "none";
         });

         li.addEventListener("click",function(e) {
            if (selectedRoom === e.target) {
               selectedRoom = null;

               // Apaga os móveis
               sidebar.querySelectorAll('button.movelAccordion').forEach(btn => btn.remove());
               const movelListDiv = document.getElementById('movelList');
               if (movelListDiv) movelListDiv.remove();
               return;
            }

            if (selectedRoom) {
               sidebar.querySelectorAll('button.movelAccordion').forEach(btn => btn.remove());
               const movelListDiv = document.getElementById('movelList');
               if (movelListDiv) movelListDiv.remove();
            }

            // Caso contrário, activa nova divisão
            selectedRoom = e.target;
            renderMovelList(e.target.innerHTML); // carrega os móveis correctos
         });

         li.addEventListener("contextmenu",function(e) {
            e.preventDefault();
            selectedRoom=e.target;
            
            const rect=li.getBoundingClientRect();
            
            menu.style.left = `${rect.right + window.scrollX}px`;
            menu.style.top = `${rect.top}px`;
            menu.style.display = "flex";

            addMovelBtn.onclick = () => suggestAddMovel(i+1);
         });
      });
   }).catch(err=>console.error("Error:",err));
}

//lista dos móveis
async function renderMovelList(roomName) {
   const existingList = document.querySelector(`[data-room='${roomName}']`);
   if (existingList) {
      existingList.style.display = existingList.style.display === "none" ? "block" : "none";
      return;
   }

   await fetch("http://25.49.11.93:8000/moveis", {
      method: "POST",
      headers:{ "Content-type": "application/json" },
      body: JSON.stringify({ nome: roomName })
   })
   .then(res => res.json())
   .then(data => {
      const moveis = data.moveis;
      
      if (!moveis || moveis.length === 0) return;
      
      let movelListDiv = document.createElement("div");
      movelListDiv.id="movelList";
      movelListDiv.className = "movelListDiv";
      movelListDiv.dataset.room = roomName;
      movelListDiv.style.marginLeft = "20px";

      const roomButton = [...document.querySelectorAll(".roomAccordion")]
      .find(btn => btn.innerText === roomName);
      sidebar.insertBefore(movelListDiv, roomButton.nextSibling);
      
      sidebar.querySelectorAll('button.movelAccordion').forEach(btn => btn.remove()); // segurança

      moveis.forEach((movel, i) => {
         const newMovel = document.createElement('button');
         newMovel.className = 'movelAccordion';
         newMovel.id = "movel" + (i + 1);
         newMovel.innerHTML = movel.nome;

         movelListDiv.appendChild(newMovel);

         newMovel.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            selectedRoom = e.target;

            const rect = newMovel.getBoundingClientRect();

            movelMenu.style.left = `${rect.right + window.scrollX}px`;
            movelMenu.style.top = `${rect.top}px`;
            movelMenu.style.display = "flex";
         });
      });
   })
   .catch(err => console.error("Error:", err));
}


//mostra as opcoes da conta
accountButton.addEventListener("click",function(e) {
   e.preventDefault();
   
   e.stopPropagation();
   const rect=accountButton.getBoundingClientRect();
   
   accMenu.style.left = `${rect.left + window.scrollX}px`;
   accMenu.style.top = `${rect.bottom + window.scrollY}px`;
   accMenu.style.display = "flex";
});

//Formulário para adicionar divisão
function suggestAddRoom() {
   if (document.querySelector('.newRoomDiv')) return;
   
   const newRoomDiv=document.createElement('div');
   newRoomDiv.className='newRoomDiv';
   newRoomDiv.innerHTML=`
   <form autocomplete="off">
   <input type="text" name="nomeDivisao" id="newRoomName" placeholder="Nome da nova divisão">
   <div id="buttonsDiv">
   <button id="cancel">Cancelar</button>
   <button type="submit" id="confirm">Confirmar</button>
   </div>
   </form>
   `;
   
   sidebar.insertBefore(newRoomDiv,addBtn);
   
   
   //Ação do botão "Cancelar"
   newRoomDiv.querySelector('#cancel').addEventListener('click', (e) => {
      e.preventDefault();
      
      newRoomDiv.remove();
   });
   
   //Ação do botão "Confirmar"
   const form=document.querySelector("form");
   form.addEventListener('submit',(e)=>{
      e.preventDefault();
      
      const fd=new FormData(form);
      const urlEncoded=new URLSearchParams(fd).toString();
      fetch("http://25.49.11.93:8000/newRoom",{
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
         
         addRoom(success,errormsg);
      }).catch(err=>console.error("Error:",err));
   });
}

//Adiciona a nova divisão
function addRoom(success,errormsg) {
   if(success) {
      location.reload();
      newRoomDiv.remove();
   } else {
      const popup=document.getElementById("popupConfirmacao");
      const msg=document.getElementById("popupMensagem");
      
      msg.textContent=errormsg;
      popup.style.display="flex";
      
      const cancelar=document.getElementById("cancelarBtn");
      const confirmar=document.getElementById("confirmarBtn");
      
      confirmar.style.display="none";
      
      let oldCancel=cancelar.innerHTML;
      cancelar.innerHTML="Ok";
      
      const fecharPopup=()=>{
         popup.style.display = "none";
         cancelar.innerHTML=oldCancel;
      }
      
      cancelar.onclick = fecharPopup;
      console.log(errormsg);
   }
}

//apaga uma divisão
function delRoom() {
   let roomName=selectedRoom.innerHTML;
   let popup=document.getElementById("popupConfirmacao");
   let msg=document.getElementById("popupMensagem");
   
   msg.textContent=`Queres mesmo apagar a divisão "${roomName}"?`;
   popup.style.display="flex";
   
   let confirmar=document.getElementById("confirmarBtn");
   confirmar.style.display="block";
   let cancelar=document.getElementById("cancelarBtn");
   
   const fecharPopup=()=>popup.style.display = "none";
   
   confirmar.onclick=()=> {
      fecharPopup();
      fetch("http://25.49.11.93:8000/delRoom", {
         method: "POST",
         headers:{ "Content-type": "application/json" },
         body: JSON.stringify({ nome: roomName })
      }).catch(err => console.error("Erro:", err));
      
      location.reload();
   };
   
   cancelar.onclick = fecharPopup;
}

function suggestAddMovel(room) {
   if (document.querySelector('.newMovelDiv')) return;
   
   let roomTag=document.getElementById('room'+room);
   
   const newMovelDiv=document.createElement('div');
   newMovelDiv.className='newMovelDiv';
   newMovelDiv.innerHTML=`
   <form autocomplete="off">
   <input type="text" name="nomeMovel" id="newMovelName" placeholder="Nome do novo móvel">
   <div id="buttonsDiv">
   <button id="cancel">Cancelar</button>
   <button type="submit" id="confirm">Confirmar</button>
   </div>
   </form>
   `;
   
   sidebar.insertBefore(newMovelDiv,roomTag.nextSibling);
   
   //Ação do botão "Cancelar"
   newMovelDiv.querySelector('#cancel').addEventListener('click', (e) => {
      e.preventDefault();
      
      newMovelDiv.remove();
   });
   
   //Ação do botão "Confirmar"
   const form=document.querySelector("form");
   form.addEventListener('submit',(e)=>{
      e.preventDefault();
      
      const fd=new FormData(form);
      fd.append("divisao",roomTag.innerHTML);
      const urlEncoded=new URLSearchParams(fd).toString();
      fetch("http://25.49.11.93:8000/newMovel",{
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
         
         addRoom(success,errormsg);
      }).catch(err=>console.error("Error:",err));
   });
}

function addMovel() {
   if(success) {
      location.reload();
      newRoomDiv.remove();
   } else {
      const popup=document.getElementById("popupConfirmacao");
      const msg=document.getElementById("popupMensagem");
      
      msg.textContent=errormsg;
      popup.style.display="flex";
      
      const cancelar=document.getElementById("cancelarBtn");
      const confirmar=document.getElementById("confirmarBtn");
      
      confirmar.style.display="none";
      
      let oldCancel=cancelar.innerHTML;
      cancelar.innerHTML="Ok";
      
      const fecharPopup=()=>{
         popup.style.display = "none";
         cancelar.innerHTML=oldCancel;
      }
      
      cancelar.onclick = fecharPopup;
      console.log(errormsg);
   }
}

//por o nome do utilizador no botão da conta
function setUser() {
   accountButton.innerHTML+=loggedUser;
}

//logout
function logout() {
   fetch("http://25.49.11.93:8000/logout")
   .then(res=>res.json())
   .then(data=>{
      loggedUser=data.logged_user;
      location.reload();
   });
}

document.addEventListener('DOMContentLoaded',async function(){
   await fetch("http://25.49.11.93:8000/loggedUser")
   .then(res=>res.json())
   .then(data=>{
      loggedUser=data.logged_user;
   });
   
   if(!(loggedUser&&loggedUser.trim()!=="")) {
      location.replace("choose_login.html");
      return;
   }
   
   renderRoomList();
   setUser();
});

document.addEventListener("click", function() {
   accMenu.style.display = "none";

   if (!menu.contains(e.target)) menu.style.display = "none";
   if (!movelMenu.contains(e.target)) movelMenu.style.display = "none";
});