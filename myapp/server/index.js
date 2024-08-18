import express from "express";
import mysql from "mysql2/promise";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import handlebars from 'express-handlebars';
import multer from "multer";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.render('home');
});

const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.sendStatus(403);
    }

    jwt.verify(token, 'superSecretKey', (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/animals');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });


const initializeDatabaseConnection = async () => {
    try {
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            database: "Animals",
            password: "qwertyuiop123",
        });
        console.log("db connected!");
        return connection;
    } catch (error) {
        console.error("Unable to connect to the database:", error);
        process.exit(1);
    }
};

const connection = await initializeDatabaseConnection();


app.post("/api/register", async (req, res) => {

    const body = req.body;

    body.password = await bcrypt.hash(body.password, 10);

    try {
        await connection.query(
            "INSERT INTO users (email, username, password) values (?, ?, ?)",
            [body.email, body.username, body.password]
        );
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            res.status(400).send({ error: "User already created!" });
        } else {
            res.status(500).end();
        }
    }
    res.status(201).send({ status: "ok" });
});

app.post("/api/login", async (req, res) => {

    const reqPass = req.body.password;
    const [queryResp, ..._] = await connection.query(
        "select password from users where email=?",
        [req.body.email]
    );
    if (!queryResp.length) {
        res.status(400).send({ error: "Doesnt exist" });
    }
    console.log(queryResp);
    const isMatch = await bcrypt.compare(reqPass, queryResp[0].password);
    if (!isMatch) {
        res.status(400).send({ error: "Parola gresita" });
    }

    const token = jwt.sign({ email: req.body.email }, "superSecretKey", {
        expiresIn: "1h",
    });
    console.log(token);
    res.status(200).send({ status: "ok", token: token });
});


app.use(authenticateJWT);

app.get("/api/animal/:animal", authenticateJWT, async (req, res) => {
    const animal = req.params.animal;
    const { random, breed } = req.query;

    if (!["dog", "cat", "fish"].includes(animal)) {
        return res.status(400).send({ error: "Invalid animal type." });
    }

    try {
        if (animal === "dog") {
            let imageUrl;
            if (random === "1") {
                const response = await axios.get("https://dog.ceo/api/breeds/image/random");
                imageUrl = response.data.message;
            } else if (breed) {
                const response = await axios.get(`https://dog.ceo/api/breed/${breed}/images/random`);
                imageUrl = response.data.message;
            }


            if (!imageUrl) {
                return res.status(404).send({ error: "Breed not found." });
            }

            res.send({
                status: "success",
                data: {
                    animal,
                    breed,
                    exampleImage: imageUrl,
                    source: "dog.ceo"
                }
            });
        } else if (animal === "cat" || animal === "fish") {
            const animalDir = path.join(__dirname, 'public', 'images', animal + 's');

            if (random === "1") {

                const breeds = fs.readdirSync(animalDir);
                if (breeds.length === 0) {
                    return res.status(404).send({ error: "No breeds available." });
                }
                const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];


                const breedDir = path.join(animalDir, randomBreed);
                const images = fs.readdirSync(breedDir);
                if (images.length === 0) {
                    return res.status(404).send({ error: "No images available for this breed." });
                }
                const randomImage = images[Math.floor(Math.random() * images.length)];
                const imagePath = path.join('images', animal + 's', randomBreed, randomImage);

                res.send({
                    status: "success",
                    data: {
                        animal,
                        breed: randomBreed,
                        exampleImage: imagePath,
                        source: "own"
                    }
                });
            } else if (breed) {
                const breedDir = path.join(animalDir, breed);
                if (!fs.existsSync(breedDir)) {
                    return res.status(404).send({ error: "Breed not found." });
                }

                const images = fs.readdirSync(breedDir);
                if (images.length === 0) {
                    return res.status(404).send({ error: "No images available for this breed." });
                }
                const randomImage = images[Math.floor(Math.random() * images.length)];
                const imagePath = path.join('images', animal + 's', breed, randomImage);

                res.send({
                    status: "success",
                    data: {
                        animal,
                        breed,
                        exampleImage: imagePath,
                        source: "own"
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ error: "An error occurred.", details: error.message });
    }
});

app.post('/api/animal', upload.single('image'), authenticateJWT, async (req, res) => {
    const { breed, animalType } = req.body;
    const imageUrl = path.join('images', 'animals', req.file.filename);

    try {

        await connection.query(
            "INSERT INTO animals (breed, animal_type, image_url) VALUES (?, ?, ?)",
            [breed, animalType, imageUrl]
        );

        res.status(201).send({ status: "success", message: "Animal added successfully!" });
    } catch (error) {
        console.error("Error adding animal:", error);
        res.status(500).send({ error: "An error occurred while adding the animal." });
    }
});


app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
});

