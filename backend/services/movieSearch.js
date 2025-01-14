const { ChatOllama, OllamaEmbeddings } = require("@langchain/ollama");
const { ObjectId } = require("mongodb");
require("dotenv").config();

const embeddingModel = new OllamaEmbeddings({
  model: process.env.EMBEDDING_MODEL,
  baseUrl: process.env.EMBEDDING_MODEL_BASE_URL,
});

async function movieSearch(inputText, db) {
  try {
    const embedding = await embeddingModel.embedQuery(inputText);

    const embeddingCollection = db.collection("searchMovies");
    console.debug(`Embedding of: ${embedding.length} dimensions generated`);
    // Perform a vector search in MongoDB
    console.log("Searching for movies");
    const matchedDocuments = await embeddingCollection
      .aggregate([
        {
          $vectorSearch: {
            index: "movie_index",
            path: "embedding",
            queryVector: embedding,
            // numCandidates: 10,
            exact: true,
            limit: 10,
          },
        },
        {
          $project: {
            _id: 0,
            title: 1,
            imageUrl: "$poster",
          },
        },
      ])
      .toArray();

    console.debug(
      `Vector Search Matched documents: ${matchedDocuments.length}`
    );
    // Pass matched documents to the completion model
    return matchedDocuments;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

// Utility function to create a promise with timeout
function withTimeout(promise, timeoutMs) {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}

module.exports = movieSearch;
