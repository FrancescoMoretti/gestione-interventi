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

const statisticheRoutes=require('./src/routes/statisticheRoutes');
app.use(statisticheRoutes);

const tavoliRoutes=require('./src/routes/tavoliRoutes');
app.use(tavoliRoutes);

//serve i file statici della cartella public
app.use(express.static('public'));

//favicon
app.get("/favicon.ico", (req, res)=>{
    res.set("Cross-Origin-Resource-Policy", "cross-origin");//permetto il recupero del favicon da altre origini
    res.sendFile(__dirname+"/favicon.ico");
});

//404
app.use((req, res)=>{
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));//cosi rimane il nome del file non trovato nel browser
});

//handler per errori non gestiti
app.use((err, req, res, next)=>{
    console.error("Errore non gestito: ", err);
    res.status(err.status || 500).json({
        success: false,
        message: "Errore interno lato server."
    });
});

app.listen(PORT, ()=>{
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});