const express = require("express");
const cors = require("cors");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let connection;

(async () => {
  try {
    connection = await oracledb.getConnection({
      user: "attendly",
      password: "attendly123",
      connectString: "localhost/XE"
    });
    console.log("✅ Oracle Database connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
})();

// Login
app.post("/api/login", async (req,res)=>{
  const {username,password}=req.body;
  try{
    const result = await connection.execute(
      `SELECT * FROM admin WHERE username = :username`, [username]
    );
    if(result.rows.length===0) return res.status(401).json({message:"User not found"});
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user[2]);
    if(!valid) return res.status(401).json({message:"Invalid password"});
    const token = jwt.sign({username}, "supersecretkey",{expiresIn:"1h"});
    res.json({token});
  }catch(err){ res.status(500).json({error:err.message}); }
});

// Mark Attendance
app.post("/api/attendance", async (req,res)=>{
  const {student_name,status} = req.body;
  try{
    await connection.execute(
      `INSERT INTO attendance (student_name,status) VALUES (:name,:status)`,
      [student_name,status],
      {autoCommit:true}
    );
    res.json({message:"Attendance recorded"});
  }catch(err){ res.status(500).json({error:err.message}); }
});

app.listen(5000,()=>console.log("🚀 Server running at http://localhost:5000"));
