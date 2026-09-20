import fs from "node:fs";
import pg from "pg";
const { Pool } = pg;
if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:false}:undefined});
const sql=fs.readFileSync(new URL("../db/schema.sql",import.meta.url),"utf8");
await pool.query(sql);
console.log("Database schema applied.");
await pool.end();
