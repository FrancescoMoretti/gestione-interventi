//validazione stringhe
function validaStringa(value){
    if(!value || !String(value).trim()){
        return null;
    }else{
        return String(value).trim();
    }
};