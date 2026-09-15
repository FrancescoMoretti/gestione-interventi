document.addEventListener("DOMContentLoaded", async function caricaIntervento(){
    const params=new URLSearchParams(window.location.search);
    const id=params.get("id");
    const scheda=document.getElementById('scheda');
    const immaginiDiv=document.getElementById("immagini");
    //id non valido
    if(!id || !String(id).trim()){
        window.location.href='/404.html';
        return;
    }
    try{
        const res=await fetch(`/api/intervento/${encodeURIComponent(id)}`);
        const result=await res.json();
        //intervento non trovato
        if(!res.ok && !result.success){
            window.location.href='/404.html';
            return;
        }
        const intervento=result.intervento;//dati dell'intervento
        const listaImmagini=result.immagini || [];//array di url a cloudinary
        //popolamento della scheda dell'articolo
        let stringaHTML="";
        stringaHTML+=`<li><span>Id</span>: ${escapeHTML(intervento.id)}</li>`;
        stringaHTML+=`<li><span>Descrizione</span>: ${escapeHTML(intervento.descrizione)}</li>`;
        stringaHTML+=`<li><span>Specialistica</span>: ${escapeHTML(intervento.nome_specialistica)}</li>`;
        stringaHTML+=`<li><span>Chirurgo</span>: ${escapeHTML(intervento.nome_chirurgo)}</li>`;
        stringaHTML+=`<li><span>Setting</span>: ${escapeHTML(intervento.setting)}</li>`;
        stringaHTML+=`<li><span>Anestesia</span>: ${escapeHTML(intervento.anestesia)}</li>`;
        stringaHTML+=`<li><span>Campo operatorio</span>: ${escapeHTML(intervento.campo)}</li>`;
        stringaHTML+=`<li><span>Monouso</span>: ${escapeHTML(intervento.monouso)}</li>`;
        stringaHTML+=`<li><span>Strumentario</span>: ${escapeHTML(intervento.strumentario)}</li>`;
        //inserisco la stringa html nell'ul già esistente
        scheda.querySelector('ul').insertAdjacentHTML("beforeend", stringaHTML);
        //gestione delle immagini
        const n_immagini=listaImmagini.length;
        //se ho una sola immagine la metto come immagine
        if(n_immagini===1){
            immaginiDiv.innerHTML=`<img src="${escapeHTML(listaImmagini[0])}" alt="Immagine di ${escapeHTML(intervento.nome)}">`;
        }else if(n_immagini>1){
            immaginiDiv.innerHTML=`
                <div id="slider">
                    <div id="slider-track">
                        ${listaImmagini.map(url=>`<img class="slide" src="${escapeHTML(url)}" alt="Immagine di ${escapeHTML(intervento.nome)}">`).join("")}
                    </div>
                </div>
            `;
            inizializzaSlider();
        }
    }catch(err){
        console.error("Errore nel caricamento dell'intervento: ", err);
    }
});