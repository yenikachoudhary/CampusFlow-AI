import { mongo } from "../db/mongo.js";
import { env } from "../config/env.js";

export function validateEmbedding(embedding) {
  if (!Array.isArray(embedding) || embedding.length !== 128) {
    throw new Error("Embedding must be an array of exactly 128 numbers");
  }
  if (!embedding.every((value) => Number.isFinite(value))) {
    throw new Error("Embedding contains a non-numeric value");
  }
  return embedding.map(Number);
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function storeEmbedding(studentId, embedding) {
  const vector = validateEmbedding(embedding);
  await mongo().collection("studentEmbeddings").updateOne(
    { studentId },
    { $set: { studentId, embedding: vector, updatedAt: new Date() } },
    { upsert: true }
  );
  return { studentId, dimensions: 128 };
}

async function cosineMatch(vector) {
  const docs = await mongo().collection("studentEmbeddings").find({}, {}).toArray();
  return docs
    .map((doc) => ({ studentId: doc.studentId, score: cosine(doc.embedding || [], vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, env.vectorLimit);
}

export async function matchEmbedding(embedding) {
  const vector = validateEmbedding(embedding);
  try {
    return await mongo().collection("studentEmbeddings").aggregate([
      {
        $vectorSearch: {
          index: "student_embedding_vector_index",
          path: "embedding",
          queryVector: vector,
          numCandidates: env.vectorNumCandidates,
          limit: env.vectorLimit
        }
      },
      {
        $project: {
          _id: 0,
          studentId: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]).toArray();
  } catch (error) {
    console.warn("Atlas Vector Search unavailable, using cosine fallback:", error.message);
    return cosineMatch(vector);
  }
}
