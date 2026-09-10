const express=require('express');
const router=express.Router();
const pool=require('../db');
const {cloudinary, upload, uploadToCloudinary}=require('../cloudinaryConfig');
const gestioneErroriUpload=require('../middleware/images');
const {validaStringa}=require('../utils/validazione');


//endpoint per inserimento interventi
router.post("/api/intervento", upload.array("immagini"), async (req, res)=>{
    
});

//endpoint per cancellazione interventi


//endpoint per lista interventi


//endpoint per dettagli intervento


//endpoint per aggiornamento intervento


router.use(gestioneErroriUpload);//gestione degli errori durante l'upload delle immagini

module.exports=router;