   const express=require("express");                                                                                                            //     __   __ _______ _______ 
   const app=express();                                                                                                                         //    |  |_|  |       |       |
   const port=8000;                                                                                                                             //    |       |_     _|  _____|
   const sql=require("mssql");                                                                                                                  //    |       | |   | | |_____ 
//                                                                                                                                              //    |       | |   | |_____  |
//                                                                                                                                              //    | ||_|| | |   |  _____| |
const config={                                                                                                                                  //    |_|   |_| |___| |_______|
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
      const searchQuery="select pass from users where username='"+req.body.username+"' and pass='"+req.body.password+"'";
      
      request.query(searchQuery,(err,result)=>{
         if(err){
            console.log(err);
         }
         
         //envia o resultado para o front end
         if(!(result.recordset===undefined||result.recordset.length<1)){
            res.json({success:true});
         }else{
            res.json({success:false,errormsg:"Nome de Utilizador ou Palavra-Passe incorretos"});
         }

         sql.close();
      });
   });
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

app.listen(port);