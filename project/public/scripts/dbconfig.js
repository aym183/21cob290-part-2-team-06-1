const mysql = require('mysql2');
//local mysql db connection
const dbConn = mysql.createConnection({
 host : 'localhost',
 user : 'teamb005',
 password : 'MURkYruWq1',
 database : 'teamb005',
 dateStrings: true
});
dbConn.connect(function(err) {
 if (err) throw err;
 console.log("Database Connected!");
});
module.exports = dbConn;