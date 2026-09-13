const express=require('express');
const router=express.Router();
const pool=require('../db');

//endpoint per inserimento chirurghi
router.post("/api/chirurgo", async (req, res)=>{
    let {nome, cognome}=req.body;
    //validazione server-side
    //campi obbligatori
    if(!nome || !String(nome).trim() || !cognome || !String(cognome).trim()){
        return res.status(400).json({
            success: false,
            message: "Campi obbligatori mancanti."
        });//400: bad request
    }
    nome=nome.trim();
    cognome=cognome.trim();
    //preparazione query
    const query=`INSERT INTO chirurghi (nome, cognome) VALUES(?, ?)`;
    try{
        const [result]=await pool.query(query, [nome, cognome]);
        //chirurgo non inserito
        if(result.affectedRows!==1){
            return res.status(500).json({
                success: false,
                message: "Impossibile aggiungere il chirurgo."
            });//500: internal server error
        }
        //chirurgo inserito
        return res.status(201).json({
            success: true,
            message: `Chirurgo aggiunto con successo, con id: ${result.insertId}.`
        });//201: created
    }catch(err){
        console.error("Errore nell'endpoint POST chirurgo: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante l'inserimento."
        });
    }
});

//endpoint per cancellazione chirurgo
router.delete("/api/chirurgo/:id", async (req, res)=>{
    const {id}=req.params;//id del chirurgo da eliminare
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Identificativo non valido."
        });//400: bad request
    }
    //preparazione query
    const query="DELETE FROM chirurghi WHERE id=?";
    try{
        const [result]=await pool.query(query, [id]);
        //cancellazione non avvenuta
        if(result.affectedRows===0){
            return res.status(404).json({
                success: false,
                message: "Impossibile eliminare il chirurgo."
            });//404: not found
        }
        //cancellazione avvenuta
        return res.json({
            success: true,
            message: "Chirurgo eliminato con successo."
        });
    }catch(err){
        console.error("Errore nell'endpoint DELETE chirurgo: ", err);
        if(err.code==='ER_ROW_IS_REFERENCED_2'){
            return res.status(409).json({
                success: false,
                message: "Impossibile eliminare un chirurgo associato a degli interventi."
            });//409: conflict (on delete restrict)
        }
        return res.status(500).json({
            success: false,
            message: "Errore interno durante la cancellazione del chirurgo."
        });
    }
});

//endpoint per lista chirurghi
router.get("/api/chirurghi", async (req, res)=>{
    const {limit, offset, filtro, tutti}=req.query;
    const limite=parseInt(limit, 10) || 5;//converto in intero base 10, oppure assegno 5
    const inizio=parseInt(offset, 10) || 0;//converto in intero base 10, oppure assegno 0
    //query per contare le righe che avrà la tabella
    let queryTotali="SELECT COUNT(*) AS totali FROM chirurghi c";
    //query per estrarre nome e cognome dei chirurghi
    let queryChirurghi=`SELECT c.id, c.nome, c.cognome, CONCAT(c.nome, ' ', c.cognome) AS nome_completo FROM chirurghi c`;
    let paramsChirurghi=[];
    let paramsTotali=[];
    let whereClause="";//clausola where
    //gestione filtro
    if(filtro){
        whereClause=" WHERE c.nome LIKE ? OR c.cognome LIKE ?";//spazio all'inizio
        const filtroLike=`%${filtro}%`;
        paramsTotali.push(filtroLike, filtroLike);
        paramsChirurghi.push(filtroLike, filtroLike);
    }
    queryTotali+=whereClause;
    queryChirurghi+=whereClause;
    //gestione ordinamento
    queryChirurghi+=" ORDER BY c.cognome ASC";//spazio all'inizio
    if(tutti!=="true"){
        queryChirurghi+=" LIMIT ? OFFSET ?";//spazio all'inizio
        paramsChirurghi.push(limite, inizio);
    }
    try{
        const [risultatoTotale]=await pool.query(queryTotali, paramsTotali);
        const totali=risultatoTotale[0].totali;
        const [righe]=await pool.query(queryChirurghi, paramsChirurghi);
        return res.json({
            success: true,
            chirurghi: righe,
            totali: totali
        });
    }catch(err){
        console.error("Errore nell'endpoint GET chirurghi: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero dei chirurghi."
        });
    }
});

//endpoint per dettaglio chirurgo
router.get("/api/chirurgo/:id", async (req, res)=>{
    const {id}=req.params;
    //valdazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });//400: bad request
    }
    //preparazione query
    const query="SELECT id, nome, cognome FROM chirurghi WHERE id=?";
    try{
        const [result]=await pool.query(query, [id]);
        //chirurgo non trovato
        if(result.length===0){
            return res.status(404).json({
                success: false,
                message: "Chirurgo non trovato."
            });//404: not found
        }
        //chirurgo trovato
        return res.json({
            success: true,
            content: result[0]
        });
    }catch(err){
        console.error("Errore nell'endpoint GET chirurgo: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero del chirurgo."
        });
    }
});

//endpoint per aggiornamento chirurgo
router.put("/api/chirurgo/:id", async (req, res)=>{
    const {id}=req.params;
    let {nome, cognome}=req.body
    //validazione server-side
    if(!nome || !String(nome).trim() || !cognome || !String(cognome).trim() || !id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Campi obbligatori mancanti (nome, cognome)."
        });//400: bad request
    }
    nome=nome.trim();
    cognome=cognome.trim();
    //preparazione query
    const query="UPDATE chirurghi SET nome=?, cognome=? WHERE id=?";
    try{
        const [result]=await pool.query(query, [nome, cognome, id]);
        //aggiornamento non avvenuto
        if(result.affectedRows===0){
            return res.status(404).json({
                success: false,
                message: "Chirurgo non trovato."
            });//404: not found
        }
        //aggiornamento avvenuto
        return res.json({
            success: true,
            message: "Chirurgo aggiornato con successo!"
        });
    }catch(err){
        console.error("Errore nell'endpoint PUT chirurgo: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante l'aggiornamento del chirurgo."
        });
    }
});

module.exports=router;