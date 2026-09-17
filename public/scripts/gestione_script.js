document.addEventListener("DOMContentLoaded", function(){
    //gestione form con radio button
    const radioBtn=document.querySelectorAll('input[name="tipo-form"]');
    radioBtn.forEach(btn=>{
        btn.addEventListener("change", function(){
            document.getElementById("chirurgo-grid").style.display="none";
            document.getElementById("specialistica-grid").style.display="none";
            document.getElementById("intervento-grid").style.display="none";
            document.getElementById("tavolo-grid").style.display="none";
            const selected=document.querySelector('input[name="tipo-form"]:checked').value;
            const viewport=window.innerWidth;//larghezza della finestra
            //gestione formato grid o flex (flex-direction column tramite css) in base alla larghezza (viewport) della finestra
            let formato="grid";
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
                case '4':
                    document.getElementById("tavolo-grid").style.display=formato;
                break;
            }
        });
    });

    //popolazione <select> per specialistche e interventi
    document.getElementById('radio3').addEventListener("click", async (event)=>{
        const selectSpecialistiche=document.getElementById("add-specialistica-intervento");//select di inserimento
        const selectSpecialistiche2=document.getElementById("update-specialistica-intervento");//select di modifica
        const selectChirurghi=document.getElementById("add-chirurgo-intervento");//select di inseriemnto
        const selectChirurghi2=document.getElementById("update-chirurgo-intervento");//select di modifica
        //svuoto le <select>
        while(selectSpecialistiche.options.length>1){
            //elimino l'options in posizione 1
            selectSpecialistiche.remove(1);
            selectSpecialistiche2.remove(1);
        }
        while(selectChirurghi.options.length>1){
            //elimino l'options in posizione 1
            selectChirurghi.remove(1);
            selectChirurghi2.remove(1);
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
                const option2=option.cloneNode(true);
                selectSpecialistiche.appendChild(option);
                selectSpecialistiche2.appendChild(option2);
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
                const option2=option.cloneNode(true);
                selectChirurghi.appendChild(option);
                selectChirurghi2.appendChild(option2);
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

    //fetch POST intervento
    document.getElementById("aggiungi-intervento-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const nome=form.elements["nome"].value.trim();
        const descrizione=form.elements["descrizione"].value.trim();
        const chirurgo=form.elements["chirurgo"].value.trim();
        const specialistica=form.elements["specialistica"].value.trim();
        const setting=form.elements["setting"].value.trim();
        const anestesia=form.elements["anestesia"].value.trim();
        const campo=form.elements["campo"].value.trim();
        const monouso=form.elements["monouso"].value.trim();
        const strumentario=form.elements["strumentario"].value.trim();
        if(!nome || !descrizione || !chirurgo || !specialistica || !setting || !anestesia || !campo || !monouso || !strumentario){
            message.textContent="Errore: tutti i campi sono obbligatori.";
            return;
        }
        message.textContent="Caricamento in corso...";
        //preparazione dati
        const formData=new FormData(form);
        formData.set("nome", nome);
        formData.set("descrizione", descrizione);
        formData.set("chirurgo", chirurgo);
        formData.set("specialistica", specialistica);
        formData.set("setting", setting);
        formData.set("anestesia", anestesia);
        formData.set("campo", campo);
        formData.set("monouso", monouso);
        formData.set("strumentario", strumentario);
        try{
            const res=await fetch("/api/intervento", {
                method: "POST",
                body: formData
            });
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent=result.message;
                form.reset();
            }else{
                message.textContent=result.message || "Errore durante il salvataggio.";
            }
        }catch(err){
            message.textContent="Errore di rete: impossibile raggiungere il server.";
            console.error(err);
        }
    });

    //fetch DELETE intervento
    document.getElementById("cancella-intervento-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const id=document.getElementById("delete-id-intervento").value.trim();
        if(!id){
            message.textContent="Errore: id non inserito."
            return;
        }
        //conferma
        if(!confirm(`Sei sicura di voler eliminare l'intervento ${id}?`)){
            return;
        }
        message.textContent="Cancellazione in corso...";
        try{
            const res=await fetch(`/api/intervento/${encodeURIComponent(id)}`, {
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

    //fetch GET intervento
    document.getElementById("cerca-intervento-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
       const form=event.target;
        const message=form.querySelector('p');
        //validazione client-side
        const id=document.getElementById("search-id-intervento").value.trim();
        if(!id){
            message.textContent="Errore: id non inserito.";
            return;
        }
        const modificaForm=document.getElementById("modifica-intervento-form");
        const message2=modificaForm.querySelector('p');
        const salvaBtn=modificaForm.querySelector('input[type="submit"]');
        message2.textContent="";
        message.textContent="Ricerca in corso...";
        salvaBtn.disabled=true;
        modificaForm.style.display="none";
        modificaForm.reset();
        try{
            const res=await fetch(`/api/intervento/${encodeURIComponent(id)}`);
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent="Intervento trovato!";
                //popolamento del form di modifica
                document.getElementById("update-id-intervento").value=result.intervento.id;
                document.getElementById("update-nome-intervento").value=result.intervento.nome;
                document.getElementById("update-descrizione-intervento").value=result.intervento.descrizione;
                document.getElementById("update-chirurgo-intervento").value=result.intervento.chirurgo;
                document.getElementById("update-specialistica-intervento").value=result.intervento.specialistica;
                document.getElementById("update-setting-intervento").value=result.intervento.setting;
                document.getElementById("update-anestesia-intervento").value=result.intervento.anestesia;
                document.getElementById("update-campo-intervento").value=result.intervento.campo;
                document.getElementById("update-monouso-intervento").value=result.intervento.monouso;
                document.getElementById("update-strumentario-intervento").value=result.intervento.strumentario;
                salvaBtn.disabled=false;
                modificaForm.style.display="block";
            }else{
                message.textContent=result.message || "Errore durante la ricerca.";
            }
        }catch(err){
            message.textContent="Errore di rete: impossibile raggiungere il server.";
            console.error(err);
        }
    });

    //fetch PUT intervento
    document.getElementById("modifica-intervento-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        const form=event.target;
        const message=form .querySelector('p');
        //validazione client-side
        const id=document.getElementById("update-id-intervento").value.trim();
        const nome=document.getElementById("update-nome-intervento").value.trim();
        const descrizione=document.getElementById("update-descrizione-intervento").value.trim();
        const chirurgo=document.getElementById("update-chirurgo-intervento").value.trim();
        const specialistica=document.getElementById("update-specialistica-intervento").value.trim();
        const setting=document.getElementById("update-setting-intervento").value.trim();
        const anestesia=document.getElementById("update-anestesia-intervento").value.trim();
        const campo=document.getElementById("update-campo-intervento").value.trim();
        const monouso=document.getElementById("update-monouso-intervento").value.trim();
        const strumentario=document.getElementById("update-strumentario-intervento").value.trim();
        if(!id){
            message.textContent="Errore: id è un campo obbligatorio."
            return;
        }
        if(!nome || !descrizione || !chirurgo || !specialistica || !setting || !anestesia || !campo || !monouso || !strumentario){
            message.textContent="Errore: tutti i campi sono obbligatori.";
            return;
        }
        const salvaBtn=form.querySelector('input[type="submit"]');
        message.textContent="Aggiornamento in corso...";
        const dati={
            nome: nome,
            descrizione: descrizione,
            chirurgo: chirurgo,
            specialistica: specialistica,
            setting: setting,
            anestesia: anestesia,
            campo: campo,
            monouso: monouso,
            strumentario: strumentario
        };
        try{
            const res=await fetch(`/api/intervento/${encodeURIComponent(id)}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(dati)
            });
            const result=await res.json();
            if(res.ok && result.success){
                message.textContent=result.message;
                form.reset();
                salvaBtn.disabled=true;
                const cercaForm=document.getElementById("cerca-intervento-form");
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