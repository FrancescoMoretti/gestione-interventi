const express=require('express');
const router=express.Router();
const pool=require('../db');
const {cloudinary, upload, uploadToCloudinary}=require('../cloudinaryConfig');
const gestioneErroriUpload=require('../middleware/images');
//const {validaStringa}=require('../utils/validazione');


//endpoint per inserimento interventi
router.post("/api/intervento", upload.array("immagini"), async (req, res)=>{
    let {nome, descrizione, chirurgo, specialistica, setting, anestesia, campo, monouso, strumentario}=req.body;
    const files=req.files;//immagini
    //validazione server-side
    //campi obbligatori
    if(!nome || !String(nome).trim() || !descrizione || !String(descrizione).trim() || !chirurgo || !String(chirurgo).trim() || !specialistica || !String(specialistica).trim() || !setting || !String(setting).trim() || !anestesia || !String(anestesia).trim() || !campo || !String(campo).trim() || !monouso || !String(monouso).trim() || !strumentario || !String(strumentario).trim()){
        return res.status(400).json({
            success: false,
            message: "Tutti i campi sono obbligatori."
        });//400: bad request
    }
    nome=nome.trim();
    descrizione=descrizione.trim();
    chirurgo=chirurgo.trim();
    specialistica=specialistica.trim();
    setting=setting.trim();
    anestesia=anestesia.trim();
    campo=campo.trim();
    monouso=monouso.trim();
    strumentario=strumentario.trim();
    let publicIds=[];//id pubblici delle immagini caricate su cloudinary
    //preparazione query
    const queryIntervento=`INSERT INTO interventi (nome, descrizione, chirurgo, specialistica, setting, anestesia, campo_operatorio, monouso, strumentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const queryImmagine=`INSERT INTO tavoli (intervento, url_immagine) VALUES (?, ?)`;
    const connection=await pool.getConnection();
    try{
        await connection.beginTransaction();
        const [result]=await connection.execute(queryIntervento, [nome, descrizione, chirurgo, specialistica, setting, anestesia, campo, monouso, strumentario]);
        //intervento non inserito => lascio che vada nel catch
        const interventoId=result.insertId;//id dell'intervento inserito
        //caricamento immagini su cloudinary
        if(files && files.length>0){
            for(let i=0; i<files.length; i++){
                const file=files[i];
                const {imageUrl, publicId}=await uploadToCloudinary(file.buffer, "tavoli");
                publicIds.push(publicId);
                await connection.execute(queryImmagine, [interventoId, imageUrl]);
            }
        }
        await connection.commit();
        return res.status(201).json({
            success: true,
            message: `Intervento inserito con successo, con id: ${result.insertId}.`
        });
    }catch(err){
        await connection.rollback();
        try{
            if(publicIds.length>0){
                for(let i=0; i<publicIds.length; i++){
                    await cloudinary.uploader.destroy(publicIds[i]);
                }
                console.log("Pulizia delle immagini parzialmente caricate su Cloudinary completata.");
            }
        }catch(cloudinaryErr){
            console.error("Errore durante la pulizia di Cloudinary: ", cloudinaryErr);
        }
        console.error("Errore nell'endpoint POST intervento: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante l'inserimento."
        });
    }finally{
        connection.release();
    }
});

//endpoint per cancellazione interventi
router.delete("/api/intervento/:id", async (req, res)=>{
    const {id}=req.params;
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });
    }
    //preparazione query
    const queryImmagini="SELECT t.url_immagine FROM tavoli t JOIN interventi i ON t.intervento=i.id WHERE i.id=?";
    const queryInterventi="DELETE FROM tavoli WHERE intervento=?";
    try{
        const [immagini]=await pool.query(queryImmagini, [id]);
        if(immagini.length>0){
            const publicIds=immagini.map(img=>{
                //estraggo il public_id dall'url dell'immagine ('.../v12345/campione.jpg'=>'campione')
                const nomeFile=img.url_immagine.split('/').pop().split('.')[0];
                return `gestione_interventi/tavoli/${nomeFile}`;
            });
            //cancello le immagini da Cloudinary
            await cloudinary.api.delete_resources(publicIds);
        }
        //cancello l'intervento dal DB
        const [result]=await pool.query(queryInterventi, [id]);
        //le immagini vengono cancellate a cascata
        //cancellazione non avvenuta
        if(result.affectedRows===0){
            return res.status(404).json({
                success: false,
                message: "Intervento non presente nel database."
            });
        }
        //cancellazione avvenuta
        return res.json({
            success: true,
            message: "Intervento eliminato con successo!"
        });
    }catch(err){
        console.error("Errore nell'endpoint DELETE intervento: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante la cancellazione."
        });
    }
});

//endpoint per lista interventi
router.get("/api/interventi", async (req, res)=>{
    const {limit, offset, filtro}=req.query;
    const limite=parseInt(limit, 10) || 5;//converto in intero base 10, oppure assegno 5
    const inizio=parseInt(offset, 10) || 0;//converto in intero base 10, oppure assegno 0
    //query per contare le righe che avrà la tabella
    let queryTotali="SELECT COUNT(*) AS totali FROM interventi i";
    //query per estrarre dati sugli interventi
    let queryInterventi=`SELECT i.id, i.nome, c.nome AS chirurgo_nome, c.cognome AS chirurgo_cognome, s.nome AS specialistica FROM interventi i JOIN chirurghi c ON i.chirurgo=c.id JOIN specialistiche s ON i.specialistica=s.id`;
    let paramsInterventi=[];
    let paramsTotali=[];
    let whereClause="";//clausola where
    //gestione filtro
    if(filtro){
        whereClause=" WHERE i.nome LIKE ?";//spazio all'inizio
        const filtroLike=`%${filtro}%`;
        paramsTotali.push(filtroLike);
        paramsInterventi.push(filtroLike);
    }
    queryTotali+=whereClause;
    queryInterventi+=whereClause;
    //gestione ordinamento
    queryInterventi+=" ORDER BY i.nome ASC LIMIT ? OFFSET ?";//spazio all'inizio
    paramsInterventi.push(limite, inizio);
    try{
        const [risultatoTotale]=await pool.query(queryTotali, paramsTotali);
        const totali=risultatoTotale[0].totali;
        const [righe]=await pool.query(queryInterventi, paramsInterventi);
        return res.json({
            success: true,
            interventi: righe,
            totali: totali
        });
    }catch(err){
        console.error("Errore nell'endpoint GET interventi: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero degli interventi"
        });
    }
});

//endpoint per dettagli intervento
router.get("/api/intervento/:id", async (req, res)=>{
    const {id}=req.params;
    //valdazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });//400: bad request
    }
    //preparazione query
    const queryInterventi="SELECT id, nome, descrizione, chirurgo, specialistica, setting, anestesia, campo_operatorio, monouso, strumentario FROM interventi WHERE id=?";
    try{
        const [resultInterventi]=await pool.query(queryInterventi, [id]);
        //risorsa non trovata
        if(resultInterventi.length===0){
            return res.status(404).json({
                success: false,
                message: "Intervento non trovato."
            });//404: not found
        }
        //risorsa trovata
        const intervento=resultInterventi[0];
        //recupero immagini
        /*
        qui recupererò le immagini del tavolo
        */
        return res.json({
            success: true,
            intervento: intervento
        });
    }catch(err){
        console.error("Errore nell'endpoint GET intervento: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero dell'intervento."
        });
    }
});

//endpoint per aggiornamento intervento
router.put("/api/intervento/:id", async (req, res)=>{
    const {id}=req.params;
    let {nome, descrizione, chirurgo, specialistica, setting, anestesia, campo, monouso, strumentario}=req.body;
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });
    }
    if(!nome || !String(nome).trim() || !descrizione || !String(descrizione).trim() || !chirurgo || !String(chirurgo).trim() || !specialistica || !String(specialistica).trim() || !setting || !String(setting).trim() || !anestesia || !String(anestesia).trim() || !campo || !String(campo).trim() || !monouso || !String(monouso).trim() || !strumentario || !String(strumentario).trim()){
        return res.status(400).json({
            success: false,
            message: "Tutti i campi sono obbligatori."
        });
    }
    nome=nome.trim();
    descrizione=descrizione.trim();
    chirurgo=chirurgo.trim();
    specialistica=specialistica.trim();
    setting=setting.trim();
    anestesia=anestesia.trim();
    campo=campo.trim();
    monouso=monouso.trim();
    strumentario=strumentario.trim();
    //preparazione query
    const query="UPDATE interventi SET nome=?, descrizione=?, chirurgo=?, specialistica=?, setting=?, anestesia=?, campo_operatorio=?, monouso=?, strumentario=? WHERE id=?";
    try{
        const [result]=await pool.query(query, [nome, descrizione, chirurgo, specialistica, setting, anestesia, campo, monouso, strumentario, id]);
        //aggiornamento non avvenuto
        if(result.affectedRows===0){
            return res.status(404).json({
                success: false,
                message: "Intervento non trovato."
            });//404: not found
        }
        //aggiornamento avvenuto
        return res.json({
            success: true,
            message: "Intervento aggiornato con successo!"
        });
    }catch(err){
        console.error("Errore nell'endpoint PUT intervento: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante l'aggiornamento."
        });
    }
});

router.use(gestioneErroriUpload);//gestione degli errori durante l'upload delle immagini

module.exports=router;