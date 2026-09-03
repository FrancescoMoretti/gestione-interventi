require('dotenv').config;
const express=require('express');

const pool=require('./src/db');

const app=express();

const PORT=process.env.PORT || 3000;

/*app.get('/', async (req, res)=>{
    const [rows]=await pool.query('SELECT 1+1 AS risultato');
    res.json(rows[0]);
});*/

app.listen(PORT, ()=>{
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});