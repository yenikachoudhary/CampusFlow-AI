import { mongo } from "../db/mongo.js";
import { env } from "../config/env.js";

/**
 * Validates that an embedding is strictly an array of 128 finite numbers.
 * Enforces privacy rule: raw pixels/imagery are strictly rejected.
 * @param {Array<number>} embedding
 * @returns {Array<number>}
 */
export function validateEmbedding(embedding) {
  if (!Array.isArray(embedding) || embedding.length !== 128) {
    throw new Error("Embedding must be an array of exactly 128 floating-point numbers");
  }
  if (!embedding.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Embedding contains non-numeric or non-finite values");
  }
  return embedding.map(Number);
}

/**
 * Calculates standard Cosine Similarity between two N-dimensional vectors.
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @returns {number} Value between -1.0 and 1.0 (or 0.0 to 1.0 for normalized vectors)
 */
export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Stores a student's 128-dimensional embedding vector in MongoDB Atlas.
 * Drops any raw pixels or image metadata immediately upon receipt.
 * @param {string} studentId
 * @param {Array<number>} embedding
 * @returns {Promise<object>}
 */
export async function storeEmbedding(studentId, embedding) {
  const vector = validateEmbedding(embedding);
  await mongo()
    .collection("studentEmbeddings")
    .updateOne(
      { studentId },
      { $set: { studentId, embedding: vector, updatedAt: new Date() } },
      { upsert: true }
    );
  return { studentId, dimensions: 128, stored: true };
}

/**
 * Fallback exact cosine matching algorithm over in-memory or Atlas collections.
 * Used during local development or before Atlas Vector Search index finishes building.
 * @param {Array<number>} vector
 * @returns {Promise<Array<{studentId: string, score: number}>>}
 */
async function fallbackCosineMatch(vector) {
  const docs = await mongo().collection("studentEmbeddings").find({}, { projection: { studentId: 1, embedding: 1 } }).toArray();
  return docs
    .map((doc) => ({
      studentId: doc.studentId,
      score: cosineSimilarity(doc.embedding || [], vector)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, env.vectorLimit);
}

/**
 * Executes sub-second vector search matching against MongoDB Atlas Vector Search ($vectorSearch).
 * Seamlessly falls back to exact cosine matching if the Atlas index is building or in memory mode.
 * @param {Array<number>} embedding
 * @returns {Promise<Array<{studentId: string, score: number}>>}
 */
export async function matchEmbedding(embedding) {
  const vector = validateEmbedding(embedding);
  try {
    const results = await mongo()
      .collection("studentEmbeddings")
      .aggregate([
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
      ])
      .toArray();

    if (results && results.length > 0) return results;
    return fallbackCosineMatch(vector);
  } catch (error) {
    // Graceful fallback to exact cosine computation
    return fallbackCosineMatch(vector);
  }
}
