const path = require('path');
const {promisify} = require('util');
const fs = require('fs');
const stream = require('stream')
const es = require('event-stream');
const iconv = require('iconv-lite');
const readFileAsync = promisify(fs.readFile);

const template = require('./template');
const subsidiary = require('./subsidiary');
const mongo = require('./data/mongoConnect');

const file = subsidiary.getFiles('input')[0]; //файл, который хотим конвертировать


let row = 0; //счетчик строк
let rowOperation = 0;
let id = 0;
let config = new Map(); //Конфигурация из template     
let collectionsForMongo = new Map(); //Map, в котором храним массивы объектов(O632, L632, S632, P632, M632, I632) - каждый массив из которых будет представлять одну таблицу
let client;
 
    
const streamFile = fs.createReadStream(file)
    .pipe(iconv.decodeStream('866'))        
    .pipe(es.split())
    .pipe(es.mapSync(function(line){
     
     (async () =>  {         
        streamFile.pause();

        if(row === 0) {        
            const pathTemplate = await template.getPathToTemplates(line); //получаем путь до нужного шаблона
            //получаем необходимые параметры шаблонов
            if(!pathTemplate) {
                console.log('Не верный формат файла указанный в строке "В". Программа завершает выполнение!');
                return;
            }

            config = await template.getFormatConfig(pathTemplate); //конфигурация файла //массив объектов, где каждый объект это строка- О, Л, С, M и.т.д             
            collectionsForMongo = await createStructCollectionsMongo(collectionsForMongo, config);
            client = await mongo.connectionDb();
            await mongo.clearDateBase(client, collectionsForMongo);                    
        }                       

        if(row > 0) { 
            if(line[0] ==='О') { id += 1; }                       
            const typeLatin = await subsidiary.cyrillToLatin(line[0]);                    
            await createCollectionsToMongo(line, typeLatin, config, collectionsForMongo);        
        }


        //------------------Вот тут в одном из случайных кусков (хотя иногода куски повторяются) возникает ошибка ---------------------------
        if(collectionsForMongo.get('O632').length >= 10000) { //Вот тут мы настравиваем какой кусок добавлять в таблицу -1000, 10000, 50000 и.т.д
            const result = await mongo.insertArray(client, collectionsForMongo); //добавляем все массивы объектов из Map - O632, L632, S632, P632          
            if(!result) {
                return;
            }
            console.log(`Успешно добавлено 10000 записей`);

            collectionsForMongo.clear();        
            collectionsForMongo = await createStructCollectionsMongo(collectionsForMongo, config);
        }
        row++;
        streamFile.resume();
    })();

    }))      
    .on('error', function(err){
        console.log('Ошибка при чтении файла: ', err);
    })    
    .on('end', function(){
        console.log('Файл успешно прочитан.');
    })    


    //Вспомогательные функции
    const createStructCollectionsMongo = (collectionsForMongo, config) => {
        return new Promise ((success, reject) => {
            try {
                for(let format of config) {                        
                    collectionsForMongo.set(format[0], []);
                }
                success(collectionsForMongo);
            } catch(e) {
                reject('Ошибка при создании стуктуры коллекций для MongoDb: ' + e);
            }
        })               
    } 

    const createCollectionsToMongo = (line, typeLatin, config, collectionsForMongo) => {
         return new Promise((success, reject) => {
            try {
                for(let format of config) { //format[0] -ключ map(либо TYPEZ либо FNAME, format[1] -значение или объект                                                            
                    if(typeLatin == format[0][0]) { //условия выполняется индивидуально для каждой строки                  
                        let position = 1;
                        let stroka = { id: id};
                        //console.log(format[0] + ': ' + stroka._id);
                        for(key in format[1]) { //key-имя поля; fromat[1][key] -значение поля 
                            stroka[key] = line.substr(position, format[1][key]).trim();
                            position += format[1][key];                                     
                        }
                       collectionsForMongo.get(format[0]).push(stroka);                      
                    }
                }
                success();                
           } catch(e) {
                reject('Ошибка в созданни коллекции с данными для MongoDb: ' + e);
            }
         })           
    }

       /* const objectO = {
        id: id,
        snils: line.substr(1, 14),
        oktmo: line.substr(15, 8),
        reg: line.substr(23, 3),
        ra: line.substr(26, 3),
        fam: line.substr(29, 40).trim(),
        im: line.substr(69, 40).trim(),
        ot: line.substr(109, 40).trim(),
        pol: line.substr(149, 1),
        rdat: line.substr(150, 10),
        rstrana: line.substr(160, 40).trim(),
        tipmesr: line.substr(200, 11).trim(),
        rreg: line.substr(211, 40).trim(),
        rra: line.substr(251, 40).trim(),
        rnp: line.substr(291, 40).trim(),
        grajd: line.substr(331, 40).trim(),
        kodfp: line.substr(371, 1),
        koddoc: line.substr(372, 14).trim(),
        serdoc: line.substr(386, 9).trim(),
        nomdoc: line.substr(395, 8).trim(),
        datvdoc: line.substr(403, 10),
        orgdoc: line.substr(413, 80).trim(),
        mrindex: line.substr(493, 6),
        mrreg: line.substr(499, 50).trim(),
        mrra: line.substr(549, 50).trim(),
        mrnp: line.substr(599, 50).trim(),
        mrul: line.substr(649, )
    };


    return objectO;*/


