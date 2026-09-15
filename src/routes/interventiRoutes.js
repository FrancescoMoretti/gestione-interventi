const express=require('express');
const router=express.Router();
const fs=require('fs').promises;
const path=require('path');
const pool=require('../db');
const {cloudinary, upload, uploadToCloudinary}=require('../cloudinaryConfig');
const {gestioneErroriUpload}=require('../middleware/images');
const {costruisciFiltro}=require('../utils/filtro');
const {escapeHTML}=require('../../public/scripts/utils');
//const {validaStringa}=require('../utils/validazione');

//endpoint per rendering server-side per lettura intervento
router.get('/intervento.html', async (req, res, next)=>{
    const {id}=req.query;
    //validazione server-side
    if(!id){
        return next();//nessun id
    }
    //preparazione query
    const query="SELECT id, nome FROM interventi WHERE id=?";
    try{
        const [result]=await pool.query(query, [id]);
        //nessun intervento trovato
        if(result.length===0){
            return next();
        }
        //intervento trovato
        //estraggo i dati
        const i=result[0];
        //costruzione dati
        //titolo
        const titolo=`${i.nome} | Gestionale interventi`;
        //inserisco dati nel codice html
        let html=await fs.readFile(path.join(__dirname, '../../public/intervento.html'), 'utf-8');
        html=html.replace('<title>Intervento | Gestionale interventi</title>', `<title>${escapeHTML(titolo)}</title>`);
        html=html.replace('<h1></h1>', `<h1>${escapeHTML(i.nome)}</h1>`);
        res.set('Content-Type', 'text/html');
        return res.send(html);
    }catch(err){
        console.error("Errore nel rendering server-side di intervento.html");
        next(err);
    }
});

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
    const queryInterventi="DELETE FROM interventi WHERE id=?";
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
    let queryTotali="SELECT COUNT(*) AS totali FROM interventi i JOIN chirurghi c ON i.chirurgo=c.id JOIN specialistiche s ON i.specialistica=s.id";
    //query per estrarre dati sugli interventi
    let queryInterventi=`SELECT i.id, i.nome, CONCAT(c.nome, ' ', c.cognome) AS chirurgo_nome_completo, s.nome AS specialistica FROM interventi i JOIN chirurghi c ON i.chirurgo=c.id JOIN specialistiche s ON i.specialistica=s.id`;
    let paramsInterventi=[];
    let paramsTotali=[];
    //gestione filtro
    const {whereClause, parametri}=costruisciFiltro(["i.id", "i.nome", "CONCAT(c.nome, ' ', c.cognome)", "s.nome"], filtro);
    queryTotali+=whereClause;
    queryInterventi+=whereClause;
    paramsTotali.push(...parametri);//...<=>spread operator: parametri è un array e con "..." davanti vengono passati gli elementi che contiene separatamente
    paramsInterventi.push(...parametri);//<=>spread operator: parametri è un array e con "..." davanti vengono passati gli elementi che contiene separatamente
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
    const queryImmagini="SELECT url_immagine FROM tavoli WHERE intervento=? ORDER BY id ASC";
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
        const [resultImmagini]=await pool.query(queryImmagini, [intervento.id]);
        const listaUrlImmagini=resultImmagini.map(riga=>riga.url_immagine);
        return res.json({
            success: true,
            intervento: intervento,
            immagini: listaUrlImmagini
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