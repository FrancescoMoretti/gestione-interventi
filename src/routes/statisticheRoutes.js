const express=require('express');
const router=express.Router();
const pool=require('../db');

//endpoint per statistiche globali
router.get("/api/statistiche", async (req, res)=>{
    //preparazione query
    const queryContatore="SELECT (SELECT COUNT(*) FROM interventi) AS numero_interventi, (SELECT COUNT(*) FROM specialistiche) AS numero_specialistiche, (SELECT COUNT(*) FROM chirurghi) AS numero_chirurghi";
    const queryMax="SELECT (SELECT s.nome FROM specialistiche s JOIN interventi i ON s.id=i.specialistica GROUP BY s.id, s.nome ORDER BY COUNT(*) DESC LIMIT 1) AS specialistica_max, (SELECT CONCAT(c.nome, ' ', c.cognome) AS nome_chirurgo FROM chirurghi c JOIN interventi i ON c.id=i.chirurgo GROUP BY c.id, nome_chirurgo ORDER BY COUNT(*) DESC LIMIT 1) AS chirurgo_max";
    try{
        const [resultContatore]=await pool.query(queryContatore);
        const [resultMax]=await pool.query(queryMax);
        const statistiche={
            numeroInterventi: resultContatore[0].numero_interventi,
            numeroSpecialistiche: resultContatore[0].numero_specialistiche,
            numeroChirurghi: resultContatore[0].numero_chirurghi,
            specialisticaMax: resultMax[0].specialistica_max,
            chirurgoMax: resultMax[0].chirurgo_max
        };
        return res.json({
            success: true,
            statistiche: statistiche
        });
    }catch(err){
        console.error("Errore nell'endpoint GET statistiche: ", err);
        return res.status(500).json({
            success: false,
            message:"Errore interno durante il calcolo delle statistiche."
        });
    }
});

module.exports=router;