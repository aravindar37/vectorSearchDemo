const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const bcrypt = require("bcrypt");
const movieSearch = require("./services/movieSearch");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

const url = "mongodb+srv://username:password@server.project.mongodb.net/"; //Atlas URL
const dbName = "vectorDB";
let db;

const client = new MongoClient(url);
db = client.db(dbName);

// API endpoint for movie search
app.get("/api/movies", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    console.log("Fetching random movies");
    const movies = await database.collection("searchMovies").aggregate([
      {
        $sample: {
          size: 10,
        },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          imageUrl: "$poster",
        },
      },
    ]).toArray();
    res.status(200).json(movies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/movies/search", async (req, res) => {
    try {
      const searchString = req.query.key;
      const decodedString = decodeURIComponent(searchString);
      const database = client.db("sample_mflix");
      console.log(`Searching for movies with: ${decodedString}`);
      const movies = await movieSearch(decodedString, database);
      res.status(200).json(movies);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
