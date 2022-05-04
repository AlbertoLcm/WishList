const mysql = require('mysql');

const conexion = mysql.createConnection({
    host: 'localhost',
    database: 'myshop',
    user: 'root',
    password: ''
});

conexion.connect((err) => {
    if(err){
        throw err;
        return;
    }
    console.log('Conexion perfecta');

});

module.exports = conexion; 