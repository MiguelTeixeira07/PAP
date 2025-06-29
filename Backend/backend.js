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
      const deleteQuery="delete from rooms where nome='"+req.body.nome+"'";
      
      request.query(deleteQuery);
   });
});

app.listen(port,"25.49.11.93");