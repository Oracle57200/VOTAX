# 🎯 VOTAX v3.0.0 — Complete Feature Library

**VOTAX** is a lightweight, modular JavaScript library for building mini-projects with **50+ features** 
including CRUD, relations, persistence, validation, UI helpers, performance optimization, animations, and real-time 
sync — all in a single ~40KB library.

## 📦 Quick Start

### Installation

**Via CDN (jsDelivr)**
```html
<script src="https://cdn.jsdelivr.net/gh/yourusername/votax@3.0.0/votax.js"></script>
```

**Via npm (coming soon)**
```bash
npm install votax
```

**Local File**
```html
<script src="votax.js"></script>
```

### Hello World

```javascript
// Register a module template
VOTAX.CRUD.registerTemplate('students', { name: '', age: 0, tags: [] });

// Add an item
const student = VOTAX.CRUD.add('students', { name: 'Amy', age: 20 });
console.log(student.id, student.code); // auto-generated id & code

// Read all items
const all = VOTAX.CRUD.getAll('students');

// Update an item
VOTAX.CRUD.update('students', student.id, { age: 21 });

// Delete an item
VOTAX.CRUD.remove('students', student.id);
```

---

## 📚 Core Features

### 1️⃣ CRUD (Create, Read, Update, Delete)

**Basic Operations**
```javascript
// Add
const item = VOTAX.CRUD.add('module', { field: value });

// Read
const item = VOTAX.CRUD.get('module', id);
const all = VOTAX.CRUD.getAll('module');

// Update
VOTAX.CRUD.update('module', id, { field: newValue });

// Remove
VOTAX.CRUD.remove('module', id);

// Clear
VOTAX.CRUD.clear('module'); // clear one module
VOTAX.CRUD.clear(); // clear all
```

**Bulk Operations**
```javascript
// Bulk update (by predicate)
VOTAX.CRUD.bulkUpdate('students', s => s.age > 18, { verified: true });

// Bulk remove
VOTAX.CRUD.bulkRemove('students', s => s.grade === 'F');
```

**Clone Items**
```javascript
// Clone by id
const cloned = VOTAX.CRUD.clone('students', studentId, { name: 'Copy of Amy' });

// Clone by field value
const cloned = VOTAX.CRUD.cloneBy('students', 'name', 'Amy', { name: 'Amy 2' });
```

### 2️⃣ Search & Query

**Simple Search**
```javascript
// Search across fields
const results = VOTAX.CRUD.search('students', 'amy', ['name', 'email']);
```

**Multi-Criteria Query**
```javascript
const results = VOTAX.CRUD.query('students', {
  criteria: [
    { field: 'age', op: 'gte', value: 18 },
    { field: 'grade', op: 'in', value: ['A', 'B'] },
    { field: 'tags', op: 'hasTag', value: 'active' }
  ]
});

// Supported operators:
// eq, neq, lt, lte, gt, gte, in, contains, hasTag, related
```

**Advanced Sort**
```javascript
// Multi-field sort
VOTAX.CRUD.sortAdvanced('students', [
  { field: 'grade', dir: 'asc' },
  { field: 'age', dir: 'desc' }
]);
```

### 3️⃣ Module Relations (Cross-Module Links)

**Define Relations**
```javascript
// Tasks assigned to Students: tasks.assignedTo → students.id
VOTAX.CRUD.addRelation('students', 'tasks', 'id', 'assignedTo');
```

**Fetch Related Items**
```javascript
const studentTasks = VOTAX.CRUD.getRelated('students', studentId, 'tasks');
```

**Query Across Relations**
```javascript
// Find all tasks related to any student with grade 'A'
const results = VOTAX.CRUD.queryRelated('students', 'tasks', { grade: 'A' });
```

### 4️⃣ Tags & Flags

```javascript
// Add tag
VOTAX.CRUD.addTag('students', studentId, 'verified');

// Remove tag
VOTAX.CRUD.removeTag('students', studentId, 'verified');

// Filter by tags
const verified = VOTAX.CRUD.filterByTags('students', ['verified', 'active']);

// Toggle flag
VOTAX.CRUD.toggle('students', studentId, 'favorite');
```

### 5️⃣ Computed Fields

**Register Computed (On-Demand)**
```javascript
VOTAX.CRUD.registerComputed('students', 'fullName', student => {
  return student.firstName + ' ' + student.lastName;
});

// Compute single field
const name = VOTAX.CRUD.compute('students', studentId, 'fullName');

// Compute all fields for an item
const computed = VOTAX.CRUD.computeItem('students', studentId);
```

### 6️⃣ Hooks & Events

**Available Events**
- `before:add`, `after:add`
- `before:update`, `after:update`
- `before:remove`, `after:remove`
- `before:bulkUpdate`, `after:bulkUpdate`
- `before:bulkRemove`, `after:bulkRemove`
- `relation:added`, `relation:removed`

**Setup Hooks**
```javascript
VOTAX.CRUD.on('students', 'before:add', (item) => {
  if (!item.name) return false; // cancel add
  console.log('Adding', item);
});

VOTAX.CRUD.on('students', 'after:add', (item) => {
  console.log('Added', item.id);
});
```

### 7️⃣ History & Undo

```javascript
// Undo last operation
VOTAX.CRUD.undo(); // supports add, update, remove, bulk ops
```

### 8️⃣ Stats & Sampling

```javascript
// Count items
const count = VOTAX.CRUD.stats('students', 'count');

// Sum numeric field
const totalAge = VOTAX.CRUD.stats('students', 'sum', 'age');

// Average
const avgAge = VOTAX.CRUD.stats('students', 'avg', 'age');

// Custom reducer
const result = VOTAX.CRUD.stats('students', (list) => list.length > 5);

// Random sample
const sample = VOTAX.CRUD.sample('students', 3);
```

### 9️⃣ Seed Data

```javascript
// Seed with factory function
VOTAX.CRUD.seed('students', 5, (i) => ({
  name: `Student ${i}`,
  age: 15 + i,
  grade: ['A', 'B', 'C'][i % 3]
}));

// Seed with template
VOTAX.CRUD.seed('students', 3, { grade: 'A', tags: ['honor'] });
```

---

## 🔐 Validation Module

**Register Schema**
```javascript
VOTAX.Validation.registerSchema('students', {
  name: { 
    required: true, 
    minLength: 2, 
    maxLength: 100 
  },
  age: { 
    required: true, 
    type: 'number', 
    min: 5, 
    max: 120 
  },
  email: { 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  grade: { 
    custom: (v) => ['A', 'B', 'C'].includes(v) 
  }
});
```

**Setup Auto-Validation**
```javascript
// Prevent invalid items from being added/updated
VOTAX.Validation.setupHooks('students');
```

**Manual Validation**
```javascript
const { valid, errors } = VOTAX.Validation.validate('students', item);
if (!valid) {
  console.log(errors); // [{ field, message }, ...]
}
```

**View Errors**
```javascript
const errors = VOTAX.Validation.getErrors();
VOTAX.Validation.clearErrors();
```

---

## 💾 Persistence Module

### localStorage

```javascript
// Save one module
VOTAX.Persistence.saveLocal('students');

// Load one module
VOTAX.Persistence.loadLocal('students');

// Save all modules
VOTAX.Persistence.saveAllLocal();

// Load all modules
VOTAX.Persistence.loadAllLocal();
```

### JSON Export/Import

```javascript
// Export all as JSON
const json = VOTAX.Persistence.exportJSON();
console.log(json); // { version, timestamp, modules }

// Import from JSON
VOTAX.Persistence.importJSON(jsonString);
```

### IndexedDB

```javascript
// Initialize
await VOTAX.Persistence.initIndexedDB();

// Save to IndexedDB
await VOTAX.Persistence.saveDB('students');

// Load from IndexedDB
await VOTAX.Persistence.loadDB('students');
```

---

## 🎨 Advanced UI Module

### Auto-Generated Forms

```javascript
const form = VOTAX.UI.formFor('students', (data) => {
  VOTAX.CRUD.add('students', data);
  console.log('Submitted', data);
});

document.body.appendChild(form);
```

### Modal Dialogs

```javascript
VOTAX.UI.modal('Confirm', 'Delete this item?', [
  { label: 'Cancel', onclick: () => console.log('Cancelled') },
  { label: 'Delete', onclick: () => deleteItem() }
]);
```

### Draggable Lists

```javascript
const students = VOTAX.CRUD.getAll('students');

VOTAX.UI.makeDraggable('#my-container', students, (reordered) => {
  console.log('New order:', reordered);
});
```

### Dashboard

```javascript
VOTAX.UI.renderDashboard('#dashboard', 'students');
// Shows: total count, numeric field stats, tag summary
```

---

## ⚡ Performance Module

### Indexing

```javascript
// Build index on a field for fast lookups
VOTAX.Performance.buildIndex('students', 'grade');

// Query using index (very fast for large datasets)
const aStudents = VOTAX.Performance.queryWithIndex('students', 'grade', 'A');
```

### Pagination

```javascript
const page = VOTAX.Performance.paginate('students', 1, 10);
// Returns: { page, pageSize, total, pages, items }
```

### Clear Indexes

```javascript
VOTAX.Performance.clearIndexes('students');
VOTAX.Performance.clearIndexes(); // clear all
```

---

## ✨ Advanced Animations

### Easing Functions

```javascript
// Linear (default)
VOTAX.Animate.to(element, { x: 100 }, 1, { easing: VOTAX.Animate.ease.linear });

// Ease In
VOTAX.Animate.to(element, { x: 100 }, 1, { easing: VOTAX.Animate.ease.easeIn });

// Ease Out
VOTAX.Animate.to(element, { x: 100 }, 1, { easing: VOTAX.Animate.ease.easeOut });

// Ease InOut
VOTAX.Animate.to(element, { x: 100 }, 1, { easing: VOTAX.Animate.ease.easeInOut });

// Cubic Bezier
const bezier = VOTAX.Animate.ease.cubicBezier(0.17, 0.67, 0.83, 0.67);
VOTAX.Animate.to(element, { x: 100 }, 1, { easing: bezier });
```

### Timeline (Sequence)

```javascript
VOTAX.Animate.timeline()
  .add(el, { x: 100 }, 0.5)
  .add(el, { y: 100 }, 0.5)
  .add(el, { x: 0, y: 0 }, 0.5)
  .play();
```

### Spring Physics

```javascript
VOTAX.Animate.spring(element, 
  { x: 0, y: 0 },        // from
  { x: 200, y: 200 },    // to
  0.1,                   // stiffness
  0.7                    // damping
);
```

### Basic Animations

```javascript
// To
VOTAX.Animate.to(element, { x: 100, opacity: 0.5, scale: 1.2 }, 1);

// From
VOTAX.Animate.from(element, { x: -100, opacity: 0 }, 1);

// FromTo
VOTAX.Animate.fromTo(element, { x: 0 }, { x: 100 }, 1);

// Stagger (for multiple elements)
VOTAX.Animate.to('.box', { x: 100 }, 1, { stagger: 0.1 });

// Supported props: x, y, scale, rotate + any CSS property
```

---

## 🌐 Real-Time Module (Cross-Tab Sync)

**Broadcast Messages**
```javascript
// Send from one tab
VOTAX.RealTime.broadcast('my-channel', 'update', { 
  studentId: 123, 
  action: 'deleted' 
});
```

**Subscribe to Channel**
```javascript
// Listen in another tab
VOTAX.RealTime.subscribe('my-channel', (event, data) => {
  console.log('Received:', event, data);
});
```

**Conflict Resolution**
```javascript
// Built-in strategies: 'last-write-wins', 'local-wins', 'merge'
const resolved = VOTAX.RealTime.resolveConflict('merge', 
  { name: 'Local', age: 25 },  // local
  { name: 'Remote', grade: 'A' } // remote
);
// Result: { name: 'Remote', age: 25, grade: 'A' }

// Register custom strategy
VOTAX.RealTime.registerConflictStrategy('custom', (local, remote) => {
  return { ...local, ...remote }; // your logic
});
```

---

## 🖼️ Images Module

**Preview**
```javascript
const file = fileInput.files[0];
VOTAX.Images.preview(file).then(dataUrl => {
  console.log(dataUrl); // base64 data URL
  document.querySelector('img').src = dataUrl;
});
```

**Resize (Client-Side)**
```javascript
VOTAX.Images.resize(file, 800, 800, 0.8).then(resized => {
  // resized is data URL (JPEG, quality 0.8)
  VOTAX.CRUD.add('posts', { image: resized });
});
```

---

## 📊 Complete Example

```javascript
// 1. Setup
VOTAX.CRUD.registerTemplate('students', {
  name: '', age: 0, grade: '', tags: [], image: ''
});

VOTAX.CRUD.registerTemplate('tasks', {
  title: '', assignedTo: '', completed: false
});

// 2. Relations
VOTAX.CRUD.addRelation('students', 'tasks', 'id', 'assignedTo');

// 3. Validation
VOTAX.Validation.registerSchema('students', {
  name: { required: true, minLength: 2 },
  age: { required: true, type: 'number', min: 5, max: 120 }
});
VOTAX.Validation.setupHooks('students');

// 4. Hooks
VOTAX.CRUD.on('students', 'after:add', (item) => {
  console.log('New student:', item.name);
});

// 5. Add data
const student = VOTAX.CRUD.add('students', { 
  name: 'Amy', age: 20, grade: 'A', tags: ['honor'] 
});

// 6. Create task
VOTAX.CRUD.add('tasks', { 
  title: 'Math homework', 
  assignedTo: student.id 
});

// 7. Query
const tasks = VOTAX.CRUD.getRelated('students', student.id, 'tasks');
console.log('Amy\'s tasks:', tasks);

// 8. Persist
VOTAX.Persistence.saveAllLocal();

// 9. Animate
VOTAX.Animate.to('.student-card', { scale: 1.1, rotate: 5 }, 0.5, {
  easing: VOTAX.Animate.ease.easeOut
});

// 10. Stats
console.log('Total students:', VOTAX.CRUD.stats('students', 'count'));
console.log('Avg age:', VOTAX.CRUD.stats('students', 'avg', 'age'));
```

---

## 🚀 API Reference (Quick Lookup)

| Module | Method | Description |
|--------|--------|-------------|
| **CRUD** | `add, get, getAll, update, remove, clear` | Basic CRUD |
| **CRUD** | `bulkUpdate, bulkRemove, clone, cloneBy` | Bulk ops |
| **CRUD** | `search, query, sortAdvanced` | Search & sort |
| **CRUD** | `addRelation, getRelated, queryRelated` | Relations |
| **CRUD** | `registerComputed, compute, computeItem` | Computed fields |
| **CRUD** | `addTag, removeTag, filterByTags` | Tags |
| **CRUD** | `toggle, stats, sample, seed, undo` | Helpers |
| **Validation** | `registerSchema, validate, setupHooks` | Validation |
| **Persistence** | `saveLocal, loadLocal, exportJSON, importJSON` | Persist |
| **Persistence** | `initIndexedDB, saveDB, loadDB` | IndexedDB |
| **UI** | `formFor, modal, makeDraggable, renderDashboard` | UI helpers |
| **Performance** | `buildIndex, paginate, queryWithIndex` | Performance |
| **Animate** | `to, from, fromTo, timeline, spring` | Animations |
| **RealTime** | `broadcast, subscribe, resolveConflict` | Sync |
| **Images** | `preview, resize` | Images |

---

## 📝 License

MIT — Free for personal & commercial use

## 🤝 Contributing

Pull requests & bug reports welcome on GitHub!

## 📞 Support

For issues & questions, open an issue or check examples in `votax.html`

---

**Happy coding with VOTAX! 🎉**
