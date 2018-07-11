const mongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';
const {promisify} = require('util');

const connectionDb = () => {
	return new Promise((resolve, reject) => {
		try {
			const client = mongoClient.connect(url, (err, client) => {				
				resolve(client);
			})
		} catch(e) {
			reject('Ошибка соединения с базой данных:' + e);
		}
	});	
}

const insertArray = async (client, map) => {			
		try {
			if(!client) {
				client = await mongoClient.connect(url);
			}			
			const db = await client.db('formats');									
			for(row of map) {
				//console.log('Подготовка работы: ' + row[0] + ": " + row[1].length);
				if(row[1].length === 0) continue;											
				const col =  await db.collection(row[0]); //row[0] - key - O632, L632, S632, M632, P632, I632								
				await col.insertMany(row[1]);
				//console.log('Добвленно: ' + row[0] + ": " + row[1].length);					
			}
			return true;
		} catch (e) {
			console.log('Ошибка добавление данных в базу данных:' + e);
			client.close();
			return false;
		}
}

const clearDateBase = async (client, map) => {
	
	try {
		if(!client) {
			client = await mongoClient.connect(url);
		}		
		const db = await client.db('formats');
		for(row of map) {
			const col = await db.collection(row[0]);
			const count = await col.count();
			if(count > 0) {
				await col.drop();
				console.log('Очищищена коллекция: ' + row[0]);
			}
		}
	} catch (e) {
		console.log("Ошибка очистки базы данных: " + e);
		client.close();
	}
}

module.exports.connectionDb = connectionDb; 
module.exports.insertArray = insertArray;
module.exports.clearDateBase = clearDateBase;