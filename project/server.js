/* File formost of node/express operations */

const express = require('express');
// const { connect } = require('./public/scripts/dbconfig');
const app = express();
var path = require('path')
var http = require('http');
const server = http.createServer(app);
const { Server, Socket } = require("socket.io");
const io = new Server(server);

const con = require('./public/scripts/dbconfig');

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
var bodyParser = require('body-parser'); 
const session = require("express-session");
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.json());
const sayHi = require('./public/scripts/dbconfig');
const mysql = require('mysql2');
const { add } = require('nodemon/lib/rules');
var port = process.env.PORT;
var query;
console.log(port)
var ticket_id;
var handler_id;
var problem_type_id;
var last_updated;
var software_id;

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

//5005

app.get('/', (req, res) =>{
    console.log("WORK")
    res.send("<h1>Hi</h1>")
    // res.render('login.html')

});

app.get('/faq.html', (req, res) =>{
    console.log("faq")
    // res.sendFile(path.join(__dirname +  '/faq.html'));
    // res.render('login.html')

    
    
    con.query("SELECT ticket.status, ticket.problem_description, problem_type.name FROM ticket INNER JOIN problem_type ON ticket.problem_type_id = problem_type.problem_type_id", 
    function(err, result, fields) {
        if (err) throw err;
        console.log(result);

        if (result.length>0) {
            res.render('faq', {
                dropdownVals: result
               
                // ticket_details: result
    
            });
            //     dropdownVals: query_output,
            //     newdropdownVals: query,
            //     // problem_resolution: result
            // })
        }
        
    });
    con.end();
});


app.get('/login.html', (req, res) =>{
    console.log("login")
    res.sendFile(path.join(__dirname +  '/login.html'));
    // res.render('login.html')

});

app.get('/account.html', (req, res) =>{
    console.log("account")
    res.sendFile(path.join(__dirname +  '/account.html'));
    // res.render('login.html')

});

app.get('/login.html', (req, res) =>{
    console.log("analyst")
    res.sendFile(path.join(__dirname +  '/analyst.html'));
    // res.render('login.html')

});

app.all('/auth', urlencodedParser, (req, res) =>{
    console.log(req.body);
    let user_in = req.body.username;
    let pass_in = req.body.password;
    if (user_in && pass_in) {
        con.query('SELECT * FROM users WHERE username = ? AND AES_DECRYPT(password, SHA2(?, 256)) = ?', [user_in, user_in, pass_in], function(error, results, fields) {
            if (error) throw error;
			if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = user_in;
                req.session.save();
				// res.send("Success! You are logged in as ", + req.session.username);
                res.redirect('/home');
			} else {
				res.send('Incorrect Username and/or Password!');
			}			
            res.end();
          
        });
        con.end();
	} else {
        
		res.send('Please enter Username and Password!');
		res.end();
	}
});

app.get('/home', (req, res) => {
	if (req.session.loggedin) {
		res.send('Welcome back, ' + req.session.username + '!');
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
});

app.get('/index.html', (req, res) => {  
    console.log("index")
    // res.writeHead(200, {'content-type':'text/html'})
    

    con.query(`SELECT ticket_id, status, last_updated, problem_type.name, h.name  FROM ticket 
    INNER JOIN problem_type ON ticket.problem_type_id = problem_type.problem_type_id 
    INNER JOIN employee ON ticket.employee_id = employee.employee_id
    INNER JOIN (SELECT user_id, employee.name FROM handler
                INNER JOIN employee ON handler.user_id = employee.employee_id
                UNION
                SELECT external_specialist_id AS user_id, name FROM external_specialist) h ON ticket.handler_id = h.user_id
    WHERE ticket.employee_id = 2005
    ORDER BY CASE WHEN status = 'dropped' THEN 1
                WHEN status = 'submitted' THEN 2
                WHEN status = 'pending' THEN 3
                WHEN status = 'active' THEN 4
                ELSE 5 END`, 
    function (err, result, fields) {
        if (err) throw err;
        // console.log(result);

        query_output = result;

      
    });
   

    con.query(`SELECT ticket_id, status, problem_type.name  FROM ticket 
    INNER JOIN problem_type ON ticket.problem_type_id = problem_type.problem_type_id 
    WHERE ticket.employee_id = 2005
    ORDER BY CASE WHEN status = 'dropped' THEN 1
                WHEN status = 'submitted' THEN 2
                WHEN status = 'pending' THEN 3
                WHEN status = 'active' THEN 4
                ELSE 5 END`, 
    function (err, result, fields) {
        if (err) throw err;

        query = result

       
    });
  

    
        con.query(`SELECT ticket_id, status, priority, operating_system, problem_description, notes, software.name as software, ticket.hardware_id, hardware.manufacturer, hardware.make, hardware.model, problem_type.name,  h.name as Handler from ticket
        INNER JOIN hardware ON ticket.hardware_id = hardware.hardware_id
        INNER JOIN  software on ticket.software_id = software.software_id 
        INNER JOIN problem_type on ticket.problem_type_id = problem_type.problem_type_id
        INNER JOIN (SELECT user_id, employee.name FROM handler
        INNER JOIN employee ON handler.user_id = employee.employee_id
        UNION
        SELECT external_specialist_id AS user_id, name FROM external_specialist) h ON ticket.handler_id = h.user_id
        WHERE ticket_id = 1;`,[ticket_id],function(err, result, fields) {
        console.log(err);
        if (err) throw err;
        

        res.render('index', {
            dropdownVals: query_output,
            newdropdownVals: query,
        })

        
        io.on('connection',  (socket) => {
            console.log('connected')
            socket.on("message", (msg) => {
                console.log(parseInt(msg.id));
                // ticket_id = parseInt(msg.id);
                io.send('message', result);
                // io.emit('ticket_details', msg);
    
            })
            })

          
        });
        // con.end();

    //     con.query(`SELECT ticket_id, status, priority, operating_system, problem_description, notes, software.name as software, hardware.manufacturer, hardware.make, hardware.model, problem_type.name,  h.name as Handler from ticket
    //         INNER JOIN hardware ON ticket.hardware_id = hardware.hardware_id
    //         INNER JOIN  software on ticket.software_id = software.software_id 
    //         INNER JOIN problem_type on ticket.problem_type_id = problem_type.problem_type_id
    //         INNER JOIN (SELECT user_id, employee.name FROM handler
    //         INNER JOIN employee ON handler.user_id = employee.employee_id
    //         UNION
    //         SELECT external_specialist_id AS user_id, name FROM external_specialist) h ON ticket.handler_id = h.user_id
    //         WHERE ticket_id = 1;`,[ticket_id],function (err, result, fields) {

    //         if (err) throw err;

    // });


    io.on('connection',  (socket) => {
        console.log('connected')

        socket.on("update_message", (msg) => {
            console.log(msg);
            handler_id = msg.handler_name;
            problem_type_id = msg.problem_type;
            software_id = msg.software;
            con.query(`SELECT problem_type_id from problem_type;`,[problem_type_id],function (err, result, fields) {
                if (err) throw err;
                console.log(result);
                
             
          });
          con.end();

        });
    
    
        })

    

    //killall -9 node
    
});


// var port = normalizePort(process.env.PORT);
// app.set('port', port);

server.listen(5005, () => {
    console.log('listening for requests on port 5005');
});

// app.listen(5005, ()=>console.log(' SERVER CONNECTED '))