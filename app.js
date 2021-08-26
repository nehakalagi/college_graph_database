/*tslint:disabled*/
//Defines a routing table which is used to perform different actions based on HTTP Method and URL.

//Allows to dynamically render HTML Pages based on passing arguments to templates.
var express = require('express');
var path = require('path');

//HTTP request logger middleware for node.js
//Function will be called with three arguments tokens, req, and res, 
//where tokens is an object with all defined tokens, req is the HTTP request and res is the HTTP response. 
var logger = require('morgan');

//Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
var cookieParser = require('cookie-parser');

// node.js middleware for handling JSON, Raw, Text and URL encoded form data.
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');

//instance of express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//Driver setup using a bolt protocol
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "applepie"));
var session = driver.session();


// Department Route
app.get('/', function (req, res) {
    var session = driver.session();
    session
        .run("MATCH (n:Department) RETURN n")
        .then(function (result) {
            var deptArr = [];

            result.records.forEach(function (record) {
                //console.log(record._fields[0]);
                deptArr.push(record._fields[0].properties);
            });

            // });

            var session = driver.session();
            session
                .run("MATCH (n:Faculty) RETURN n")
                .then(function (result2) {
                    var facArr = [];

                    result2.records.forEach(function (record) {
                            facArr.push({id: record._fields[0].identity.low,
                            empno: record._fields[0].properties.empno,
                            fac_name: record._fields[0].properties.fac_name,
                            email: record._fields[0].properties.email,
                            dept_no: record._fields[0].properties.dept_no,
                            desig: record._fields[0].properties.desig,
                            salary: record._fields[0].properties.salary
                            });
                    });



                    var session = driver.session();
                    session
                        .run("MATCH (n:Course) RETURN n")
                        .then(function (result3) {
                            var courseArr = [];

                            result3.records.forEach(function (record) {
                                courseArr.push(record._fields[0].properties);
                            });

                            var session = driver.session();
                            session
                                .run("MATCH (n:Student) RETURN n")
                                .then(function (result4) {
                                    var studArr = [];

                                    result4.records.forEach(function (record) {
                                        studArr.push(record._fields[0].properties);
                                    });

                                    console.log(facArr);
                                    res.render('index', {
                                        depts: deptArr,
                                        facs: facArr,
                                        courses: courseArr,
                                        studs: studArr
                                    });
                                })

                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                });

            // temporary
        });

});


// Add Dept Route
app.post('/dept/add', function (req, res) {
    var dept_no = req.body.dept_no;
    var name = req.body.name;

    var session = driver.session();
    session
        .run("CREATE(n:Department {dept_no:$dept_no, name:$name}) RETURN n", { dept_no: dept_no, name: name })
        .then(function (result) {
            session.close();
            res.redirect('/');

        })
        .catch(function (error) {
            console.log(error);
        });
});

app.post('/fac/add', function (req, res) {

    var empno = req.body.empno;
    var fac_name = req.body.fac_name;
    var email = req.body.email;
    var dept_no = req.body.dept_no;
    var desig = req.body.desig;
    var salary = req.body.salary;

    var session = driver.session();
    session
        .run("CREATE(n:Faculty {empno:$empno, fac_name:$fac_name, email:$email, dept_no:$dept_no, desig:$desig, salary:$salary}) RETURN n", { empno: empno, fac_name: fac_name, email: email, dept_no: dept_no, desig: desig, salary: salary })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log(error);
        });
});

app.post('/course/add', function (req, res) {
    var course_no = req.body.course_no;
    var c_name = req.body.c_name;
    var dept_no = req.body.dept_no;

    var session = driver.session();
    session
        .run("CREATE(n:Course {course_no:$course_no, c_name:$c_name, dept_no:$dept_no}) RETURN n", { course_no: course_no, c_name: c_name, dept_no: dept_no })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log(error);
        });
});

app.post('/stud/add', function (req, res) {
    var sid_no = req.body.sid_no;
    var s_name = req.body.s_name;
    var email = req.body.email;
    var dept_no = req.body.dept_no;
    var course_no = req.body.course_no;


    var session = driver.session();
    session
        .run("CREATE(n:Student {sid_no:$sid_no, s_name:$s_name, email:$email, dept_no:$dept_no, course_no:$course_no}) RETURN n", { sid_no: sid_no, s_name: s_name, email: email, dept_no: dept_no, course_no: course_no })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log(error);
        });
});

// Faculty works Route
app.post('/faculty/works', function (req, res) {
    var fac_name = req.body.fac_name;
    var name = req.body.name;

    var session = driver.session();
    session
        .run("MATCH(a:Faculty {fac_name:$fac_name}), (b:Department {name:$name}) MERGE (a)-[r:WORKS_FOR]->(b) RETURN a, b", { fac_name: fac_name, name: name })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log(error);
        });
});

// Student enrolled Route
app.post('/student/enrolled', function (req, res) {
    var s_name = req.body.s_name;
    var c_name = req.body.c_name;

    var session = driver.session();
    session
        .run("MATCH (a:Student {s_name:$s_name}), (b:Course {c_name:$c_name}) MERGE (a)-[r:ENROLLED]->(b) RETURN a,b", { s_name: s_name, c_name: c_name })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log(error);
        });
});

// Faculty teach Route
app.post('/faculty/teach', function (req, res) {
    var fac_name = req.body.fac_name;
    var c_name = req.body.c_name;

    var session = driver.session();
    session
        .run("MATCH (a:Faculty {fac_name:$fac_name}), (b:Course {c_name:$c_name}) MERGE (a)-[r:TEACH]->(b) RETURN a,b", { fac_name: fac_name, c_name: c_name })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log(error);
        });
});

// Student studies_under Route
app.post('/student/studies_under', function (req, res) {
    var s_name = req.body.s_name;
    var name = req.body.name;

    var session = driver.session();
    session
        .run("MATCH (a:Student {s_name:$s_name}), (b:Department {name:$name}) MERGE (a)-[r:STUDIES_UNDER]->(b) RETURN a,b", { s_name: s_name, name: name })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log(error);
        });
});


app.listen(3000);

console.log('Server started on port 3000');

module.exports = app;