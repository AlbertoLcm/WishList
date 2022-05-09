const mysql = require('mysql');

const conexion = mysql.createConnection({
    host: 'localhost',
    database: 'myshop',
    user: 'root',
    password: ''
});

conexion.connect((err) => {
    if(err){
        console.warn('\n\nAlgo ha salido mal con la BD :c\n\n');
        throw err
    }
    console.log('Conexion perfecta');

});

module.exports = conexion; 