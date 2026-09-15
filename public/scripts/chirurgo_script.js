document.addEventListener("DOMContentLoaded", async function CaricaChirurgo(){
    const params=new URLSearchParams(window.location.search);
    const id=params.get('id');
    if(!id || !String(id).trim()){
        window.location.href="/404.html";
        return;
    }
    try{
        const res=await fetch(`/api/chirurgo/${encodeURIComponent(id)}/statistiche`);
        const result=await res.json();
        //chirurgo non trovato
        if(!res.ok || !result.success){
            window.location.href="/404.html";
            return;
        }
        const chirurgo=result.content;//dati del chirurgo
        //popolamento della scheda
        const divInterventi=document.getElementById("num-interventi");
        divInterventi.querySelector('h2').innerText+=`${escapeHTML(chirurgo.numero_interventi)}`;
        const tbodySpecialistiche=document.querySelector("#top-specialistiche tbody");
        chirurgo.top_specialistiche.forEach(specialistica=>{
            const tr=document.createElement('tr');
            const tdNome=document.createElement('td');
            tdNome.textContent=specialistica.nome;
            const tdNumero=document.createElement('td');
            tdNumero.textContent=specialistica.numero_interventi;
            tr.appendChild(tdNome);
            tr.appendChild(tdNumero);
            tbodySpecialistiche.appendChild(tr);
        });
    }catch(err){
        console.error("Errore nel caricamento del chirurgo: ", err);
    }
});