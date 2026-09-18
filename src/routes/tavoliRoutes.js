const express=require('express');
const router=express.Router();
const pool=require('../db');
const {cloudinary, upload, uploadToCloudinary}=require('../cloudinaryConfig');
const {gestioneErroriUpload}=require('../middleware/images');

//endpoint per lista immagini tavoli
router.get("/api/intervento/:id/tavoli", async (req, res)=>{
    const {id}=req.params;
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });//400: bad request
    }
    //preparazione query
    const queryIntervento="SELECT id FROM interventi WHERE id=?";
    const queryImmagini="SELECT id, url_immagine FROM tavoli WHERE intervento=? ORDER BY id";
    try{
        const [resultIntervento]=await pool.query(queryIntervento, [id]);
        //intervento non trovato
        if(resultIntervento.length===0){
            return res.status(404).json({
                success: false,
                message: "Intervento non trovato."
            });//404: not found
        }
        //intervento trovato
        const [resultImmagini]=await pool.query(queryImmagini, [id]);
        //tavoli trovati (vale anche se sono 0)
        return res.json({
            success: true,
            tavoli: resultImmagini
        });
    }catch(err){
        console.error("Errore nell'endpoint GET tavoli: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero dei tavoli."
        });
    }
});

//endpoint per inserimento immagine tavolo
router.post("/api/intervento/:id/tavolo", upload.array('immagini'), async (req, res)=>{
    let {id}=req.params;//id intervento
    let files=req.files;//immagini
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });//400: bad request
    }
    //nessuna immagine inserita
    if(!files || files.length===0){
        return res.status(400).json({
            success: false,
            message: "Nessuna immagine fornita."
        });//400: bad request
    }
    //preparazione query
    const queryImmagini="INSERT INTO tavoli (intervento, url_immagine) VALUES (?, ?)";
    const queryIntervento="SELECT id FROM interventi WHERE id=?";
    try{
        const [resultIntervento]=await pool.query(queryIntervento, [id]);
        //intervento non trovato
        if(resultIntervento.length===0){
            return res.status(404).json({
                success: false,
                message: "Intervento non trovato."
            });//404: not found
        }
    }catch(err){
        console.error("Errore nell'endpoint POST tavolo: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero dell'intervento."
        });
    }
    //intervento trovato
    //se ho una sola immagine
    if(files.length===1){
        let idCloudinary=null;
        try{
            //caricamento su cloudinary
            const file=files[0];
            const {imageUrl, publicId}=await uploadToCloudinary(file.buffer, "tavoli");
            idCloudinary=publicId;
            //query inserimento immagine
            await pool.query(queryImmagini, [id, imageUrl]);
            return res.json({
                success: true,
                message: "Immagine inserita con successo!"
            });
        }catch(err){
            try{
                if(idCloudinary){
                    await cloudinary.uploader.destroy(idCloudinary);
                    console.log("Pulizia dell'immagine parzialmente caricata su Cloudinary completata.");
                }
            }catch(cloudinaryErr){
                console.error("Errore durante la pulizia di Cloudinary: ", cloudinaryErr);
            }
            console.error("Errore nell'endpoint POST tavolo: ", err);
            return res.status(500).json({
                success: false,
                message: "Errore interno durante l'inserimento."
            });
        }
    }
    //se ho più immagini => uso connection
    const connection=await pool.getConnection();
    let publicIds=[];//id pubblici delle immagini caricate su cloudinary
    try{
        await connection.beginTransaction();
        //caricamento delle immagini su cloudinary
        for(let i=0; i<files.length; i++){
            const file=files[i];
            const {imageUrl, publicId}=await uploadToCloudinary(file.buffer, "tavoli");
            publicIds.push(publicId);
            //query inserimento immagine
            await connection.execute(queryImmagini, [id, imageUrl]);
        }
        await connection.commit();
        return res.json({
            success: true,
            message: "Immagini inserite con successo!"
        });
    }catch(err){
        await connection.rollback();
        try{
            if(publicIds.length>0){
                for(let i=0; i<publicIds.length; i++){
                    await cloudinary.uploader.destroy(publicIds[i]);
                }
                console.log("Pulizia delle immagini parzialmente caricate su cloudinary completata.");
            }
        }catch(cloudinaryErr){
            console.error("Errore durante la pulizia di Cloudinary", cloudinaryErr);
        }
        console.error("Errore nell'endpoint POST tavolo: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante l'inserimento."
        });
    }finally{
        connection.release();
    }
});

//nedpoint per cancellazione immagine tavolo
router.delete("/api/intervento/:id/tavolo/:idTavolo", async (req, res)=>{
    const {id, idTavolo}=req.params;
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id dell'intervento non valido."
        });//400: bad request
    }
    if(!idTavolo || !String(idTavolo).trim()){
        return res.status(400).json({
            success: false,
            message: "Id dell'immagine non valido."
        });//400: bad request
    }
    //preparazione query
    const queryImmagine="SELECT url_immagine FROM tavoli WHERE id=? AND intervento=?";
    const queryCancellazione="DELETE FROM tavoli WHERE id=?";
    try{
        const [resultImmagine]=await pool.query(queryImmagine, [idTavolo, id]);
        //immagine non trovata
        if(resultImmagine.length===0){
            return res.status(404).json({
                success: false,
                message: "Immagine non trovata."
            });//404: not found
        }
        //immagine trovata
        //estraggo il public_id dall'url dell'immagine ('.../v12345/campione.jpg'=>'campione')
        const nomeFile=resultImmagine[0].url_immagine.split('/').pop().split('.')[0];
        const publicId=`gestione_interventi/tavoli/${nomeFile}`;
        //cancello immagine da Cloudinary
        await cloudinary.uploader.destroy(publicId);
        //cancello tavolo dal DB
        const [resultCancellazione]=await pool.query(queryCancellazione, [idTavolo]);
        //cancellazione non avvenuta
        if(resultCancellazione.affectedRows===0){
            return res.status(404).json({
                success: false,
                message: "Immagine non presente nel database."
            });//404: not found
        }
        //cancellazione avvenuta
        return res.json({
            success: true,
            message: "Immagine eliminata con successo"
        });
    }catch(err){
        console.error("Errore nell'endpoint DELETE tavolo: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante la cancellazione."
        });
    }
});

router.use(gestioneErroriUpload);//gestione degli errori durante l'upload delle immagini

module.exports=router;