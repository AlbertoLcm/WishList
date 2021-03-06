const express = require('express');
const { json } = require('express/lib/response');
const hbs = require('hbs');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;

const app = express();
const port = 8080;

const conexion = require('./database/db.js');

//handlebars
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// Middlewers
// Lectura y parseo del body 
app.use(express.urlencoded({extended:true}));
app.use(express(json))

app.use(express.static('public'));


// configuramos para la sesion
app.use(cookieParser('secreto12'));
app.use(session({
    secret: 'secreto12',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    app.locals.user = req.user;
    console.log(app.locals)
    next();
  });


passport.use(new PassportLocal((username, password, done) => {
        conexion.query('select * from usuarios where correo = ? and contra = ?',[username, password], (error, results) => {
        try {
            
            console.log(results[0].correo, results[0].contra)
            
            if(username === results[0].correo && password === results[0].contra){
                return done(null, {id:results[0].id_usuario, name:results[0].correo}) //tenía name
            }else{  
                done(null, false);
            
            }
        } catch (error) {
            console.log('Usuario o contraseña inconrrecto');
        }

    });
    
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
})

//deserializacion 
passport.deserializeUser((id, done) => {
    conexion.query('select * from usuarios where id_usuario = ?', [id], (error, results) => {
        if(error) throw error;
        done(null, {id:results[0].id_usuario, name:results[0].correo}); //tenía nombre
        console.log(results[0].id_usuario);
    });
})

app.get('/', (req, res, next)=>{
    if(!req.isAuthenticated()) return next();

    res.redirect('/home');
}, (req, res) => {
    res.render('login');
});


app.post('/', passport.authenticate('local',{
    successRedirect: '/home',
    failureRedirect: '/',
    passReqToCallback: true
}));

// fin de session

// Routers del login
app.post('/registrar', (req, res) => {
    const {nombre, apellido, correo, password} = req.body;

    conexion.query('insert into usuarios set ?', {
        nombre: nombre, 
        apellidos: apellido, 
        correo: correo, 
        contra: password}, (error, results) => {
        if (error) throw error;
        res.redirect('/home');
    });
});

app.post('/editar', (req, res) => {
    const {correo, password} = req.body;

    conexion.query('update usuarios set ? where correo = ?', [{
        contra: password},
        correo], (error, results) => {
        if (error) throw error;
        res.redirect('/');
    });
});

app.get('/logout', (req, res, next) => {
    req.logout();
    res.redirect('/');
});


// Routes de home
app.get('/home', (req, res) => {
    conexion.query('select * from productos', (error, productos) => {

        res.render('home', {productos});
    })
});

app.get('/home/:id', (req, res) => {
    const id = req.params.id;
    conexion.query('select * from productos where id_producto = ?',[id], (error, producto) => {
        res.render('producto', {producto});
        console.log(producto)
    })
});

app.get('/home/add/:id', (req, res) => {
    const id = req.params.id;
    const idUser = req.user.id;
    conexion.query('insert into wishlist set ?', {
        id_usuario: idUser, 
        id_producto: id}, (error, results) => {
        if (error) throw error;
        res.redirect('/wishlist');
    });
});

app.get('/wishlist', (req, res) => {
    const id = req.user.id;
    // Esta consulta es la clave bob toral
    conexion.query('SELECT * from productos JOIN wishlist on wishlist.id_producto = productos.id_producto WHERE wishlist.id_usuario = ?', [id], (error, productos) => {
        if (error) throw error;
        res.render('wishlist', {productos});
    });
});

app.get('/home/delete/:id', (req, res) => {
    const id = req.params.id;
    conexion.query('delete from wishlist where id_producto = ?;', [id], (error, contactos) => {
        if (error) throw error;
        res.redirect('/wishlist');
    });
    console.log('Hola desde el delete', id);
});
// comentario manzana con pera verde

app.listen(port, () => {
    console.log(`Listen on port http://localhost:${port}`);
});

/*
___________█
_________█444█
________█44444█
_______█44█_█44█
______█44█___█44█
_____█44█___███████████████████████
____█44█____█4444444444444444444█
___█44█______█44██████████████44█  
__█44█████████████44█_______█44█     
_█4444444444444444444█____█44█
████████████████████████___█44█
_________________█44█___█44█
__________________█44█_█44█
___________________█44444█
____________________█444█
______________________█
*/
