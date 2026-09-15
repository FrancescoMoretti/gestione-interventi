document.addEventListener("DOMContentLoaded", async function (){
    //fetch per statistiche
    const div=document.getElementById("statistiche-div");
    const message=div.querySelector('p');
    try{
        const res=await fetch("/api/statistiche");
        const result=await res.json();
        if(res.ok && result.success){
            const statistiche=result.statistiche;
            div.innerHTML+=`
                <ul>
                    <li><span>Interventi</span>: ${escapeHTML(statistiche.numeroInterventi)}</li>
                    <li><span>Specialistiche</span>: ${escapeHTML(statistiche.numeroSpecialistiche)}</li>
                    <li><span>Chirurghi</span>: ${escapeHTML(statistiche.numeroChirurghi)}</li>
                </ul>
                <p><span>Specialistica</span> con più interventi: ${escapeHTML(statistiche.specialisticaMax)}</p>
                <p><span>Chirurgo</span> con più interventi: ${escapeHTML(statistiche.chirurgoMax)}</p>
            `;
        }else{
            message.textContent=result.message;
        }
    }catch(err){
        console.error(err);
    }
})