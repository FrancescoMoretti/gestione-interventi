document.addEventListener("DOMContentLoaded", async function caricaSpecialistica(){
    const params=new URLSearchParams(window.location.search);
    const id=params.get('id');
    //id non valido
    if(!id || !String(id).trim()){
        window.location.href="/404.html";
        return;
    }
    try{
        const res=await fetch(`/api/specialistica/${encodeURIComponent(id)}/statistiche`);
        const result=await res.json();
        //specialistica non trovata
        if(!res.ok || !result.success){
            window.location.href="/404.html";
            return;
        }
        const specialistica=result.content;//dati della specialistica
        //popolamento della scheda
        const divInterventi=document.getElementById("num-interventi");
        divInterventi.querySelector('h2').innerText+=`${escapeHTML(specialistica.numero_interventi)}`;
        const tbody=document.querySelector('#classifica tbody');
        specialistica.top_chirurghi.forEach(chirurgo=>{
            const tr=document.createElement('tr');
            const tdNome=document.createElement('td');
            tdNome.textContent=chirurgo.nome_completo;
            const tdNumero=document.createElement('td');
            tdNumero.textContent=chirurgo.numero_interventi;
            tr.appendChild(tdNome);
            tr.appendChild(tdNumero);
            tbody.appendChild(tr);
        });
    }catch(err){
        console.error("Errore nel caricamento della specialistica: ", err);
    }
});