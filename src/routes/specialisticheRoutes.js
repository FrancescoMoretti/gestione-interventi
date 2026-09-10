const express=require('express');
const router=express.Router();
const pool=require('../db');

//endpoint per inserimento specialistiche
router.post("/api/specialistica", async (req, res)=>{
    let {nome}=req.body;
    //validazione server-side
    //campi obbligatori
    if(!nome || !String(nome).trim()){
        return res.status(400).json({
            success: false,
            message: "Campi obbligatori mancanti."
        });//400: bad request
    }
    nome=nome.trim();
    //preparazione query
    const query=`INSERT INTO specialistiche (nome) VALUES (?)`;
    try{
        const [result]=await pool.query(query, [nome]);
        //specialistica non inserita
        if(result.affectedRows!==1){
            return res.status(500).json({
                success: false,
                message: "Impossibile aggiungere la specialistica."
            });
        }
        //specialistica inserita
        return res.status(201).json({
            success: true,
            message: `Specialistica aggiunta con successo, con id: ${result.insertId}.`
        });//201: created
    }catch(err){
        console.error("Errore nell'endpoint POST specialistica: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante l'inserimento."
        });
    }
});

//endpoint per cancellazioe specialistica
router.delete("/api/specialistica/:id", async (req, res)=>{
    const {id}=req.params;//id della specialistica da eliminare
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Identificativo non valido."
        });//400: bad request
    }
    //preparazione query
    const query="DELETE FROM specialistiche WHERE id=?";
    try{
        const [result]=await pool.query(query, [id]);
        //cancellazione non avvenuta
        if(result.affectedRows===0){
            return res.status(404).json({
                success: false,
                message: "Impossibile eliminare la specialistica."
            });//404: not found
        }
        //cancellazione avvenuta
        return res.json({
            success: true,
            message: "Specialistica eliminata con successo!"
        });
    }catch(err){
        console.error("Errore nell'endpoint DELETE specialistica: ", err);
        if(err.code==='ER_ROW_IS_REFERENCED_2'){
            return res.status(409).json({
                success: false,
                message: "Impossibile eliminare una specialistica associata a degli interventi."
            });//409: conflict (on delete restrict)
        }
        return res.status(500).json({
            success: false,
            message: "Errore interno durante la cancellazione della specialistica."
        });
    }
});

//endpoint per lista specialistiche
router.get("/api/specialistiche", async (req, res)=>{
    const {limit, offset, filtro, tutti}=req.query;
    const limite=parseInt(limit, 10) || 5;//converto in intero base 10, oppure assegno 5
    const inizio=parseInt(offset, 10) || 0;//converto in intero base 10, oppure assegno 0
    //query per contare le righe che avrà la tabella
    let queryTotali="SELECT COUNT(*) AS totali FROM specialistiche s";
    //query per estrarre nome della specialistica
    let querySpecialistiche=`SELECT s.id, s.nome FROM specialistiche s`;
    let paramsSpecialistiche=[];
    let paramsTotali=[];
    let whereClause="";//clausola where
    //gestione filtro
    if(filtro){
        whereClause = " WHERE s.nome LIKE ?";//spazio all'inizio
        const filtroLike = `%${filtro}%`;
        paramsTotali.push(filtroLike);
        paramsSpecialistiche.push(filtroLike);
    }
    queryTotali+=whereClause;
    querySpecialistiche+=whereClause;
    //gestione ordinamento
    querySpecialistiche+=" ORDER BY s.nome ASC";//spazio all'inizio
    //recupero di tutte le specialistiche o solo una parte
    if(tutti!=="true"){
        querySpecialistiche+=" LIMIT ? OFFSET ?";//spazio all'inizio
        paramsSpecialistiche.push(limite, inizio);
    }
    try{
        const [risultatoTotale] = await pool.query(queryTotali, paramsTotali);
        const totali = risultatoTotale[0].totali;
        const [righe] = await pool.query(querySpecialistiche, paramsSpecialistiche);
        return res.json({
            success: true,
            specialistiche: righe,
            totali: totali
        });
    }catch(err){
        console.error("Errore nell'endpoint GET specialistiche: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero delle specialistiche."
        });
    }
});

//endpoint per dettaglio specialistica
router.get("/api/specialistica/:id", async (req, res)=>{
    const {id}=req.params;
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });//400: bad request
    }
    //preparazione query
    const query="SELECT id, nome FROM specialistiche WHERE id=?";
    try{
        const [result]=await pool.query(query, [id]);
        //specialistica non trovata
        if(result.length===0){
            return res.status(404).json({
                success: false,
                message: "Specialistica non trovata"
            });//404: not found
        }
        //specialistica trovata
        return res.json({
            success: true,
            content: result[0]
        });
    }catch(err){
        console.error("Errore nell'endpoint GET specialistica: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durate il recupero della specialistica"
        });
    }
});

//endpoint per aggiornamento specialistica
router.put("/api/specialistica/:id", async (req, res)=>{
    const {id}=req.params;
    let {nome}=req.body;
    //validazione server-side
    if(!nome || !String(nome).trim() || !id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Campi obbligatori mancanti."
        });//400: bad request
    }
    nome=nome.trim();
    //preparazione query
    const query="UPDATE specialistiche SET nome=? WHERE id=?";
    try{
        const [result]=await pool.query(query, [nome, id]);
        //aggiornamento avvenuto
        if(result.affectedRows===0){
            return res.status(404).json({
                success: false,
                message: "Specialistica non trovata."
            });//404: not found
        }
        //aggiornamento avvenuto
        return res.json({
            success: true,
            message: "Specialistica aggiornata con successo!"
        });
    }catch(err){
        console.error("Errore nell'endpoint PUT specialistica: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante l'aggiornamento della specialistica."
        });
    }
});

module.exports=router;