const fs = require('fs');
const util = require('util');
const stream = require('stream');
const es = require('event-stream');
const readline = require('readline');
const {promisify} = require('util');
const iconv = require('iconv-lite');
const subsidiary = require('./subsidiary');    

//через свой промис
const getPathToTemplates = line => {    
    return new Promise( (resolve, reject) => {
        const format = line.substr(1,5); 

        switch (format.trim()) {
            case '6.3.2' : resolve('templates/F632.csv') ; break;
            case '4.1' : resolve('templates/F41.csv') ; break;
            case '6.2.1': resolve('templates/F621.csv'); break;
            case '6.2': resolve('templates/F62.csv'); break;
            case '6.3': resolve('templates/F63.csv'); break;
            case '6.4': resolve('templates/F64.csv'); break;
            default : resolve(null);
        }  
    })                            
}

const getFormatConfig = pathTemplate => {
    return new Promise( (resolve, reject) => {
        let config = new Map();
        let type = null;
        let obj = null;
         const s = fs.createReadStream(pathTemplate)
        .pipe(iconv.decodeStream('1251'))
        .pipe(es.split())
        .pipe(es.mapSync(function(line){
        s.pause();              
        
        const parseLine = line.split(';');
        if(parseLine[0] ==='FNAME') { //обновляем переменную type можно TYPEZ(Кириллица) или FNAME(Латиница)
                type = parseLine[1]; 
                obj = {};                                         
        }        

        //добавляем к объекту ключи и значения
        if(type && parseLine[0] && parseLine[1] && parseLine[0] != 'BEGIN' 
            && parseLine[0] != 'END' && parseLine[0] != 'TYPEZ' 
            && parseLine[0] != 'FNAME' && parseLine[0] != 'ZAPV') {                            
                obj[parseLine[0]] = +parseLine[1];  //добавляем новое поле в объект для определенного типа          
        }

        //Добавляем объект с полями определнного типа(Например О, Л, C, П)
        if(type && obj && parseLine[0] ==='END') { 
            config.set(type, obj);
            type = null;
            obj = null;
        }         
        s.resume();
        }))        
        .on('error', function(err){
            reject(err);
            console.log('Ошибка при чтении шаблона', err);
        })
        .on('end', function(){            
            console.log('Шаблон успешно прочитан.');
            //console.log(config);
            resolve(config);
        })
    })    
}

module.exports.getPathToTemplates = getPathToTemplates;
module.exports.getFormatConfig = getFormatConfig;