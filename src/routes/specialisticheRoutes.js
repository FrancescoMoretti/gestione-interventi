const express=require('express');
const router=express.Router();
const fs=require('fs').promises;
const path=require('path');
const pool=require('../db');
const {costruisciFiltro}=require('../utils/filtro');
const {escapeHTML}=require('../../public/scripts/utils');

//endpoint per rendering server-side per lettura specialistiche
router.get('/specialistica.html', async (req, res, next)=>{
    const {id}=req.query;
    //validazione server-side
    if(!id){
        return next();//nessun id
    }
    //preparazione query
    const query="SELECT id, nome FROM specialistiche WHERE id=?";
    try{
        const [result]=await pool.query(query, [id]);
        //nessuna specialistica trovata
        if(result.length===0){
            return next();
        }
        //specialistica trovata
        //estraggo i dati
        const s=result[0];
        //costruzione dati
        //titolo
        const titolo=`${s.nome} | Gestionale interventi`;
        //inserisco dati nel codice html
        let html=await fs.readFile(path.join(__dirname, '../../public/specialistica.html'), 'utf-8');
        html=html.replace('<title>Specialistica | Gestionale interventi</title>', `<title>${escapeHTML(titolo)}</title>`);
        html=html.replace('<h1></h1>', `<h1>${escapeHTML(s.nome)}</h1>`);
        html=html.replace('<p></p>', `<p><span>Id</span>: ${escapeHTML(s.id)}</p>`);
        res.set('Content-Type', 'text/html');
        return res.send(html);
    }catch(err){
        console.error("Errore nel rendering server-side di specialistica.html: ", err);
        next(err);
    }
});

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
    //gestione filtro
    const {whereClause, parametri}=costruisciFiltro(["s.id", "s.nome"], filtro);
    queryTotali+=whereClause;
    querySpecialistiche+=whereClause;
    paramsTotali.push(...parametri);//...<=>spread operator: parametri è un array e con "..." davanti vengono passati gli elementi che contiene separatamente
    paramsSpecialistiche.push(...parametri);//...<=>spread operator: parametri è un array e con "..." davanti vengono passati gli elementi che contiene separatamente
    //gestione ordinamento
    querySpecialistiche+=" ORDER BY s.nome ASC";//spazio all'inizio
    //recupero di tutte le specialistiche o solo una parte
    if(tutti!=="true"){
        querySpecialistiche+=" LIMIT ? OFFSET ?";//spazio all'inizio
        paramsSpecialistiche.push(limite, inizio);
    }
    try{
        const [risultatoTotale]=await pool.query(queryTotali, paramsTotali);
        const totali=risultatoTotale[0].totali;
        const [righe]=await pool.query(querySpecialistiche, paramsSpecialistiche);
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

//endpoint per statistiche sulla specialistica
router.get("/api/specialistica/:id/statistiche", async (req, res)=>{
    const {id}=req.params;
    //validazione server-side
    if(!id || !String(id).trim()){
        return res.status(400).json({
            success: false,
            message: "Id non valido."
        });//400: bad request
    }
    //preparazione query
    const query="SELECT id FROM specialistiche WHERE id=?";
    const queryInterventi="SELECT COUNT(*) AS numero_interventi FROM interventi WHERE specialistica=?";
    const queryChirurghi="SELECT CONCAT(c.nome, ' ', c.cognome) AS nome_completo, COUNT(*) AS numero_interventi FROM interventi i JOIN chirurghi c ON i.chirurgo=c.id WHERE i.specialistica=? GROUP BY c.id, nome_completo ORDER BY numero_interventi DESC LIMIT 3";
    try{
        const [result]=await pool.query(query, [id]);
        //specialistica non trovata
        if(result.length===0){
            return res.status(404).json({
                success: false,
                message: "Specialistica non trovata."
            });//404: not found
        }
        //specialistica trovata
        const [resultInterventi]=await pool.query(queryInterventi, [id]);
        const [resultChirurghi]=await pool.query(queryChirurghi, [id]);
        return res.json({
            success: true,
            content: {
                numero_interventi: resultInterventi[0].numero_interventi,
                top_chirurghi: resultChirurghi
            }
        });
    }catch(err){
        console.error("Errore nell'endpoint GET statistiche specialistica: ", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno durante il recupero dei dati della specialistica."
        });
    }
});

module.exports=router;