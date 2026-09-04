require('dotenv').config();
const express=require('express');

const pool=require('./src/db');

const app=express();

const PORT=process.env.PORT || 3000;

app.use(express.json());

app.use(express.static('public'));

const chirurghiRoutes=require('./src/routes/chirurghiRoutes');
app.use(chirurghiRoutes);

app.listen(PORT, ()=>{
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});