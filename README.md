# VOTAX v3.0.0

Lightweight CRUD + GSAP-style Animation Helpers for mini-projects.

## Installation

### Via CDN

```html
<!-- jsDelivr (Recommended) -->
<script src="https://cdn.jsdelivr.net/npm/votax@3.0.0/votax.min.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/votax@3.0.0/votax.min.js"></script>

<!-- GitHub Raw -->
<script src="https://raw.githubusercontent.com/yourusername/votax/main/votax.js"></script>
```

### Via npm

```bash
npm install votax
```

```javascript
import VOTAX from 'votax';
```

## Quick Start

### CRUD Operations

```javascript
// Register template
VOTAX.CRUD.registerTemplate('students', { name: '', age: 0, tags: [] });

// Add item
const student = VOTAX.CRUD.add('students', { name: 'Amy', age: 20 });

// Get all
const all = VOTAX.CRUD.getAll('students');

// Update
VOTAX.CRUD.update('students', student.id, { age: 21 });

// Delete
VOTAX.CRUD.remove('students', student.id);
```

### Animations

```javascript
// Animate to
VOTAX.Animate.to(el, { x: 100, opacity: 0.5 }, 1, {
  easing: VOTAX.Animate.ease.easeOut
});

// Timeline
VOTAX.Animate.timeline()
  .add(el, { x: 100 }, 0.5)
  .add(el, { y: 100 }, 0.5)
  .play();

// Spring physics
VOTAX.Animate.spring(el, { x: 0 }, { x: 100 }, 0.1, 0.5);
```

### Validation

```javascript
VOTAX.Validation.registerSchema('students', {
  name: { required: true, minLength: 2 },
  age: { type: 'number', min: 5, max: 120 }
});

VOTAX.Validation.setupHooks('students');
```

### Persistence

```javascript
// Save to localStorage
VOTAX.Persistence.saveLocal('students');

// Load from localStorage
VOTAX.Persistence.loadLocal('students');

// Export as JSON
const json = VOTAX.Persistence.exportJSON();

// Import from JSON
VOTAX.Persistence.importJSON(json);
```

### UI Components

```javascript
// Form generation
const form = VOTAX.UI.formFor('students', (data) => {
  VOTAX.CRUD.add('students', data);
});

// Modal dialog
VOTAX.UI.modal('Confirm', 'Are you sure?', [
  { label: 'Yes', onclick: () => console.log('Yes') },
  { label: 'No', onclick: () => console.log('No') }
]);

// Draggable list
VOTAX.UI.makeDraggable('#list', items, (reordered) => {
  console.log('Items reordered:', reordered);
});
```

## Modules

- **CRUD** - Add, read, update, delete, relations, computed fields
- **Images** - Image preview and client-side resize
- **Persistence** - localStorage, IndexedDB, JSON import/export
- **Validation** - Schema-based validation with hooks
- **UI** - Form generation, modals, draggable lists, dashboards
- **Performance** - Indexing, pagination, fast queries
- **Animate** - GSAP-style animations, easing, timelines, spring physics
- **RealTime** - Cross-tab synchronization, conflict resolution

## TypeScript Support

Full TypeScript definitions included:

```typescript
import VOTAX from 'votax';

interface Student extends VOTAX.VOTAXItem {
  name: string;
  age: number;
}

const student = VOTAX.CRUD.add<Student>('students', { name: 'Amy', age: 20 });
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT - See LICENSE file for details
