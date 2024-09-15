require('dotenv').config(); // Load environment variables from .env file
console.log(process.env.PORT);

const bcrypt = require('bcrypt');
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors'); // Import the CORS package
const FormData = require('form-data');
const session = require('express-session');
const Sequelize = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const passport = require('./passport-config');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const path = require('path');




const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Define API_KEY constant

const app = express();  
app.disable('x-powered-by');  
const port = process.env.PORT ?? 3000;

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};


app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(bodyParser.json());

// Middleware to parse JSON bodies
app.use(express.json());


app.use(express.static('public'));


app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors());

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



/*
// Set up session middleware
app.use((req, res, next) => {
  console.log('Session Middleware - Initializing...');
  console.log('Secure Cookie:', process.env.NODE_ENV === 'production');
  console.log('Session ID before session middleware:', req.sessionID);
  next();
});
*/



const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql'
});

const store = new SequelizeStore({
  db: sequelize
});
// Sync the session store
store.sync().then(() => {
  store.startExpiringSessions(); // Ensure expired sessions are cleaned up
});

app.set('trust proxy', 1);

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    secure: false, 
    httpOnly: true,
    sameSite: 'strict',
     maxAge: 1000 * 60 * 60 * 3 // Session expires after 3 HOURS
  }
}));

store.sync(); // Create the sessions table if it doesn't exist

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

/*
// Log session information after middleware initialization
app.use((req, res, next) => {
  console.log('Session Middleware - After Initialization...');
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  next();
});


// Example route to test session functionality
app.get('/test-session', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  console.log('Session Data on /test-session:', req.session);
  res.send(`Number of views: ${req.session.views}`);
});
*/

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth.html');
}


app.get('/', (req, res) => {
  res.render('auth');
});


app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/auth.html');
  });
});

//register
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;


  try {
    
      // Verifica email y contraseña como en tu código actual
      if (!validator.isEmail(email)) {
          return res.status(400).send('Invalid email format.');
      }

      if (!password || password.length < 6) {
          return res.status(400).send('Password must be at least 6 characters long.');
      }

      const connection = await mysql.createConnection(config);

      // Verifica si el correo electrónico ya está registrado
      const [rows] = await connection.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
          await connection.end();
          return res.status(400).send('Email is already registered.');
      }

      // Verifica si el nombre de usuario ya está en uso
      const [userRows] = await connection.execute('SELECT name FROM users WHERE name = ?', [username]);
      if (userRows.length > 0) {
          await connection.end();
          return res.status(400).send('Username is already taken.');
      }
    

      // Cifra la contraseña y registra al usuario
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute(
          'INSERT INTO users (name, email, password, credits) VALUES (?, ?, ?, ?)',
          [username, email, hashedPassword, 5]
      );
      
      const [newUser] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
      await connection.end();

      req.login(newUser[0], (err) => {
          if (err) return next(err);
          res.status(200).send('User registered and logged in successfully.');
      });

  } catch (err) {
      console.error('Errorregistering user:', err);
      res.status(500).send('Error occurred while registering new user.');
  }
});

// Rate limiter middleware to limit repeated login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Account locked due to multiple failed login attempts. Please try again later.'
});

app.post('/login', loginLimiter, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      await connection.end();
      return res.status(400).send('Invalid email or password.');
    }

    const user = rows[0];
    if (user.google_id && !user.password) {
      await connection.end();
      return res.status(400).send('This email is registered via Google. Please use Google login.');
    }

    if (user.failed_login_attempts >= 5) {
      await connection.end();
      return res.status(403).send('Account locked due to multiple failed login attempts. Please try again later.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await connection.execute('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', [user.id]);
      await connection.end();
      return res.status(400).send('Invalid email or password.');
    }

    // Reset failed login attempts on successful login
    await connection.execute('UPDATE users SET failed_login_attempts = 0 WHERE id = ?', [user.id]);

    await connection.end();

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(200).send('User logged in successfully.');
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Error occurred while logging in.');
  }
});

// Protect the app.html route
app.get('/app.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});


app.get('/api/user', ensureAuthenticated, (req, res) => {
  res.json(req.user);
});

app.get('/api/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/students', ensureAuthenticated, async (req, res) => {
  const { name, age, gender, hobbies, passions, grade_level, best_friend_name, favorite_food, additional_info } = req.body;

  if (!name || !age || !gender || !grade_level) {
    return res.status(400).send('Name, age, gender, and grade level are required fields.');
  }

  try {
    const connection = await mysql.createConnection(config);

    // Insert the new student into the students table
    const [result] = await connection.execute(
      `INSERT INTO students (user_id, name, age, gender, hobbies, passions, grade_level, best_friend_name, favorite_food, additional_info) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, // The authenticated teacher's user_id
        name,
        age,
        gender,
        hobbies || null,
        passions || null,
        grade_level,
        best_friend_name || null,
        favorite_food || null,
        additional_info || null
      ]
    );

    await connection.end();

    // Respond with a success message
    res.status(200).send('Student added successfully.');
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).send('Error occurred while adding the student.');
  }
});

// Route to fetch students for the authenticated teacher
app.get('/api/students', ensureAuthenticated, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config);
    
    // Retrieve students for the authenticated teacher, including id and name
    const [rows] = await connection.execute(
      'SELECT id, name FROM students WHERE user_id = ?',
      [req.user.id]
    );

    await connection.end();

    // Respond with the list of students
    res.json(rows); // Ensure the response contains both id and name
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).send('Error occurred while fetching students.');
  }
});

app.get('/api/students/:id', ensureAuthenticated, async (req, res) => {
  const studentId = req.params.id;

  try {
    const connection = await mysql.createConnection(config);

    // Retrieve the specific student by ID and ensure they belong to the authenticated user
    const [rows] = await connection.execute(
      'SELECT * FROM students WHERE id = ? AND user_id = ?',
      [studentId, req.user.id]
    );

    await connection.end();

    if (rows.length === 0) {
      return res.status(404).send('Student not found.');
    }

    // Respond with the student's details
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching student details:', err);
    res.status(500).send('Error occurred while fetching student details.');
  }
});

// Route to update a student's details by ID
app.put('/api/students/:id', ensureAuthenticated, async (req, res) => {
  const studentId = req.params.id;
  const { name, age, gender, hobbies, passions, grade_level, best_friend_name, favorite_food, additional_info } = req.body;

  if (!name || !age || !gender || !grade_level) {
    return res.status(400).send('Name, age, gender, and grade level are required fields.');
  }

  try {
    const connection = await mysql.createConnection(config);

    // Update the student's details, but only if the student belongs to the authenticated user
    const [result] = await connection.execute(
      `UPDATE students 
       SET name = ?, age = ?, gender = ?, hobbies = ?, passions = ?, grade_level = ?, best_friend_name = ?, favorite_food = ?, additional_info = ?
       WHERE id = ? AND user_id = ?`,
      [
        name,
        age,
        gender,
        hobbies || null,
        passions || null,
        grade_level,
        best_friend_name || null,
        favorite_food || null,
        additional_info || null,
        studentId,
        req.user.id // Ensure the user is only updating their own students
      ]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).send('Student not found or you are not authorized to update this student.');
    }

    res.status(200).send('Student updated successfully.');
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).send('Error occurred while updating the student.');
  }
});


async function fetchWithRetry(url, options, retries = 3, delay = 3000) {
    try {
      const response = await axios(url, options);
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries === 0) {
        throw error;
      }
      console.warn(`Retrying after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
  }


app.post('/generate-question', async (req, res) => {
  const { studentId, topic, numberOfQuestions } = req.body;

  if (!studentId || !topic || !numberOfQuestions) {
    return res.status(400).send('Required data is missing');
  }

  try {
    // Create a connection to the MySQL database
    const connection = await mysql.createConnection(config);

    // Fetch the student details by ID
    const [rows] = await connection.execute('SELECT * FROM students WHERE id = ? AND user_id = ?', [studentId, req.user.id]);

    // Close the database connection
    await connection.end();

    if (rows.length === 0) {
      return res.status(404).send('Student not found.');
    }

    const studentData = rows[0];

    // Build the prompt using the student's data
    const prompt = `${studentData.name} needs help with ${topic}. Give me a question that could help them understand that topic better. 
    Take into account that they are ${studentData.age} years old, ${studentData.gender}, 
    they like ${studentData.hobbies}. Their passions include ${studentData.passions}, 
    their best friend is named ${studentData.best_friend_name}, 
    and their favorite food is ${studentData.favorite_food}. 
    Additionally, here is some more information: ${studentData.additional_info}.  Get creative with the questions, consider that the 
    student's interests and needs can mean something deeper. This question will be part of a personalized worksheet so dont make it more than 1 paragraph.`;

    // Initialize an array to store questions
    const questions = [];

    // Generate the requested number of unique questions
    while (questions.length < numberOfQuestions) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(500).json({ error: 'Error generating the question' });
      }

      // Extract the generated question
      const generatedQuestion = data.choices[0].message.content.trim();

      // Add the question to the array if it's not already present
      if (!questions.includes(generatedQuestion)) {
        questions.push(generatedQuestion);
      }
    }

    console.log(studentData.name)
    // Send the student's name and questions back as a response
    res.json({
      studentName: studentData.name,
      questions
    });

  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).send('Error occurred while generating the questions.');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});



