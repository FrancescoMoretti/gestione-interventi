document.addEventListener("DOMContentLoaded", function(){
    //gestione form con radio button
    const radioBtn=document.querySelectorAll('input[name="tipo-form"]');
    radioBtn.forEach(btn=>{
        btn.addEventListener("change", function(){
            document.getElementById("chirurgo-grid").style.display="none";
            document.getElementById("specialistica-grid").style.display="none";
            document.getElementById("intervento-grid").style.display="none";
            const selected=document.querySelector('input[name="tipo-form"]:checked').value;
            const viewport=window.innerWidth;//larghezza della finestra
            let formato="grid";//stile in cui mostrare il pannello di gestione
            if(viewport<=768){
                formato="flex";
            }
            switch(selected){
                case '1':
                    document.getElementById("chirurgo-grid").style.display=formato;
                break;
                case '2':
                    document.getElementById("specialistica-grid").style.display=formato;
                break;
                case '3':
                    document.getElementById("intervento-grid").style.display=formato;
                break;
            }
        });
    });

    //popolazione <select> per specialistche e interventi
    document.getElementById('radio3').addEventListener("click", async (event)=>{
        const selectSpecialistiche=document.getElementById('add-specialistica-intervento');
        const selectChirurghi=document.getElementById("add-chirurgo-intervento");
        //svuoto le <select>
        while(selectSpecialistiche.options.length>1){
            selectSpecialistiche.remove(1);//elimino l'options in posizione 1
        }
        while(selectChirurghi.options.length>1){
            selectChirurghi.remove(1);//elimino l'options in posizione 1
        }
        try{
            //recupero TUTTE le specialistiche
            const res1=await fetch("/api/specialistiche?tutti=true");
            const result1=await res1.json();
            if(!res1.ok || !result1.success){
                alert("Errore di rete: impossibile raggiungere il server.");
                return;
            }
            //popolo <select> con <option> per ogni specialistica
            result1.specialistiche.forEach(specialistica=>{
                const option=document.createElement('option');
                option.value=specialistica.id;
                option.textContent=specialistica.nome;
                selectSpecialistiche.appendChild(option);
            });
            //recupero tutti i chirurghi
            const res2=await fetch("/api/chirurghi?tutti=true");
            const result2=await res2.json();
            if(!res2.ok || !result2.success){
                alert("Errore di rete: impossibile raggiungere il server.");
                return;
            }
            //popolo <select> con <option> per ogni chirurgo
            result2.chirurghi.forEach(chirurgo=>{
                const option=document.createElement('option');
                option.value=chirurgo.id;
                option.textContent=chirurgo.nome+" "+chirurgo.cognome;
                selectChirurghi.appendChild(option);
            });
        }catch(err){
            alert("Errore di rete: impossibile raggiungere il server.");
            console.error(err);
        }
    });

    //fetch POST chirurgo
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
                body: JSON.stringify(dati)
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
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const nome=form.elements["nome"].value.trim();
        if(!nome){
            message.textContent="Errore: nome è un campo obbligatori.";
            return;
        }
        message.textContent="Caricamento in corso...";
        //preparazione dati
        const dati={
            nome: nome
        };
        try{
            const res=await fetch("/api/specialistica", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dati)
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

    //fetch DELETE specialistica
    document.getElementById("cancella-specialistica-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const id=document.getElementById("delete-id-specialistica").value.trim();
        if(!id){
            message.textContent="Errore: id non inserito."
            return;
        }
        //conferma
        if(!confirm(`Sei sicura di voler eliminare la specialistica ${id}?`)){
            return;
        }
        message.textContent="Cancellazione in corso...";
        try{
            const res=await fetch(`/api/specialistica/${encodeURIComponent(id)}`, {
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

    //fetch GET specialistica
    document.getElementById("cerca-specialistica-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const cercaForm=event.target;
        const message=cercaForm.querySelector('p');
        //validazione client-side
        const id=document.getElementById("search-id-specialistica").value.trim();
        if(!id){
            message.textContent="Errore: id non inserito.";
            return;
        }
        const modificaForm=document.getElementById("modifica-specialistica-form");
        const message2=modificaForm.querySelector('p');
        const salvaBtn=modificaForm.querySelector('input[type="submit"]');
        message2.textContent="";
        message.textContent="Ricerca in corso...";
        salvaBtn.disabled=true;
        modificaForm.style.display="none";
        modificaForm.reset();
        try{
            const res=await fetch(`/api/specialistica/${encodeURIComponent(id)}`);
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent="Specialistica trovato!";
                //popolamento del form di modifica
                document.getElementById("update-id-specialistica").value=result.content.id;
                document.getElementById("update-nome-specialistica").value=result.content.nome || "";
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

    //fetch PUT specialistica
    document.getElementById("modifica-specialistica-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const id=document.getElementById("update-id-specialistica").value.trim();
        const nome=document.getElementById("update-nome-specialistica").value.trim();
        if(!id){
            message.textContent="Errore: id è un campo obbligatorio.";
            return;
        }
        if(!nome){
            message.textContent="Errore: nome è un campo obbligatori.";
            return;
        }
        const salvaBtn=form.querySelector('input[type="submit"]');
        message.textContent="Aggiornamento in corso...";
        //preparazione dati
        const dati={
            nome: nome
        };
        try{
            const res=await fetch(`/api/specialistica/${encodeURIComponent(id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dati)
            });
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent=result.message;
                form.reset();
                salvaBtn.disabled=true;
                const cercaForm=document.getElementById("cerca-specialistica-form");
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
});