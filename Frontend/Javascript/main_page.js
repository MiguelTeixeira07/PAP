const addBtn=document.getElementById('addDivisao');
const roomList=document.getElementById('roomList');
const sidebar=document.getElementById('sidebar');
const menu=document.getElementById('customRoomMenu');
const accMenu=document.getElementById('menuConta');
const accountButton=document.getElementById('account');
const addMovelBtn=document.getElementById('addMovel');
const addItemBtn=document.getElementById('addItem');
const searchbar=document.getElementById("searchBar");
const searchButton=document.getElementById("pesquisar");

let selectedRoom;
let selectedMovel
let loggedUser;

let tempoAtualizacao = {};

searchButton.addEventListener("click",function(e){
   e.preventDefault();

   if(selectedRoom){
      if(selectedMovel){
         renderItemList(selectedRoom.innerHTML,selectedMovel.innerHTML,searchbar.value);
         return;
      }

      renderItemList(selectedRoom.innerHTML,null,searchbar.value);
      return;
   }

   renderItemList(null,null,searchbar.value);
});

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
         const roomBtn=document.createElement('button');
         roomBtn.className='roomAccordion';
         roomBtn.id="room"+(i+1);
         console.log(roomBtn.id);
         roomBtn.innerHTML=room.nome;
         
         sidebar.insertBefore(roomBtn,addBtn);
         
         document.addEventListener("click", function() {
            menu.style.display = "none";
         });

         roomBtn.addEventListener("click",function(e) {
            if (selectedRoom === e.target) {
               selectedRoom = null;

               // Apaga os móveis
               sidebar.querySelectorAll('button.movelAccordion').forEach(btn => btn.remove());
               const movelListDiv = document.getElementById('movelList');
               if (movelListDiv) location.reload();
               return;
            }

            if (selectedRoom) {
               sidebar.querySelectorAll('button.movelAccordion').forEach(btn => btn.remove());
               const movelListDiv = document.getElementById('movelList');
               if (movelListDiv) movelListDiv.remove();
            }

            // Caso contrário, activa nova divisão
            selectedRoom = e.target;
            renderMovelList(selectedRoom.innerHTML); // carrega os móveis correctos

            renderItemList(selectedRoom.innerHTML);
         });

         roomBtn.addEventListener("contextmenu",function(e) {
            e.preventDefault();
            selectedRoom=e.target;
            
            const rect=roomBtn.getBoundingClientRect();
            
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

         newMovel.addEventListener("click", function(e) {
            e.preventDefault();
            selectedMovel=e.target;

            renderItemList(roomName,selectedMovel.innerHTML);
         })

         newMovel.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            selectedMovel = e.target;

            const rect = newMovel.getBoundingClientRect();
            const movelMenu = document.getElementById("customMovelMenu");

            movelMenu.style.left = `${rect.right + window.scrollX}px`;
            movelMenu.style.top = `${rect.top}px`;
            movelMenu.style.display = "flex";

            addItemBtn.onclick = () => suggestAddItem(roomName,selectedMovel);
         });
      });
   })
   .catch(err => console.error("Error:", err));
}

//lista dos itens
async function renderItemList(divisao,movel) {
   const container = document.getElementById("itemList");
   container.innerHTML = "";

   await fetch("http://25.49.11.93:8000/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         divisao: divisao,
         movel: movel,
         searchTerm: searchbar.value
      })
   }).then(res => res.json())
   .then(data => {
      if (!data.success) {
         container.innerHTML = `<p>${data.errormsg}</p>`;
         return;
      }

      data.items.forEach(item => {
         const div = document.createElement("div");
         div.className = "item";

         div.innerHTML = `
            <p class="itemName">${item.nome}</p>
            <div class="itemCountContainer">
               <button class="countButton countPlus">+</button>
               <div class="itemCountDiv"><p class="itemCount">${item.quantidade}</p></div>
               <button class="countButton countMinus">-</button>
            </div>
            <button class="itemButton delItem">Eliminar item</button>
         `;

         div.querySelector(".countPlus").onclick = () => {
            const count = div.querySelector(".itemCount");
            count.innerText = parseInt(count.innerText) + 1;

            clearTimeout(tempoAtualizacao[item.nome]);
            tempoAtualizacao[item.nome] = setTimeout(() => {
               actualizarQuantidadeBD(item.nome,count.innerText);
            }, 1500);
         };

         div.querySelector(".countMinus").onclick = () => {
            const count = div.querySelector(".itemCount");
            const valor = parseInt(count.innerText);
            if (valor > 0) count.innerText = valor - 1;

            clearTimeout(tempoAtualizacao[item.nome]);
            tempoAtualizacao[item.nome] = setTimeout(() => {
               actualizarQuantidadeBD(item.nome,count.innerText);
            }, 1500);
         };

         div.querySelector(".delItem").onclick = () => {
            fetch("http://25.49.11.93:8000/delItem",{
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({nome: item.nome})
            })

            location.reload();
         };

         container.appendChild(div);
      });
   });
}

function actualizarQuantidadeBD(nomeItem, novaQtd, movel) {
  fetch("http://25.49.11.93:8000/atualizarQuantidade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: nomeItem, quantidade: novaQtd, movel: movel })
  })
  .then(res => res.json())
  .then(data => {
    if(!data.success) {
      console.error("Erro ao atualizar:", data.errormsg);
    }
  });

  location.reload();
}

function configurarItem(itemDiv) {
   const nome = itemDiv.dataset.nome;
   const count = itemDiv.querySelector(".itemCount");
   const btnMais = itemDiv.querySelector(".countPlus");
   const btnMenos = itemDiv.querySelector(".countMinus");

   const actualizarVisual = (delta) => {
      let qtd = parseInt(count.innerText);

      qtd += delta;
      count.innerText = qtd;

      clearTimeout(tempoAtualizacao[nome]);
      tempoAtualizacao[nome] = setTimeout(() => {
         actualizarQuantidadeBD(nome, qtd);
      }, 3000);
   };

  btnMais.addEventListener("click", () => actualizarVisual(1));
  btnMenos.addEventListener("click", () => actualizarVisual(-1));
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

function delMovel() {
   let movelName=selectedMovel.innerHTML;
   let popup=document.getElementById("popupConfirmacao");
   let msg=document.getElementById("popupMensagem");
   
   msg.textContent=`Queres mesmo apagar o móvel "${movelName}"?`;
   popup.style.display="flex";
   
   let confirmar=document.getElementById("confirmarBtn");
   confirmar.style.display="block";
   let cancelar=document.getElementById("cancelarBtn");
   
   const fecharPopup=()=>popup.style.display = "none";
   
   confirmar.onclick=()=> {
      fecharPopup();
      fetch("http://25.49.11.93:8000/delMovel", {
         method: "POST",
         headers:{ "Content-type": "application/json" },
         body: JSON.stringify({ nome: movelName,nomeRoom: selectedRoom.innerHTML })
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

// Abrir popup quando clicas na opção "Adicionar item"
function suggestAddItem(room,movel) {
   const popup = document.getElementById("popupItem");
   popup.style.display = "flex";

   document.getElementById("cancelarNovoItem").onclick = () => {
      popup.style.display = "none";
   };

   document.getElementById("confirmarNovoItem").onclick = async () => {
      const nomeItem = document.getElementById("nomeNovoItem");
      const quantItem=document.getElementById("quantidadeInput");
      
      if (!nomeItem.value.trim()) {
         nomeItem.placeholder="Nome inválido";
         return;
      }
      if (!quantItem.value||quantItem.value<1||/[^0-9]/.test(quantItem.value)) {
         quantItem.placeholder="Quantidade inválida";
         quantItem.value="";
         return;
      }

      popup.style.display = "none";

      // Enviar para backend
      const res = await fetch("http://25.49.11.93:8000/newItem", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            nome: nomeItem.value.trim(),
            quant:quantItem.value,
            movel: movel.innerHTML,
            room: room
         })
      });

      const data = await res.json();
      if (data.success) {
         location.reload();
      } else {
         alert(data.errormsg);
      }
   };
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
   renderItemList(null,null);
});

document.addEventListener("click", function(e) {
   accMenu.style.display = "none";

   //if (!menu.contains(e.target)) menu.style.display = "none";
   if (menu && !menu.contains(e.target)) menu.style.display = "none";
   
   const movelMenu = document.getElementById("customMovelMenu");
   if (movelMenu && !movelMenu.contains(e.target)) {
      movelMenu.style.display = "none";
   }
});