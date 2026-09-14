let schermata=1;//contatore per la schermata che sto mostrando
const righe=10;//righe di tabella per ogni pagina
let timeoutRicerca=null;

document.addEventListener("DOMContentLoaded", async ()=>{
    //elementi variabili
    const idBody=document.querySelector('body').id;
    let endpoint=null;
    let paginaContenuto=null;
    let colonne=[];
    let chiaveDati=null;
    switch(idBody){
        case 'chirurghi':
            endpoint="/api/chirurghi";
            paginaContenuto="/chirurgo.html";
            colonne=["id", "nome_completo"];
            chiaveDati="chirurghi";
        break;
        case 'specialistiche':
            endpoint="/api/specialistiche";
            paginaContenuto="/specialistica.html";
            colonne=["id", "nome"];
            chiaveDati="specialistiche";
        break;
        case 'interventi':
            endpoint="/api/interventi";
            paginaContenuto="/intervento.html";
            colonne=["id", "nome", "specialistica", "chirurgo_nome_completo"];
            chiaveDati="interventi";
        break;
        default:
            console.error("Errore: pagina non riconosciuta.");
            return;
        break;
    }

    //elementi fissi
    const precButtons=document.querySelectorAll('.prec-btn');
    const succButtons=document.querySelectorAll('.succ-btn');
    const searchBar=document.getElementById("search-bar");
    const tbody=document.querySelector('tbody');

    //chiamata iniziale
    await caricaContenuti();

    //gestione bottone precedente
    precButtons.forEach(btn=>{
        btn.addEventListener("click", async ()=>{
            if(schermata>1){
                schermata--;
                await caricaContenuti();
            }
        });
    });

    //gestione bottone successivo
    succButtons.forEach(btn=>{
        btn.addEventListener("click", async ()=>{
            schermata++;
            await caricaContenuti();
        });
    });

    //gestione barra di ricerca
    searchBar.addEventListener("input", async ()=>{
        clearTimeout(timeoutRicerca);//se l'utente sta ancora scrivendo cancello il timer
        timeoutRicerca=setTimeout(async ()=>{
            schermata=1;//torno alla prima pagina
            await caricaContenuti();
        }, 300);//prima di eseguire aspetto 300ms
    });

    //funzione principale che carica contenuti dal server
    async function caricaContenuti(){
        const offset=(schermata - 1) * righe;
        //costruisco URL con i parametri
        let url=`${endpoint}?limit=${righe}&offset=${offset}`;
        if(searchBar.value){
            url+=`&filtro=${encodeURIComponent(searchBar.value)}`;
        }
        try{
            const res=await fetch(url);
            const result=await res.json();
            //aggiornamento contenuti
            if(res.ok && result.success){
                mostraPagina(result[chiaveDati], result.totali);
            }else{
                tbody.innerHTML=`<tr><td colspan='${colonne.length}'>`+result.message+"</td></tr>";
                precButtons.forEach(btn=>btn.style.visibility="hidden");
                succButtons.forEach(btn=>btn.style.visibility="hidden");
                return;
            }
        }catch(err){
            tbody.innerHTML=`<tr><td colspan='${colonne.length}'>Errore di rete</td></tr>`;
            //console.error(err);
            precButtons.forEach(btn=>btn.style.visibility="hidden");
            succButtons.forEach(btn=>btn.style.visibility="hidden");
        }
    };

    function mostraPagina(listaDaMostrare, totale){
        tbody.innerHTML="";
        //se non ci sono elementi da mostrare
        if(listaDaMostrare.length===0){
            tbody.innerHTML=`<tr><td colspan='${colonne.length}'>Nessun contenuto trovato</td></tr>`;
            precButtons.forEach(btn=>btn.style.visibility="hidden");
            succButtons.forEach(btn=>btn.style.visibility="hidden");
            tbody.style.height="auto";
            return;
        }
        listaDaMostrare.forEach(contenuto=>{
            const tr=document.createElement("tr");
            colonne.forEach(chiave=>{
                const td=document.createElement("td");
                td.textContent=contenuto[chiave];
                tr.appendChild(td);
            });
            tr.addEventListener("click", ()=>{
                window.location.href=`${paginaContenuto}?id=${encodeURIComponent(contenuto.id)}`;
            });
            tbody.appendChild(tr);
        });
        //adatto tabella al contenuto
        tbody.style.height="auto";
        //aggiorno indice pagina
        document.getElementById("schermata").textContent=`Pagina ${schermata}`;
        //gestione bottoni
        const paginaCorrente=(schermata-1)*righe;
        if(schermata===1){
            precButtons.forEach(btn=>btn.style.visibility="hidden");
        }else{
            precButtons.forEach(btn=>btn.style.visibility="visible");
        }
        if(paginaCorrente+righe>=totale){
            succButtons.forEach(btn=>btn.style.visibility="hidden");
        }else{
            succButtons.forEach(btn=>btn.style.visibility="visible");
        }
    };
});