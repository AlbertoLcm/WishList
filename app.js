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


// configuramos para la session
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
                return done(null, {id:results[0].id_usuario, name:results[0].name})
            }else{
                done(null, false);
            
            }
        } catch (error) {
            console.log(error, 'Usuario o contrase;a inconrrecto');
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
        done(null, {id:results[0].id_usuario, name:results[0].nombre});
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