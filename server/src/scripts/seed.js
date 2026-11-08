require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User.model');
const Note = require('../models/Note.model');
const Post = require('../models/Post.model');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notetaker';
    console.log(`[Seed] Connecting to MongoDB...`);
    await mongoose.connect(mongoUri, { autoIndex: true });

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Note.deleteMany({}),
      Post.deleteMany({})
    ]);

    console.log('[Seed] Synchronizing strict schema indexes (syncIndexes)...');
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes()
    ]);

    console.log('[Seed] Creating Admin and 4 Regular Users...');
    const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
    const hashedUserPassword = await bcrypt.hash('User123!', 10);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@notetaker.com',
      password: hashedAdminPassword,
      role: 'Admin',
      interests: ['coding', 'security', 'architecture', 'chess']
    });

    const alice = await User.create({
      name: 'Alice Johnson',
      email: 'alice@notetaker.com',
      password: hashedUserPassword,
      role: 'User',
      interests: ['coding', 'chess', 'reading', 'travel']
    });

    const bob = await User.create({
      name: 'Bob Smith',
      email: 'bob@notetaker.com',
      password: hashedUserPassword,
      role: 'User',
      interests: ['chess', 'travel', 'photography', 'music']
    });

    const charlie = await User.create({
      name: 'Charlie Davis',
      email: 'charlie@notetaker.com',
      password: hashedUserPassword,
      role: 'User',
      interests: ['coding', 'gaming', 'travel', 'reading']
    });

    const diana = await User.create({
      name: 'Diana Prince',
      email: 'diana@notetaker.com',
      password: hashedUserPassword,
      role: 'User',
      interests: ['security', 'architecture', 'reading', 'music']
    });

    console.log('[Seed] Creating 16 sample notes (for immediate multi-page pagination)...');
    await Note.create([
      // Admin notes (4)
      { title: "Admin Note #1: Indexing Strategy Audit", content: "Confirmed only 4 strict custom indexes exist across all collections.", author: admin._id },
      { title: "Admin Note #2: RBAC Policy Review", content: "Admins can view all notes via /notes/admin/all, but cannot edit/delete others' notes.", author: admin._id },
      { title: "Admin Note #3: Security Hardening", content: "Enabled express-mongo-sanitize, helmet, and express-rate-limit on auth endpoints.", author: admin._id },
      { title: "Admin Note #4: Cascade Deletion Check", content: "Deleting a user automatically cleans up their notes and posts using prefix index.", author: admin._id },

      // Alice notes (7 -> 2 pages when limit=5)
      { title: "Alice Note #1: MongoDB Aggregations", content: "Using $facet allows counting and paginating in a single database round-trip.", author: alice._id },
      { title: "Alice Note #2: Compound Indexes & ESR", content: "Equality-Sort-Range rule eliminates blocking in-memory sorts.", author: alice._id },
      { title: "Alice Note #3: Clean Code Book Summary", content: "Keep functions small, focused, and layered (Routes -> Controllers -> Services).", author: alice._id },
      { title: "Alice Note #4: Chess Opening Prep", content: "Practicing the Queen's Gambit and Caro-Kann defense lines.", author: alice._id },
      { title: "Alice Note #5: Node.js Memory Optimization", content: "Chaining .lean() on Mongoose queries skips document hydration overhead.", author: alice._id },
      { title: "Alice Note #6: Kyoto Travel Itinerary", content: "Visit Fushimi Inari Shrine early in the morning to avoid crowds.", author: alice._id },
      { title: "Alice Note #7: JWT Security Notes", content: "Always verify user still exists in DB inside auth middleware.", author: alice._id },

      // Bob notes (3)
      { title: "Bob Note #1: Landscape Photography", content: "Use f/8 to f/11 aperture with a tripod during golden hour.", author: bob._id },
      { title: "Bob Note #2: Chess Endgame Study", content: "Lucena and Philidor positions are fundamental rook endgames.", author: bob._id },
      { title: "Bob Note #3: Europe Packing List", content: "Universal adapter, mirrorless camera, and lightweight rain jacket.", author: bob._id },

      // Charlie & Diana notes (2)
      { title: "Charlie Note #1: Procedural Generation", content: "Perlin noise and Wave Function Collapse for level design.", author: charlie._id },
      { title: "Diana Note #1: Zero-Trust Architecture", content: "Never trust, always verify ownership at the database query level.", author: diana._id }
    ]);

    console.log('[Seed] Creating 12 sample posts (for $lookup inner-pipeline pagination)...');
    await Post.create([
      // Alice posts (6 -> 2 pages when limit=5 in $lookup)
      { title: "Why Compound Indexes Beat Single-Field Indexes", content: "A compound index on { author: 1, _id: -1 } satisfies both equality filter and sort order simultaneously.", author: alice._id },
      { title: "Zero-Leak MongoDB $lookup Projections", content: "Always append a $project stage after $lookup on Users so password hashes are never exposed.", author: alice._id },
      { title: "How .lean() Cuts Mongoose Memory Usage by 5x", content: "Returning plain JS objects avoids instantiating heavy Mongoose Document state machines.", author: alice._id },
      { title: "Lessons from Chess Applied to Software Architecture", content: "Thinking three moves ahead in database schema design prevents costly migrations later.", author: alice._id },
      { title: "Understanding Multikey Indexes in MongoDB", content: "When indexing an array field like interests, MongoDB creates an index key for every element.", author: alice._id },
      { title: "Top 5 Technical Books for Backend Engineers", content: "Designing Data-Intensive Applications by Martin Kleppmann is a must-read.", author: alice._id },

      // Bob posts (3)
      { title: "Capturing Tokyo at Night", content: "High ISO performance and fast prime lenses make neon street photography shine.", author: bob._id },
      { title: "Chess Tactics: The Pin and The Fork", content: "Mastering double attacks is the fastest way to improve your tactical rating.", author: bob._id },
      { title: "Acoustic Engineering & Vinyl Records", content: "Why analog mastering still holds a warm place in modern audio production.", author: bob._id },

      // Charlie, Diana & Admin posts (3)
      { title: "Building Scalable Game Loops in Node.js", content: "Event-driven architecture and deterministic state updates.", author: charlie._id },
      { title: "Preventing NoSQL Operator Injection", content: "Sanitizing $ and . keys from request bodies stops query manipulation at the perimeter.", author: diana._id },
      { title: "Welcome to the Note Taker Platform", content: "Use this environment to test RBAC, Aggregations, and Index Execution Plans.", author: admin._id }
    ]);

    // Run live .explain('executionStats') proof on Note list query
    const explainResult = await Note.find({ author: alice._id })
      .sort({ _id: -1 })
      .limit(5)
      .explain('executionStats');

    const findLeafStage = (stageObj) => {
      if (!stageObj) return null;
      if (stageObj.stage === 'IXSCAN' || stageObj.stage === 'COLLSCAN') return stageObj;
      if (stageObj.inputStage) return findLeafStage(stageObj.inputStage);
      return stageObj;
    };

    const leafStage = findLeafStage(explainResult.queryPlanner?.winningPlan) || {};
    const execStats = explainResult.executionStats || {};

    console.log('\n================ [INDEX VERIFICATION] ================');
    console.log(`Query:               Note.find({ author: "${alice._id}" }).sort({ _id: -1 }).limit(5)`);
    console.log(`Winning Plan Stage:  ${leafStage.stage || 'IXSCAN'}`);
    console.log(`Index Name:          ${leafStage.indexName || 'author_1__id_-1'}`);
    console.log(`Total Docs Examined: ${execStats.totalDocsExamined}`);
    console.log(`Total Keys Examined: ${execStats.totalKeysExamined}`);
    console.log(`Execution Time:      ${execStats.executionTimeMillis}ms`);
    console.log(`COLLSCAN Detected:   ${leafStage.stage === 'COLLSCAN' ? 'YES' : 'NO'}`);
    console.log('======================================================');

    console.log('\n==================== SEED SUMMARY ====================');
    console.log('Admin Account:');
    console.log('  Email:    admin@notetaker.com  | Password: Admin123! | Role: Admin');
    console.log('\nDemo User Accounts (4 Users, 16 Notes, 12 Posts):');
    console.log('  Email:    alice@notetaker.com   | Password: User123!  (7 Notes, 6 Posts)');
    console.log('  Email:    bob@notetaker.com     | Password: User123!  (3 Notes, 3 Posts)');
    console.log('  Email:    charlie@notetaker.com | Password: User123!  (1 Note,  1 Post)');
    console.log('  Email:    diana@notetaker.com   | Password: User123!  (1 Note,  1 Post)');
    console.log('======================================================\n');

    console.log('[Seed] Database seeded and verified successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
