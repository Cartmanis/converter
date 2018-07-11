const fs = require('fs');
const iconv = require('iconv-lite');

const getFiles = (dir, files_) => {
    
  files_ = files_ || [];
    const files = fs.readdirSync(dir);
    for (let i in files){
        const name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
    
}

const readFile = (pathFile) => { //В этой функции через await можно перечислять сколь угодно асинхронных операций, которые будут выполнены гарантированно последовательно и в то же время асинхронна. Код будет выглядить, как синхронный
    return new Promise( (resolve, reject) => {
        try { 
        //-----iconv-litle-------------------------        
        const text =  fs.readFileSync(pathFile);
        const result = iconv.decode(text, '1251');
        resolve(result);
            
            //тут через await можно продолжить асинхронный код
        } catch (err) {
            console.log('ERROR:', err);
            reject(null);
        }
    })    
}

 const cyrillToLatin = text => {
        if(!text) return; //в том случае если попопадает пустая строка
        return new Promise( (success, reject) => {
            const arrru = new Array ('Я','я','Ю','ю','Ч','ч','Ш','ш','Щ','щ','Ж','ж','А','а','Б','б','В','в','Г','г','Д','д','Е','е','Ё','ё','З','з','И','и','Й','й','К','к','Л','л','М','м','Н','н', 'О','о','П','п','Р','р','С','с','Т','т','У','у','Ф','ф','Х','х','Ц','ц','Ы','ы','Ь','ь','Ъ','ъ','Э','э');
            const arren = new Array ('Ya','ya','Yu','yu','Ch','ch','Sh','sh','Sh','sh','Zh','zh','A','a','B','b','V','v','G','g','D','d','E','e','E','e','Z','z','I','i','J','j','K','k','L','l','M','m','N','n', 'O','o','P','p','R','r','S','s','T','t','U','u','F','f','H','h','C','c','Y','y','`','`','\'','\'','E', 'e');
            try {
                for(var i=0; i < arrru.length; i++){
                    var reg = new RegExp(arrru[i], "g");
                    text = text.replace(reg, arren[i]);
                }
                success(text);
            } catch(e) {
                reject('Ошибка в переводе символа из кирилицы в латиницу: ' + e);
            }
        })            
    }

module.exports.getFiles = getFiles;
module.exports.readFile = readFile;
module.exports.cyrillToLatin = cyrillToLatin;