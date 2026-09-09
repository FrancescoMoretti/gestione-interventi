document.addEventListener("DOMContentLoaded", function(){
    //gestione form con radio button


    //fetch POST chirurgho
    document.getElementById("aggiungi-chirurgo-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const nome=form.elements["nome"].value.trim();
        const cognome=form.elements["cognome"].value.trim();
        if(!nome || !cognome){
            message.textContent="Errore: nome e cognome sono campi obbligatori.";
            return;
        }
        message.textContent="Caricamento in corso...";
        //preparazione dati
        const dati={
            nome: nome,
            cognome: cognome
        };
        try{
            const res=await fetch("/api/chirurgo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: dati
            });
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent=result.message;
                form.reset();
            }else{
                message.textContent=result.message || "Errore durante il salvataggio.";
            }
        }catch(err){
            message.textContent="Errore di rete: impossibile raggiungere il server."
            console.error(err);
        }
    });

    //fetch DELETE chirurgo
    document.getElementById("cancella-chirurgo-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const id=document.getElementById("delete-id-chirurgo").value.trim();
        if(!id){
            message.textContent="Errore: id non inserito."
            return;
        }
        //conferma
        if(!confirm(`Sei sicura di voler eliminare il chirurgo ${id}?`)){
            return;
        }
        message.textContent="Cancellazione in corso...";
        try{
            const res=await fetch(`/api/chirurgo/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent=result.message;
                form.reset();
            }else{
                message.textContent=result.message || "Errore durante la cancellazione.";
            }
        }catch(err){
            message.textContent="Errore di rete: impossibile raggiungere il server.";
            console.error(err);
        }
    });

    //fetch GET chirurgo
    document.getElementById("cerca-chirurgo-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const cercaForm=event.target;
        const message=cercaForm.querySelector('p');
        //validazione client-side
        const id=document.getElementById("search-id-chirurgo").value.trim();
        if(!id){
            message.textContent="Errore: id non inserito.";
            return;
        }
        const modificaForm=document.getElementById("modifica-chirurgo-form");
        const message2=modificaForm.querySelector('p');
        const salvaBtn=modificaForm.querySelector('input[type="submit"]');
        message2.textContent="";
        message.textContent="Ricerca in corso...";
        salvaBtn.disabled=true;
        modificaForm.style.display="none";
        modificaForm.reset();
        try{
            const res=await fetch(`/api/chirurgo/${encodeURIComponent(id)}`);
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent="Chirurgo trovato!";
                //popolamento del form di modifica
                document.getElementById("update-id-chirurgo").value=result.content.id;
                document.getElementById("update-nome-chirurgo").value=result.content.nome || "";
                document.getElementById("update-cognome-chirurgo").value=result.content.cognome || "";
                salvaBtn.disabled=false;
                modificaForm.style.display="block";
            }else{
                message.textContent=result.message || "Errore durante la ricerca."
            }
        }catch(err){
            message.textContent="Errore di rete: impossibile raggiungere il server.";
            console.error(err);
        }
    });

    //fetch PUT chirurgo
    document.getElementById("modifica-chirurgo-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const id=document.getElementById("update-id-chirurgo").value.trim();
        const nome=document.getElementById("update-nome-chirurgo").value.trim();
        const cognome=document.getElementById("update-cognome-chirurgo").value.trim();
        if(!id){
            message.textContent="Errore: id è un campo obbligatorio.";
            return;
        }
        if(!nome || !cognome){
            message.textContent="Errore: nome e cognome sono campi obbligatori.";
            return;
        }
        const salvaBtn=form.querySelector('input[type="submit"]');
        message.textContent="Aggiornamento in corso...";
        //preparazione dati
        const dati={
            nome: nome,
            cognome: cognome
        };
        try{
            const res=await fetch(`/api/chirurgo/${encodeURIComponent(id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dati)
            });
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent=result.message;
                form.reset();
                salvaBtn.disabled=true;
                const cercaForm=document.getElementById("cerca-chirurgo-form");
                cercaForm.querySelector('p').textContent="";
                cercaForm.reset();
            }else{
                message.textContent=result.message || "Errore durante l'aggiornamento.";
            }
        }catch(err){
            message.textContent="Errore di rete: impossibile raggiungere il server.";
            console.error(err);
        }
    });

    //fetch POST specialistica
    document.getElementById("aggiungi-specialistica-form").addEventListener("submit", async (event)=>{
        
    });

    //fetch DELETE specialistica


    //fetch GET specialistica


    //fetch PUT specialistica


});