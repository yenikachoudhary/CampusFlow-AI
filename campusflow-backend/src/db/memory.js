function getPath(doc, key) {
  return key.split(".").reduce((value, part) => (value == null ? value : value[part]), doc);
}

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = getPath(doc, key);
    if (expected && typeof expected === "object" && !Array.isArray(expected) && !(expected instanceof Date)) {
      return false;
    }
    return String(actual) === String(expected);
  });
}

function applyUpdate(doc, update = {}) {
  if (update.$set) Object.assign(doc, update.$set);
  if (update.$setOnInsert) {
    for (const [key, value] of Object.entries(update.$setOnInsert)) {
      if (doc[key] === undefined) doc[key] = value;
    }
  }
  return doc;
}

function project(doc, projection) {
  if (!projection) {
    const clone = { ...doc };
    return clone;
  }
  const out = {};
  const includeId = projection._id !== 0;
  if (includeId && doc._id !== undefined) out._id = doc._id;
  const keys = Object.keys(projection).filter((key) => key !== "_id");
  const inclusive = keys.some((key) => projection[key]);
  if (inclusive) {
    for (const key of keys) {
      if (projection[key]) out[key] = doc[key];
    }
  } else {
    Object.assign(out, doc);
    if (projection._id === 0) delete out._id;
  }
  return out;
}

function compare(a, b, sort) {
  for (const [key, dir] of Object.entries(sort || {})) {
    if (a[key] < b[key]) return dir < 0 ? 1 : -1;
    if (a[key] > b[key]) return dir < 0 ? -1 : 1;
  }
  return 0;
}

class MemoryCursor {
  constructor(docs, projection) {
    this.docs = docs;
    this.projection = projection;
    this._sort = {};
    this._limit = undefined;
  }

  sort(sort) {
    this._sort = sort || {};
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  async toArray() {
    const sorted = [...this.docs].sort((a, b) => compare(a, b, this._sort));
    const sliced = this._limit ? sorted.slice(0, this._limit) : sorted;
    return sliced.map((doc) => project(doc, this.projection));
  }
}

class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.docs = [];
    this._seq = 0;
  }

  async createIndex() {
    return `${this.name}_idx`;
  }

  async insertOne(document) {
    const _id = `${this.name}-${Date.now()}-${++this._seq}`;
    const stored = { ...document, _id };
    this.docs.push(stored);
    return { insertedId: _id };
  }

  async findOne(filter = {}, options = {}) {
    const doc = this.docs.find((item) => matches(item, filter));
    return doc ? project(doc, options.projection) : null;
  }

  find(filter = {}, options = {}) {
    const docs = this.docs.filter((item) => matches(item, filter));
    return new MemoryCursor(docs, options.projection);
  }

  async updateOne(filter, update, options = {}) {
    let doc = this.docs.find((item) => matches(item, filter));
    if (!doc && options.upsert) {
      doc = { ...filter };
      applyUpdate(doc, { $set: update.$set, $setOnInsert: update.$setOnInsert });
      if (!doc._id) doc._id = `${this.name}-${Date.now()}-${++this._seq}`;
      this.docs.push(doc);
      return { matchedCount: 0, modifiedCount: 0, upsertedId: doc._id };
    }
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    applyUpdate(doc, update);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async aggregate(pipeline = []) {
    let docs = [...this.docs];
    for (const stage of pipeline) {
      if (stage.$vectorSearch) {
        const { path, queryVector, limit } = stage.$vectorSearch;
        docs = docs
          .map((doc) => ({ ...doc, score: cosine(doc[path] || [], queryVector) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit || 5);
      }
      if (stage.$project) {
        docs = docs.map((doc) => {
          const out = {};
          for (const [key, spec] of Object.entries(stage.$project)) {
            if (key === "_id" && spec === 0) continue;
            if (spec && spec.$meta === "vectorSearchScore") out[key] = doc.score;
            else if (spec) out[key] = doc[key];
          }
          return out;
        });
      }
    }
    return { toArray: async () => docs };
  }
}

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
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

export function createMemoryDb() {
  const collections = new Map();
  return {
    mode: "memory",
    collection(name) {
      if (!collections.has(name)) collections.set(name, new MemoryCollection(name));
      return collections.get(name);
    }
  };
}
