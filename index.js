require('dotenv').config();
const express=require('express');
const path=require('path');

const pool=require('./src/config/db');
const {keepAlive, errorHandler, createNotFoundHandler, createFaviconHandler}=require('express-mysql-cloudinary-kit');
keepAlive(pool);//funzione di keepalive per non far andare il db (Aiven) in timeout

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

//inncludo libreria per script frontend
app.use('/lib', express.static(
    path.join(path.dirname(require.resolve('express-mysql-cloudinary-kit/package.json')), 'client')
));

//favicon
app.get("/favicon.ico", createFaviconHandler(path.join(__dirname, "favicon.ico")));

//404
app.use(createNotFoundHandler(path.join(__dirname, 'public')));

//handler per errori non gestiti
app.use(errorHandler);

app.listen(PORT, ()=>{
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});