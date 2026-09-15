require('dotenv').config();
const express=require('express');
const path=require('path');

const pool=require('./src/db');

const app=express();

const PORT=process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const chirurghiRoutes=require('./src/routes/chirurghiRoutes');
app.use(chirurghiRoutes);

const specialisticheRoutes=require('./src/routes/specialisticheRoutes');
app.use(specialisticheRoutes);

const interventiRoutes=require('./src/routes/interventiRoutes');
app.use(interventiRoutes);

//serve i file statici della cartella public
app.use(express.static('public'));

//404
app.use((req, res)=>{
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));//cosi rimane il nome del file non trovato nel browser
});

app.listen(PORT, ()=>{
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});