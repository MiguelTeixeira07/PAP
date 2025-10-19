const express=require("express");
const app=express();
const port=8000;
const sql=require("mssql");

class loggedUser {
   username=null;
   codUser=null;
}

const config={
   user: "sa",
   password: "CPtis2024",
   server: "MaquinaDaCasa",
   database: "MTStorage",
   options: {
      encrypt: true,
      trustServerCertificate: true,
   },
};

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('Frontend'));


//login
app.post("/login",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,(err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      //verifica se o username e a password estão corretos
      const searchQuery="select * from users where username='"+req.body.username+"' and pass='"+req.body.password+"'";
      
      request.query(searchQuery,(err,result)=>{
         if(err){
            console.log(err);
         }
         
         //envia o resultado para o front end
         if(!(result.recordset===undefined||result.recordset.length<1)){
            res.json({success:true});
            loggedUser.username=result.recordset[0].username;
            loggedUser.codUser=result.recordset[0].codUser;
         }else{
            res.json({success:false,errormsg:"Nome de Utilizador ou Palavra-Passe incorretos"});
         }

         sql.close();
      });
   });
});

//logout
app.get("/logout",async (req,res)=>{
   loggedUser.username=null;
   loggedUser.codUser=null;

   res.json({logged_user:null});
});

//envia o utilizador que está com sessão iniciada
app.get("/loggedUser",(req,res)=>{
   res.json({logged_user:loggedUser.username});
});

//criar conta
app.post("/register",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,(err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      //verifica se o username ou email já existem
      const searchQuery="select * from users where username='"+req.body.username+"' or email='"+req.body.email+"'";
      
      request.query(searchQuery,(err,result)=>{
         if(err){
            console.log(err);
         }

         if(result.recordset===undefined||result.recordset.length<1){
            //regista o novo utilizador na base de dados
            const insertQuery="INSERT INTO users(username,pass,email) values('"+req.body.username+"','"+req.body.password+"','"+req.body.email+"');";

            request.query(insertQuery,(error,result2)=>{
               if(err){
                     console.log(error);
               }

               sql.close();
            });

            res.json({success:true});
         }else{
            res.json({success:false,errormsg:"Nome de Utilizador ou Email já existem"});
         }
      });
   });
});

//vai buscar a lista das divisões
app.get("/rooms",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,(err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      //Pesquisa os quartos e os compartimentos de cada quarto
      const roomsQuery="select * from rooms where codUser="+loggedUser.codUser+"";
      
      request.query(roomsQuery,(err,result)=>{
         res.json({rooms: result.recordset});
      });
   });
});

//criar divisão
app.post("/newRoom",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,(err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      //verifica se o username ou email já existem
      const searchQuery="select * from rooms where nome='"+req.body.nomeDivisao+"' and codUser="+loggedUser.codUser+"";
      
      request.query(searchQuery,(err,result)=>{
         if(err){
            console.log(err);
         }

         if(result.recordset===undefined||result.recordset.length<1){
            //regista o novo utilizador na base de dados
            const insertQuery="INSERT INTO rooms(nome,codUser) values('"+req.body.nomeDivisao+"',"+loggedUser.codUser+");";

            request.query(insertQuery,(error,result2)=>{
               if(error){
                     console.log(error);
               }

               sql.close();
            });

            res.json({success:true});
         }else{
            res.json({success:false,errormsg:"A divisão já existe"});
         }
      });
   });
});

app.post("/moveis",async (req,res)=>{
   sql.connect(config,async (err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      let cod_room=await request.query("select codRoom from rooms where nome='"+req.body.nome+"' and codUser="+loggedUser.codUser);

      const searchQuery="select * from moveis where codRoom="+cod_room.recordset[0].codRoom;

      request.query(searchQuery,async (error,result)=>{
         if(error) {
            console.log(error);
         }
         res.json({moveis: result.recordset});
      });
   });
});

//Adiciona um novo móvel à base de dados
app.post("/newMovel",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,async (err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      let cod_room=await request.query("select codRoom from rooms where nome='"+req.body.divisao+"' and codUser="+loggedUser.codUser);

      //verifica se o username ou email já existem
      const searchQuery="select * from moveis where nome='"+req.body.nomeMovel+"' and codRoom="+cod_room.recordset[0].codRoom;
      
      request.query(searchQuery,(err,result)=>{
         if(err){
            console.log(err);
         }

         if(result.recordset===undefined||result.recordset.length<1){
            //regista o novo utilizador na base de dados
            const insertQuery="INSERT INTO moveis(nome,codRoom) values('"+req.body.nomeMovel+"',"+cod_room.recordset[0].codRoom+");";

            request.query(insertQuery,(error,result2)=>{
               if(error){
                     console.log(error);
               }

               sql.close();
            });

            res.json({success:true});
         }else{
            res.json({success:false,errormsg:"O móvel já existe"});
         }
      });
   });
});

//apaga uma divisão da base de dados
app.post("/delRoom",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,(err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      //verifica se o username ou email já existem
      const deleteQuery="delete from rooms where nome='"+req.body.nome+"' and codUser="+loggedUser.codUser;
      
      request.query(deleteQuery);
   });
});

app.post("/delMovel",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,async (err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      let cod_room=await request.query("select codRoom from rooms where nome='"+req.body.nomeRoom+"' and codUser="+loggedUser.codUser);

      //verifica se o username ou email já existem
      const deleteQuery="delete from moveis where nome='"+req.body.nome+"' and codRoom="+cod_room.recordset[0].codRoom;
      
      request.query(deleteQuery);
   });
});

app.post("/newItem",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,async (err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      let cod_room=await request.query("select codRoom from rooms where nome='"+req.body.room+"' and codUser="+loggedUser.codUser);

      let cod_movel=await request.query("select codMovel from moveis where nome='"+req.body.movel+"' and codRoom="+cod_room.recordset[0].codRoom);
      
      //verifica se o username ou email já existem
      let itemCheck=await request.query("select * from iitens where nome='"+req.body.nome+"'");

      if(itemCheck.recordset===undefined||itemCheck.recordset.length<1){
         //regista o novo utilizador na base de dados
         const insertQuery="INSERT INTO itens(nome,quantidade,codMovel) values('"+req.body.nome+"','"+req.body.quant+"',"+cod_movel.recordset[0].codMovel+");";

         request.query(insertQuery);

         res.json({success:true});
      }else{
         res.json({success:false,errormsg:"O item já existe"});
      }
   });
});

app.post("/items", async (req, res) => {
   sql.connect(config, async (err) => {
      if (err) return res.json({ success: false, errormsg: "Erro na ligação à BD" });
      
      console.log(loggedUser.codUser);
      try {
         const request = new sql.Request();
         
         let query="SELECT i.nome, i.quantidade, r.nome AS divisao, m.nome AS movel FROM itens i JOIN moveis m ON i.codMovel = m.codMovel JOIN rooms r ON m.codRoom = r.codRoom WHERE r.codUser="+loggedUser.codUser;

         if (req.body.divisao) {
            query+=" AND r.nome='"+req.body.divisao+"'";
            console.log(query);
         }

         if (req.body.movel) {
            query+=" AND m.nome='"+req.body.movel+"'";
            console.log(query);
         }

         if(req.body.searchTerm){
            query+=" AND i.nome LIKE '%"+req.body.searchTerm+"%'"
            console.log(query);
         }

         const result = await request.query(query);
         res.json({ success: true, items: result.recordset });

      } catch (e) {
         console.error(e);
         res.json({ success: false, errormsg: "Erro ao obter itens" });
      }
   });
});

app.post("/atualizarQuantidade",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,async (err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      request.query("update itens set quantidade="+req.body.quantidade+" where nome='"+req.body.nome+"'");
   });
});

app.post("/delItem",async (req,res)=>{
   //estabelece a ligação com a base de dados
   sql.connect(config,async (err)=>{
      if(err){
         console.log(err);
      }

      const request=new sql.Request();

      let cod_item=await request.query("SELECT i.codItem FROM itens i JOIN moveis m ON i.codMovel = m.codMovel JOIN rooms r ON m.codRoom = r.codRoom WHERE i.nome='"+req.body.nome+"' AND r.codUser="+loggedUser.codUser);

      const deleteQuery="delete from itens where codItem="+cod_item.recordset[0].codItem;
      
      request.query(deleteQuery);
   });
})

app.listen(port,"25.49.11.93");