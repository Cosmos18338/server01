import express from "express";
import multer from "multer";
import moment from "moment";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const defaultData = { user: [], products: [] };
const db = new Low(new JSONFile("db.json"), defaultData);
await db.read();

let upload = multer();

let whitelist = ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://127.0.0.1:3000"];
let corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("不允許連線"));
    }
  },
};

const app = express();

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("首頁");
});

app.get("/api/users", (req, res) => {
  const users = db.data.user.map((user) => {
    const { id, password, ...others } = user;
    return others;
  });
  const message = `獲取所有使用者成功`;
  res.status(200).json({ result: "success", message, data: users });
});

// 檢查帳號有沒有被使用
app.get("/api/users/account", async (req, res) => {
  const {account} = req.query;
  let message = "帳號沒有被使用";
  let result = db.data.user.find(u => u.account == account);
  if(result){
    message = "帳號已經被使用";
    return res.status(400).json({result: "fail", message});
  };
  res.status(200).json({result: "success", message});
});

// 檢查mail有沒有被使用
app.get("/api/users/mail", async (req, res) => {
  const {mail} = req.query;
  let message = "mail沒有被使用";
  let result = db.data.user.find(u => u.mail == mail);
  if(result){
    message = "mail已經被使用";
    return res.status(400).json({result: "fail", message});
  };
  res.status(200).json({result: "success", message});
});

app.listen(3005, () => {
  console.log("Server is running on http://localhost:3005");
});

function checkToken(req, res, next) {
  let token = req.get("Authorization");
  if (token && token.indexOf("Bearer ") == 0) {
    token = token.slice(7);
    jwt.verify(token, process.env.SECRET_KEY, (error, decoded) => {
      if (error) {
        return res.status(401).json({
          result: "fail",
          message: "驗證失敗，請重新登入",
        });
      }
      req.decoded = decoded;
      next();
    })
  } else {
    return res.status(401).json({
      result: "fail",
      message: "無驗證資料，請重新登入",
    });
  }
}
