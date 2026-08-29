/* Run once against MongoDB Atlas if you want to create the Atlas Vector Search index manually.

Collection: studentEmbeddings
Index name: student_embedding_vector_index

JSON definition for Atlas Search/Vector Search:
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 128,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "studentId"
    }
  ]
}
*/
