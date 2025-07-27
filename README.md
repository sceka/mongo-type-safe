# mongo-type-safe

A type-safe MongoDB wrapper for Node.js using Zod schemas and TypeScript. Get compile-time safety for all your MongoDB CRUD operations, with a familiar API and zero runtime overhead.

---

## Features

-   **Type-safe CRUD**: Compile-time type checking for all MongoDB operations
-   **Zod integration**: Use your Zod schemas as the single source of truth
-   **With runtime validation**: Enforces schema correctness at both compile-time and runtime using Zod.
-   **Familiar API**: Mirrors the official MongoDB Node.js driver

---

## Installation

```bash
npm install mongo-type-safe zod mongodb
```

---

## Quick Start

### 1. Recommended: Initialize db before importing models (Mongoose-like pattern)

**db.ts**

```typescript
import { MongoClient } from "mongodb";
export const client = new MongoClient("mongodb://localhost:27017");
```

**index.ts (entrypoint of your app)**

```typescript
import { client } from "./db";
await client.connect(); // Ensure connection before importing models
export const db = client.db("test-db");

// ...rest of your app
```

**userModel.ts**

```typescript
import { z } from "zod";
import { createSafeCollection } from "mongo-type-safe";
import { db } from "./index"; // or "./db" if you export db there

export const userSchema = z.object({
	name: z.string(),
	age: z.number().optional(),
	email: z.string().email()
});

export const safeUsers = createSafeCollection(db.collection("users"), userSchema);
```

**Anywhere in your app:**

```typescript
import { safeUsers } from "./userModel";

await safeUsers.insertOne({ name: "Marko", email: "marko@example.com" });
const user = await safeUsers.findOne({ name: "Marko" });
```

> **Note:** This pattern ensures that your models always have a ready-to-use, type-safe collection. Just make sure the db connection is established before any model is imported.

---

### 2. Model-only approach (if you want to create the collection on demand)

**userModel.ts**

```typescript
import { z } from "zod";

export const userSchema = z.object({
	name: z.string(),
	age: z.number().optional(),
	email: z.string().email()
});
```

**In your route/service/handler:**

```typescript
import { MongoClient } from "mongodb";
import { createSafeCollection } from "mongo-type-safe";
import { userSchema } from "./userModel";

async function main() {
	const client = new MongoClient("mongodb://localhost:27017");
	await client.connect();
	const db = client.db("test-db");

	// Create the type-safe collection on demand
	const safeUsers = createSafeCollection(db.collection("users"), userSchema);

	await safeUsers.insertOne({ name: "Marko", email: "marko@example.com" });
	const user = await safeUsers.findOne({ name: "Marko" });
	await safeUsers.updateOne({ name: "Marko" }, { $set: { age: 30 } });
	await safeUsers.deleteOne({ name: "Marko" });

	client.close();
}

main();
```

---

### 3. Model exports ready-to-use collection (if you have a global db instance)

**userModel.ts**

```typescript
import { z } from "zod";
import { createSafeCollection } from "mongo-type-safe";
import { db } from "./db"; // your global db instance

export const userSchema = z.object({
	name: z.string(),
	age: z.number().optional(),
	email: z.string().email()
});

export const safeUsers = createSafeCollection(db.collection("users"), userSchema);
```

**Anywhere in your app:**

```typescript
import { safeUsers } from "./userModel";

await safeUsers.insertOne({ name: "Marko", email: "marko@example.com" });
const user = await safeUsers.findOne({ name: "Marko" });
```

---

## API Overview

All methods are type-safe and mirror the MongoDB driver:

-   `insertOne(doc, options?)`
-   `insertMany(docs, options?)`
-   `findOne(filter, options?)`
-   `find(filter, options?)`
-   `updateOne(filter, update, options?)`
-   `updateMany(filter, update, options?)`
-   `deleteOne(filter, options?)`
-   `deleteMany(filter, options?)`
-   `replaceOne(filter, newDocument, options?)`
-   `findOneAndUpdate(filter, update, options?)`
-   `findOneAndReplace(filter, newDocument, options?)`
-   `findOneAndDelete(filter, options?)`
-   `countDocuments(filter?, options?)`
-   `estimatedDocumentCount(options?)`
-   `distinct(key, filter?)`
-   `aggregate(pipeline, options?)`

See the source for full method signatures and JSDoc documentation.

---

## Type Safety

-   All filters, updates, and documents are checked at compile time against your Zod schema.
-   Invalid field names or types will cause TypeScript errors before you run your code.

---

## Zod Integration

-   Use your Zod schemas to define the shape of your documents.
-   The wrapper automatically infers TypeScript types from your Zod schema.

---

## License

MIT
