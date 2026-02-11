// VOTAX Library v3.0.0 — Lightweight CRUD + GSAP-style Animation Helpers
/**
 * @typedef {Object} VOTAXItem
 * @property {string} id - Unique identifier
 * @property {string} code - Auto-generated code (e.g., STU-0001)
 * @property {string[]} tags - Array of tags
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {Array<{field: string, message: string}>} errors - Validation errors
 */

/**
 * @typedef {Object} PaginationResult
 * @property {number} page - Current page
 * @property {number} pageSize - Items per page
 * @property {number} total - Total items
 * @property {number} pages - Total pages
 * @property {Array<VOTAXItem>} items - Items on current page
 */

(function(global){
    'use strict';

    const VOTAX = {
        version: '3.0.0',
        
        // ===== Internal State =====
        /** @type {Record<string, Array>} */
        _store: {},
        /** @type {Record<string, object>} */
        _templates: {},
        /** @type {Record<string, Record<string, Function[]>>} */
        _hooks: {},
        /** @type {Record<string, Record<string, Array>>} */
        _relations: {},
        /** @type {Record<string, Record<string, Function>>} */
        _computed: {},
        /** @type {Array} */
        _history: [],
        /** @type {number} */
        _uidCounter: 0,
        /** @type {Record<string, number>} */
        _meta: {},
        /** @type {string} */
        _dbName: 'votax-db',
        
        // =========================
        // Utility
        // =========================
        
        /**
         * Generate unique ID
         * @returns {string} Unique identifier
         */
        _genId() {
            return Date.now().toString(36) + '-' + (this._uidCounter++).toString(36);
        },

        /**
         * Deep clone object (JSON safe)
         * @param {*} obj - Object to clone
         * @returns {*} Cloned object
         */
        _cloneDeep(obj){ return JSON.parse(JSON.stringify(obj)); },

        /**
         * Generate auto-incrementing module code
         * @param {string} module - Module name
         * @returns {string} Generated code (e.g., STU-0001)
         */
        _genCode(module){
            // simple incrementing module code: MOD-0001
            this._meta = this._meta || {};
            this._meta[module] = (this._meta[module] || 0) + 1;
            return `${module.toUpperCase().slice(0,3)}-${String(this._meta[module]).padStart(4,'0')}`;
        },

        // =========================
        // CRUD Module
        // =========================
        CRUD: {
            /**
             * Register template/defaults for a module
             * @param {string} module - Module name
             * @param {Object} template - Default template object
             * @example
             * VOTAX.CRUD.registerTemplate('students', { name: '', age: 0, tags: [] });
             */
            registerTemplate(module, template = {}) {
                this._templates[module] = VOTAX._cloneDeep(template);
            },

            /**
             * Register lifecycle hook
             * @param {string} module - Module name
             * @param {string} event - Event name (before:add, after:add, before:update, etc.)
             * @param {Function} fn - Callback function
             * @returns {void}
             * @example
             * VOTAX.CRUD.on('students', 'before:add', (item) => {
             *   if (!item.name) return false; // cancel add
             * });
             */
            on(module, event, fn){
                this._hooks[module] = this._hooks[module] || {};
                this._hooks[module][event] = this._hooks[module][event] || [];
                this._hooks[module][event].push(fn);
            },

            /**
             * Add item to module
             * @param {string} module - Module name
             * @param {Object} item - Item data
             * @returns {VOTAXItem|null} Added item or null if cancelled
             * @example
             * const student = VOTAX.CRUD.add('students', { name: 'Amy', age: 20 });
             */
            add(module, item = {}, opts = {}) {
                if(!module) throw new Error('module name required');
                this._store[module] = this._store[module] || [];
                const tpl = this._templates[module] || {};
                const obj = Object.assign({}, VOTAX._cloneDeep(tpl), VOTAX._cloneDeep(item));
                if(obj.id === undefined || obj.id === null) obj.id = VOTAX._genId();
                if(!obj.code) obj.code = VOTAX._genCode(module);
                if(!Array.isArray(obj.tags)) obj.tags = obj.tags ? [obj.tags] : [];

                // before:add
                if(!this._emitCancelable(module, 'before:add', obj)) return null;

                this._store[module].push(obj);
                this._history.push({ type:'add', module, id: obj.id });

                this._emit(module,'after:add', obj);
                return VOTAX._cloneDeep(obj);
            },

            /**
             * Get single item by ID or code
             * @param {string} module - Module name
             * @param {string} id - Item ID or code
             * @returns {VOTAXItem|null} Item or null if not found
             * @example
             * const student = VOTAX.CRUD.get('students', 'stu-12345');
             */
            get(module, id) {
                const list = this._store[module] || [];
                for(const it of list){
                    if(it.id === id || it.code === id) return VOTAX._cloneDeep(it);
                }
                return null;
            },

            /**
             * Get all items in module
             * @param {string} module - Module name
             * @param {Object} opts - Options (sortBy, dir)
             * @returns {VOTAXItem[]} All items
             * @example
             * const all = VOTAX.CRUD.getAll('students');
             */
            getAll(module, opts = {}) {
                const list = this._store[module] || [];
                if(opts.sortBy) {
                    list.sort((a,b) => {
                        const valA = a[opts.sortBy];
                        const valB = b[opts.sortBy];
                        if(valA === valB) return 0;
                        return valA < valB ? -1 : 1;
                    });
                }
                return list;
            },

            /**
             * Update item by ID or code
             * @param {string} module - Module name
             * @param {string} id - Item ID or code
             * @param {Object} patch - Fields to update
             * @returns {VOTAXItem|null} Updated item or null if not found
             * @example
             * VOTAX.CRUD.update('students', studentId, { age: 21 });
             */
            update(module, id, patch = {}) {
                const list = this._store[module] || [];
                const it = list.find(i => i.id === id || i.code === id);
                if(!it) return null;
                const before = VOTAX._cloneDeep(it);
                const proposed = Object.assign({}, VOTAX._cloneDeep(it), VOTAX._cloneDeep(patch));
                if(!this._emitCancelable(module, 'before:update', { before:VOTAX._cloneDeep(before), after:VOTAX._cloneDeep(proposed) })) return null;

                Object.assign(it, VOTAX._cloneDeep(patch));
                this._history.push({ type:'update', module, id: it.id, before, after: VOTAX._cloneDeep(it) });
                this._emit(module,'after:update', VOTAX._cloneDeep(it));
                return VOTAX._cloneDeep(it);
            },

            /**
             * Remove item by ID or code
             * @param {string} module - Module name
             * @param {string} id - Item ID or code
             * @returns {boolean} True if deleted
             * @example
             * VOTAX.CRUD.remove('students', studentId);
             */
            remove(module, id) {
                if(!this._store[module]) return false;
                const idx = this._store[module].findIndex(i => i.id === id || i.code === id);
                if(idx === -1) return false;
                const removed = this._store[module][idx];
                if(!this._emitCancelable(module,'before:remove', VOTAX._cloneDeep(removed))) return false;

                const sp = this._store[module].splice(idx,1)[0];
                this._history.push({ type:'remove', module, removed: VOTAX._cloneDeep(sp) });
                this._emit(module,'after:remove', VOTAX._cloneDeep(sp));
                return true;
            },

            /**
             * Bulk update items matching predicate
             * @param {string} module - Module name
             * @param {Function|string} predicate - Filter function or ID
             * @param {Object} patch - Fields to update
             * @returns {number} Count of updated items
             * @example
             * VOTAX.CRUD.bulkUpdate('students', s => s.age > 18, { verified: true });
             */
            bulkUpdate(module, predicate, patch = {}) {
                const list = this._store[module] || [];
                const changed = [];
                list.forEach(it => {
                    if(typeof predicate === 'function' ? predicate(it) : predicate === it.id || predicate === it.code) {
                        const before = VOTAX._cloneDeep(it);
                        const proposed = Object.assign({}, VOTAX._cloneDeep(it), VOTAX._cloneDeep(patch));
                        if(!this._emitCancelable(module,'before:update', { before, after:proposed })) return;
                        Object.assign(it, VOTAX._cloneDeep(patch));
                        changed.push({ before, after: VOTAX._cloneDeep(it) });
                        this._emit(module,'after:update', VOTAX._cloneDeep(it));
                    }
                });
                if(changed.length) this._history.push({ type:'bulkUpdate', module, changes: changed });
                return changed.length;
            },

            /**
             * Bulk remove items matching predicate
             * @param {string} module - Module name
             * @param {Function|string} predicate - Filter function or ID
             * @returns {number} Count of removed items
             * @example
             * VOTAX.CRUD.bulkRemove('students', s => s.grade === 'F');
             */
            bulkRemove(module, predicate) {
                if(!this._store[module]) return 0;
                const before = this._store[module].slice();
                const toRemove = before.filter(it => !(typeof predicate === 'function' ? predicate(it) : predicate === it.id || predicate === it.code));
                // emit before:bulkRemove                
                if(!this._emitCancelable(module,'before:bulkRemove', { before })) return 0;
                this._store[module] = before.filter(it => !(typeof predicate === 'function' ? predicate(it) : predicate === it.id || predicate === it.code));
                const removed = before.length - this._store[module].length;
                if(removed) {
                    this._history.push({ type:'bulkRemove', module, before });
                    this._emit(module,'after:bulkRemove', { removedCount: removed });
                }
                return removed;
            },

            /**
             * Search across fields
             * @param {string} module - Module name
             * @param {string} q - Search query
             * @param {string[]} fields - Fields to search (default: all)
             * @returns {VOTAXItem[]} Matching items
             * @example
             * const results = VOTAX.CRUD.search('students', 'amy', ['name', 'email']);
             */
            search(module, q, fields = []) {
                const list = this._store[module] || [];
                const out = [];
                fields.forEach(field => {
                    list.forEach(it => {
                        const matchValue = it[field];
                        if(matchValue === undefined) return;
                        if(String(matchValue).toLowerCase().indexOf(String(q).toLowerCase()) !== -1) out.push(it);
                    });
                });
                return out;
            },

            /**
             * Multi-criteria query
             * @param {string} module - Module name
             * @param {Object|Array} filters - Filter criteria {field,op,value}
             * @returns {VOTAXItem[]} Matching items
             * @example
             * VOTAX.CRUD.query('students', [
             *   { field: 'age', op: 'gte', value: 18 },
             *   { field: 'grade', op: 'in', value: ['A', 'B'] }
             * ]);
             */
            query(module, filters){
                const list = (this._store[module] || []).slice();
                const matchItem = (item, f) => {
                    if(Array.isArray(f)){
                        return f.every(cl => matchItem(item, cl));
                    }
                    if(typeof f === 'object' && !('op' in f)){
                        return Object.keys(f).every(k => {
                            const v = f[k];
                            if(Array.isArray(v)) return v.indexOf(item[k]) !== -1;
                            return item[k] === v;
                        });
                    }
                    // single criterion {field, op, value}
                    const field = f.field;
                    const op = f.op || 'eq';
                    const val = f.value;
                    const iv = item[field];
                    if(op === 'eq') return iv === val;
                    if(op === 'neq') return iv !== val;
                    if(op === 'lt') return Number(iv) < Number(val);
                    if(op === 'lte') return Number(iv) <= Number(val);
                    if(op === 'gt') return Number(iv) > Number(val);
                    if(op === 'gte') return Number(iv) >= Number(val);
                    if(op === 'in') return Array.isArray(val) && val.indexOf(iv) !== -1;
                    if(op === 'contains') return iv && String(iv).toLowerCase().indexOf(String(val).toLowerCase()) !== -1;
                    if(op === 'hasTag') return (item.tags||[]).indexOf(val) !== -1;
                    if(op === 'related') {
                        // value: {relationName, module, filter} -> returns true if any related match filter
                        const relName = val.relationName;
                        const related = this.getRelated(module, item.id, relName);
                        if(!val.filter) return related.length > 0;
                        return related.some(r => {
                            return Object.keys(val.filter).every(k => r[k] === val.filter[k]);
                        });
                    }
                    return false;
                };

                return list.filter(item => matchItem(item, filters)).map(i => VOTAX._cloneDeep(i));
            },

            /**
             * Add relation between modules
             * @param {string} moduleFrom - Source module
             * @param {string} moduleTo - Target module
             * @param {string} keyFrom - Source field
             * @param {string} keyTo - Target field
             * @returns {Object} Relation config
             * @example
             * VOTAX.CRUD.addRelation('students', 'tasks', 'id', 'assignedTo');
             */
            addRelation(moduleFrom, moduleTo, keyFrom, keyTo, opts = {}) {
                if(!moduleFrom || !moduleTo) throw new Error('both modules required');
                this._relations[moduleFrom] = this._relations[moduleFrom] || {};
                this._relations[moduleFrom][moduleTo] = this._relations[moduleFrom][moduleTo] || [];
                const rel = { keyFrom, keyTo, ...opts };
                this._relations[moduleFrom][moduleTo].push(rel);
                this._emit(moduleFrom, 'relation:added', { from: moduleFrom, to: moduleTo, rel });
                return rel;
            },

            /**
             * Get related items
             * @param {string} fromModule - Source module
             * @param {string} itemId - Item ID
             * @param {string} toModule - Target module
             * @param {Object} opts - Options (filter, limit)
             * @returns {VOTAXItem[]} Related items
             * @example
             * const tasks = VOTAX.CRUD.getRelated('students', studentId, 'tasks');
             */
            getRelated(fromModule, itemId, toModule, opts = {}) {
                const item = this.get(fromModule, itemId);
                if(!item) return [];
                const rels = (this._relations[fromModule] && this._relations[fromModule][toModule]) || [];
                if(!rels.length) return [];

                const out = [];
                rels.forEach(rel => {
                    const matchValue = item[rel.keyFrom];
                    if(matchValue === undefined) return;
                    const toList = this._store[toModule] || [];
                    const matches = toList.filter(t => t[rel.keyTo] === matchValue);
                    out.push(...matches);
                });

                // apply optional filter and limit
                let result = Array.from(new Set(out.map(i => VOTAX._cloneDeep(i))));
                if(opts.filter && typeof opts.filter === 'function') result = result.filter(opts.filter);
                if(opts.limit && opts.limit > 0) result = result.slice(0, opts.limit);
                return result;
            },

            /**
             * Register computed field
             * @param {string} module - Module name
             * @param {string} name - Field name
             * @param {Function} fn - Computation function
             * @example
             * VOTAX.CRUD.registerComputed('students', 'fullName', 
             *   s => s.firstName + ' ' + s.lastName
             * );
             */
            registerComputed(module, name, fn){
                this._computed[module] = this._computed[module] || {};
                this._computed[module][name] = fn;
            },

            /**
             * Compute field value
             * @param {string} module - Module name
             * @param {string} id - Item ID
             * @param {string} name - Field name
             * @returns {*} Computed value
             * @example
             * const name = VOTAX.CRUD.compute('students', studentId, 'fullName');
             */
            compute(module, id, name){
                const it = this.get(module,id);
                if(!it) return null;
                const fn = (this._computed[module] || {})[name];
                if(!fn) return null;
                return fn(VOTAX._cloneDeep(it));
            },

            /**
             * Add tag to item
             * @param {string} module - Module name
             * @param {string} id - Item ID
             * @param {string} tag - Tag to add
             * @returns {VOTAXItem|null} Updated item
             */
            addTag(module, id, tag) {
                const it = this.get(module, id);
                if(!it) return null;
                const updated = this.update(module, id, { tags: Array.from(new Set([...(it.tags||[]), tag])) });
                return updated;
            },

            /**
             * Remove tag from item
             * @param {string} module - Module name
             * @param {string} id - Item ID
             * @param {string} tag - Tag to remove
             * @returns {VOTAXItem|null} Updated item
             */
            removeTag(module, id, tag) {
                const it = this.get(module, id);
                if(!it) return null;
                const updated = this.update(module, id, { tags: (it.tags||[]).filter(t=>t!==tag) });
                return updated;
            },

            /**
             * Calculate statistics
             * @param {string} module - Module name
             * @param {string|Function} op - Operation (count, sum, avg) or custom reducer
             * @param {string} field - Field name (for sum/avg)
             * @returns {number|*} Statistic result
             * @example
             * VOTAX.CRUD.stats('students', 'count');
             * VOTAX.CRUD.stats('students', 'avg', 'age');
             */
            stats(module, op = 'count', field) {
                const list = this._store[module] || [];
                if(op === 'count') return list.length;
                if(op === 'sum') return list.reduce((s,i)=> s + (Number(i[field]) || 0), 0);
                if(op === 'avg') return list.length ? (list.reduce((s,i)=> s + (Number(i[field]) || 0),0) / list.length) : 0;
                if(typeof op === 'function') return op(list);
                return null;
            },

            /**
             * Get random sample of items
             * @param {string} module - Module name
             * @param {number} n - Sample size
             * @returns {VOTAXItem[]} Random items
             */
            sample(module, n = 1) {
                const list = this._store[module] || [];
                if(!list.length) return [];
                const out = [];
                const used = new Set();
                while(out.length < n && out.length < list.length) {
                    const idx = Math.floor(Math.random() * list.length);
                    if(used.has(idx)) continue;
                    used.add(idx);
                    out.push(VOTAX._cloneDeep(list[idx]));
                }
                return out;
            },

            /**
             * Seed module with test data
             * @param {string} module - Module name
             * @param {number} n - Count
             * @param {Object|Function} factory - Template or factory function
             * @returns {VOTAXItem[]} Created items
             * @example
             * VOTAX.CRUD.seed('students', 3, i => ({ name: `S${i}`, age: 20 }));
             */
            seed(module, n = 1, factory = {}) {
                const out = [];
                for (let i = 0; i < n; i++) {
                    const item = (typeof factory === 'function') ? factory(i) : Object.assign({}, factory);
                    const added = this.add(module, item);
                    if (added) out.push(added);
                }
                return out;
            },

            /**
             * Undo last operation
             * @returns {boolean} True if successful
             */
            undo() {
                const h = this._history.pop();
                if(!h) return false;
                if(h.type === 'add') {
                    this.remove(h.module, h.id);
                    return true;
                }
                if(h.type === 'remove') {
                    this._store[h.module] = this._store[h.module] || [];
                    this._store[h.module].push(h.removed);
                    return true;
                }
                if(h.type === 'update') {
                    const it = this._store[h.module].find(i => i.id === h.id);
                    if(it) Object.assign(it, VOTAX._cloneDeep(h.before));
                    return true;
                }
                if(h.type === 'bulkUpdate') {
                    h.changes.forEach(c => {
                        const it = this._store[h.module].find(i => i.id === c.before.id);
                        if(it) Object.assign(it, VOTAX._cloneDeep(c.before));
                    });
                    return true;
                }
                if(h.type === 'bulkRemove') {
                    this._store[h.module] = h.before;
                    return true;
                }
                return false;
            },

            /**
             * Clear module data
             * @param {string} module - Module name (omit to clear all)
             */
            clear(module) {
                if(module) this._store[module] = [];
                else this._store = {};
                this._history = [];
            }
        },

        /**
         * Image utilities
         */
        Images: {
            /**
             * Preview image file as data URL
             * @param {File} file - Image file
             * @returns {Promise<string>} Data URL
             * @example
             * VOTAX.Images.preview(fileInput.files[0])
             *   .then(dataUrl => { img.src = dataUrl; });
             */
            preview(file){
                return new Promise((resolve, reject) => {
                    if(!file) return reject(new Error('file required'));
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            },

            /**
             * Resize image client-side
             * @param {File|string} fileOrDataUrl - File or data URL
             * @param {number} maxW - Max width
             * @param {number} maxH - Max height
             * @param {number} quality - JPEG quality (0-1)
             * @returns {Promise<string>} Resized data URL
             * @example
             * VOTAX.Images.resize(file, 800, 800, 0.8)
             *   .then(resized => { VOTAX.CRUD.add('posts', { image: resized }); });
             */
            resize(fileOrDataUrl, maxW = 800, maxH = 800, quality = 0.8){
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onerror = reject;
                    img.onload = () => {
                        let { width: w, height: h } = img;
                        const ratio = Math.min(1, Math.min(maxW / w, maxH / h));
                        const nw = Math.round(w * ratio), nh = Math.round(h * ratio);
                        const canvas = document.createElement('canvas');
                        canvas.width = nw; canvas.height = nh;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img,0,0,nw,nh);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    };
                    if(typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) img.src = fileOrDataUrl;
                    else {
                        const reader = new FileReader();
                        reader.onerror = reject;
                        reader.onload = e => img.src = e.target.result;
                        reader.readAsDataURL(fileOrDataUrl);
                    }
                });
            }
        },

        /**
         * Persistence module (localStorage, IndexedDB, JSON)
         */
        Persistence: {
            /**
             * Initialize IndexedDB
             * @returns {Promise<IDBDatabase>} Database instance
             */
            initIndexedDB() {
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open(this._dbName, 1);
                    req.onerror = () => reject(req.error);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if(!db.objectStoreNames.contains('modules')) {
                            db.createObjectStore('modules', { keyPath: 'module' });
                        }
                    };
                    req.onsuccess = () => {
                        this._db = req.result;
                        resolve(this._db);
                    };
                });
            },

            /**
             * Save module to localStorage
             * @param {string} module - Module name
             * @returns {boolean} Success status
             */
            saveLocal(module) {
                const data = VOTAX.CRUD.getAll(module);
                localStorage.setItem(`votax:${module}`, JSON.stringify({ module, data, timestamp: Date.now() }));
                return true;
            },

            /**
             * Load module from localStorage
             * @param {string} module - Module name
             * @returns {boolean} Success status
             */
            loadLocal(module) {
                const raw = localStorage.getItem(`votax:${module}`);
                if(!raw) return false;
                try {
                    const { data } = JSON.parse(raw);
                    data.forEach(item => VOTAX.CRUD.add(module, item));
                    return true;
                } catch(e) { console.error(e); return false; }
            },

            /**
             * Export all modules as JSON
             * @returns {string} JSON string
             */
            exportJSON() {
                const exported = {};
                const modules = Object.keys(VOTAX.CRUD._store);
                modules.forEach(m => {
                    exported[m] = VOTAX.CRUD.getAll(m);
                });
                return JSON.stringify({ version: VOTAX.version, timestamp: Date.now(), modules: exported }, null, 2);
            },

            /**
             * Import modules from JSON
             * @param {string} jsonStr - JSON string
             * @returns {boolean} Success status
             */
            importJSON(jsonStr) {
                try {
                    const { modules } = JSON.parse(jsonStr);
                    Object.keys(modules).forEach(m => {
                        VOTAX.CRUD.clear(m);
                        modules[m].forEach(item => VOTAX.CRUD.add(m, item));
                    });
                    return true;
                } catch(e) { console.error(e); return false; }
            },

            /**
             * Save all modules to localStorage
             * @returns {boolean} Success status
             */
            saveAllLocal() {
                Object.keys(VOTAX.CRUD._store).forEach(m => this.saveLocal(m));
                return true;
            },

            /**
             * Load all modules from localStorage
             * @param {string} prefix - Key prefix (default: 'votax:')
             * @returns {number} Count of loaded modules
             */
            loadAllLocal(prefix = 'votax:') {
                const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
                keys.forEach(k => {
                    const module = k.replace(prefix, '');
                    this.loadLocal(module);
                });
                return keys.length;
            }
        },

        /**
         * Validation module
         */
        Validation: {
            /** @type {Record<string, object>} */
            _schemas: {},
            /** @type {Array} */
            _errors: [],

            /**
             * Register schema for module
             * @param {string} module - Module name
             * @param {Object} schema - Validation rules
             * @example
             * VOTAX.Validation.registerSchema('students', {
             *   name: { required: true, minLength: 2 },
             *   age: { type: 'number', min: 5, max: 120 }
             * });
             */
            registerSchema(module, schema = {}) {
                this._schemas[module] = schema;
            },

            /**
             * Validate item against schema
             * @param {string} module - Module name
             * @param {Object} item - Item to validate
             * @returns {ValidationResult} Validation result
             */
            validate(module, item) {
                const schema = this._schemas[module];
                if(!schema) return { valid: true, errors: [] };
                const errors = [];
                Object.keys(schema).forEach(field => {
                    const rule = schema[field];
                    const val = item[field];
                    if(rule.required && (val === undefined || val === null || val === '')) {
                        errors.push({ field, message: `${field} is required` });
                    }
                    if(val !== undefined && val !== null) {
                        if(rule.type && typeof val !== rule.type) {
                            errors.push({ field, message: `${field} must be ${rule.type}` });
                        }
                        if(rule.pattern && !rule.pattern.test(String(val))) {
                            errors.push({ field, message: `${field} does not match pattern` });
                        }
                        if(rule.custom && typeof rule.custom === 'function' && !rule.custom(val)) {
                            errors.push({ field, message: `${field} failed custom validation` });
                        }
                        if(rule.minLength && String(val).length < rule.minLength) {
                            errors.push({ field, message: `${field} must be at least ${rule.minLength} chars` });
                        }
                        if(rule.maxLength && String(val).length > rule.maxLength) {
                            errors.push({ field, message: `${field} must be at most ${rule.maxLength} chars` });
                        }
                        if(rule.min !== undefined && Number(val) < rule.min) {
                            errors.push({ field, message: `${field} must be >= ${rule.min}` });
                        }
                        if(rule.max !== undefined && Number(val) > rule.max) {
                            errors.push({ field, message: `${field} must be <= ${rule.max}` });
                        }
                    }
                });
                return { valid: errors.length === 0, errors };
            },

            /**
             * Setup auto-validation hooks
             * @param {string} module - Module name
             */
            setupHooks(module) {
                VOTAX.CRUD.on(module, 'before:add', (item) => {
                    const { valid, errors } = VOTAX.Validation.validate(module, item);
                    if(!valid) {
                        console.warn(`Validation failed for ${module}:`, errors);
                        VOTAX.Validation._errors.push({ module, item, errors, timestamp: Date.now() });
                        return false; // cancel add
                    }
                });
                VOTAX.CRUD.on(module, 'before:update', ({ after }) => {
                    const { valid, errors } = VOTAX.Validation.validate(module, after);
                    if(!valid) {
                        console.warn(`Validation failed for ${module}:`, errors);
                        VOTAX.Validation._errors.push({ module, item: after, errors, timestamp: Date.now() });
                        return false; // cancel update
                    }
                });
            },

            /**
             * Get validation errors
             * @returns {Array} Error log
             */
            getErrors() {
                return VOTAX._cloneDeep(this._errors);
            },

            /**
             * Clear validation errors
             */
            clearErrors() {
                this._errors = [];
            }
        },

        /**
         * Advanced UI module
         */
        UI: {
            /**
             * Generate form for module
             * @param {string} module - Module name
             * @param {Function} onSubmit - Submit callback
             * @returns {HTMLFormElement} Form element
             */
            formFor(module, onSubmit = () => {}) {
                const tpl = VOTAX.CRUD._templates[module] || {};
                const form = document.createElement('form');
                form.style.cssText = 'border:1px solid #ccc; padding:10px; margin:10px 0; border-radius:5px;';
                Object.keys(tpl).forEach(field => {
                    const val = tpl[field];
                    const fieldDiv = document.createElement('div');
                    fieldDiv.style.marginBottom = '10px';
                    const label = document.createElement('label');
                    label.textContent = field + ': ';
                    fieldDiv.appendChild(label);
                    let input;
                    if(typeof val === 'boolean') {
                        input = document.createElement('input');
                        input.type = 'checkbox';
                        input.name = field;
                    } else if(typeof val === 'number') {
                        input = document.createElement('input');
                        input.type = 'number';
                        input.name = field;
                    } else if(Array.isArray(val)) {
                        input = document.createElement('input');
                        input.type = 'text';
                        input.name = field;
                        input.placeholder = 'comma-separated';
                    } else {
                        input = document.createElement('input');
                        input.type = 'text';
                        input.name = field;
                    }
                    input.style.marginLeft = '5px';
                    fieldDiv.appendChild(input);
                    form.appendChild(fieldDiv);
                });
                const btn = document.createElement('button');
                btn.type = 'submit';
                btn.textContent = 'Submit';
                form.appendChild(btn);
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const fd = new FormData(form);
                    const data = {};
                    fd.forEach((v, k) => {
                        const val = tpl[k];
                        if(typeof val === 'boolean') data[k] = fd.get(k) !== null;
                        else if(typeof val === 'number') data[k] = Number(fd.get(k));
                        else if(Array.isArray(val)) data[k] = fd.get(k).split(',').map(s => s.trim());
                        else data[k] = fd.get(k);
                    });
                    onSubmit(data);
                });
                return form;
            },

            /**
             * Show modal dialog
             * @param {string} title - Modal title
             * @param {string|HTMLElement} content - Content
             * @param {Array<{label:string, onclick:Function}>} buttons - Buttons
             * @returns {HTMLDivElement} Modal overlay
             */
            modal(title, content, buttons = []) {
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;';
                const box = document.createElement('div');
                box.style.cssText = 'background:white; padding:20px; border-radius:10px; max-width:500px; box-shadow:0 4px 6px rgba(0,0,0,0.1);';
                const titleEl = document.createElement('h3');
                titleEl.textContent = title;
                box.appendChild(titleEl);
                const contentEl = document.createElement('div');
                contentEl.innerHTML = typeof content === 'string' ? content : '';
                if(content instanceof HTMLElement) contentEl.appendChild(content);
                box.appendChild(contentEl);
                const btnDiv = document.createElement('div');
                btnDiv.style.marginTop = '15px';
                buttons.forEach(({ label, onclick }) => {
                    const btn = document.createElement('button');
                    btn.textContent = label;
                    btn.style.marginRight = '10px';
                    btn.onclick = () => { onclick(); overlay.remove(); };
                    btnDiv.appendChild(btn);
                });
                box.appendChild(btnDiv);
                overlay.appendChild(box);
                overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
                document.body.appendChild(overlay);
                return overlay;
            },

            /**
             * Make list draggable
             * @param {string|HTMLElement} container - Container selector or element
             * @param {Array} items - Items to render
             * @param {Function} onReorder - Reorder callback
             */
            makeDraggable(container, items = [], onReorder = () => {}) {
                const el = (typeof container === 'string') ? document.querySelector(container) : container;
                if(!el) return;
                el.innerHTML = '';
                items.forEach((item, i) => {
                    const div = document.createElement('div');
                    div.draggable = true;
                    div.style.cssText = 'padding:10px; border:1px solid #ddd; margin:5px 0; cursor:move; border-radius:5px;';
                    div.textContent = item.name || item.title || JSON.stringify(item).slice(0,50);
                    div.dataset.index = i;
                    div.addEventListener('dragstart', (e) => e.dataTransfer.effectAllowed = 'move');
                    div.addEventListener('dragover', (e) => e.preventDefault());
                    div.addEventListener('drop', (e) => {
                        e.preventDefault();
                        const from = parseInt(e.dataTransfer.getData('text/plain') || 0);
                        const to = parseInt(div.dataset.index);
                        if(from !== to) {
                            [items[from], items[to]] = [items[to], items[from]];
                            onReorder(items);
                            VOTAX.UI.makeDraggable(el, items, onReorder);
                        }
                    });
                    div.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
                    el.appendChild(div);
                });
            },

            /**
             * Render dashboard for module
             * @param {string|HTMLElement} container - Container
             * @param {string} module - Module name
             */
            renderDashboard(container, module){
                const el = (typeof container === 'string') ? document.querySelector(container) : container;
                if(!el) return;
                const list = VOTAX.CRUD.getAll(module);
                el.innerHTML = '';
                const header = document.createElement('div');
                header.innerHTML = `<strong>${module}</strong> — Total: ${list.length}`;
                el.appendChild(header);
                const nums = {};
                list.forEach(it => {
                    Object.keys(it).forEach(k => {
                        const v = it[k];
                        if(typeof v === 'number') {
                            nums[k] = nums[k] || { sum:0, cnt:0 };
                            nums[k].sum += v; nums[k].cnt++;
                        }
                    });
                });
                Object.keys(nums).forEach(k => {
                    const row = document.createElement('div');
                    row.textContent = `${k}: sum=${nums[k].sum} avg=${(nums[k].sum/nums[k].cnt).toFixed(2)}`;
                    el.appendChild(row);
                });
                const tagmap = {};
                list.forEach(it => (it.tags||[]).forEach(t => tagmap[t] = (tagmap[t]||0)+1));
                const tagsRow = document.createElement('div');
                tagsRow.textContent = 'Tags: ' + Object.keys(tagmap).map(t => `${t}(${tagmap[t]})`).join(', ');
                el.appendChild(tagsRow);
            }
        },

        /**
         * Performance module (indexing, pagination)
         */
        Performance: {
            /** @type {Record<string, Record<string, object>>} */
            _indexes: {},

            /**
             * Build index on field
             * @param {string} module - Module name
             * @param {string} field - Field name
             * @returns {Object} Index
             */
            buildIndex(module, field) {
                const list = VOTAX.CRUD._store[module] || [];
                const idx = {};
                list.forEach((item, i) => {
                    const val = item[field];
                    if(val !== undefined) {
                        if(!idx[val]) idx[val] = [];
                        idx[val].push(i);
                    }
                });
                this._indexes[module] = this._indexes[module] || {};
                this._indexes[module][field] = idx;
                return idx;
            },

            /**
             * Paginate results
             * @param {string} module - Module name
             * @param {number} page - Page number (1-indexed)
             * @param {number} pageSize - Items per page
             * @returns {PaginationResult} Pagination result
             */
            paginate(module, page = 1, pageSize = 10) {
                const list = VOTAX.CRUD.getAll(module);
                const total = list.length;
                const start = (page - 1) * pageSize;
                const items = list.slice(start, start + pageSize);
                return { page, pageSize, total, pages: Math.ceil(total / pageSize), items };
            },

            /**
             * Query using index (fast for large datasets)
             * @param {string} module - Module name
             * @param {string} field - Indexed field
             * @param {*} value - Value to match
             * @returns {VOTAXItem[]} Matching items
             */
            queryWithIndex(module, field, value) {
                const idx = (this._indexes[module] && this._indexes[module][field]) || {};
                const indices = idx[value] || [];
                const list = VOTAX.CRUD._store[module] || [];
                return indices.map(i => VOTAX._cloneDeep(list[i]));
            }
        },

        /**
         * Advanced animations (easing, timeline, spring)
         */
        Animate: {
            /**
             * Animate to state
             * @param {string|HTMLElement} target - Element selector or element
             * @param {Object} toProps - Target properties
             * @param {number} duration - Duration in seconds
             * @param {Object} opts - Options (easing, stagger)
             * @returns {Promise} Animation promise
             * @example
             * VOTAX.Animate.to(el, { x: 100, opacity: 0.5 }, 1, 
             *   { easing: VOTAX.Animate.ease.easeOut }
             * );
             */
            to(target, toProps = {}, duration = 1, opts = {}){
                return VOTAX.Animate._run('to', target, null, toProps, duration, opts);
            },

            /**
             * Animate from state
             * @param {string|HTMLElement} target - Element
             * @param {Object} fromProps - Starting properties
             * @param {number} duration - Duration
             * @param {Object} opts - Options
             * @returns {Promise} Animation promise
             */
            from(target, fromProps = {}, duration = 1, opts = {}){
                return VOTAX.Animate._run('from', target, fromProps, null, duration, opts);
            },

            /**
             * Animate from/to state
             * @param {string|HTMLElement} target - Element
             * @param {Object} fromProps - Starting properties
             * @param {Object} toProps - Target properties
             * @param {number} duration - Duration
             * @param {Object} opts - Options
             * @returns {Promise} Animation promise
             */
            fromTo(target, fromProps = {}, toProps = {}, duration = 1, opts = {}){
                return VOTAX.Animate._run('fromTo', target, fromProps, toProps, duration, opts);
            },

            /**
             * Easing functions
             * @type {Object}
             */
            ease: {
                linear: t => t,
                easeIn: t => t * t,
                easeOut: t => t * (2 - t),
                easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
                cubicBezier: (x1, y1, x2, y2) => {
                    return (t) => {
                        const mt = 1 - t;
                        return 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t;
                    };
                }
            },

            /**
             * Create animation timeline (sequence)
             * @returns {Object} Timeline object with add() and play()
             * @example
             * VOTAX.Animate.timeline()
             *   .add(el, { x: 100 }, 0.5)
             *   .add(el, { y: 100 }, 0.5)
             *   .play();
             */
            timeline() {
                const seq = [];
                return {
                    add(target, props, duration, opts) {
                        seq.push({ target, props, duration, opts });
                        return this;
                    },
                    play() {
                        let promise = Promise.resolve();
                        seq.forEach(({ target, props, duration, opts }) => {
                            promise = promise.then(() => VOTAX.Animate.to(target, props, duration, opts));
                        });
                        return promise;
                    }
                };
            },

            /**
             * Spring physics animation
             * @param {string|HTMLElement} target - Element
             * @param {Object} fromProps - Starting state
             * @param {Object} toProps - Target state
             * @param {number} stiffness - Spring stiffness (0-1)
             * @param {number} damping - Damping (0-1)
             * @returns {Promise} Animation promise
             */
            spring(target, fromProps, toProps, stiffness = 0.1, damping = 0.5) {
                return new Promise(resolve => {
                    const els = VOTAX._resolveTargets(target);
                    els.forEach(el => {
                        if(!el.__votax_trans) el.__votax_trans = {x:0,y:0,scale:1,rotate:0};
                        const state = {};
                        const velocity = {};
                        Object.keys(toProps).forEach(k => {
                            state[k] = fromProps[k] || toProps[k];
                            velocity[k] = 0;
                        });
                        const animate = () => {
                            let settled = true;
                            Object.keys(toProps).forEach(k => {
                                const target = toProps[k];
                                const diff = target - state[k];
                                velocity[k] += diff * stiffness;
                                velocity[k] *= damping;
                                state[k] += velocity[k];
                                if(Math.abs(diff) > 0.01) settled = false;
                                if(['x','y','scale','rotate'].includes(k)) el.__votax_trans[k] = state[k];
                                else el.style[k] = state[k];
                            });
                            const tx = el.__votax_trans.x || 0, ty = el.__votax_trans.y || 0;
                            el.style.transform = `translate(${tx}px, ${ty}px) scale(${el.__votax_trans.scale || 1}) rotate(${el.__votax_trans.rotate || 0}deg)`;
                            if(!settled) requestAnimationFrame(animate);
                            else resolve();
                        };
                        animate();
                    });
                });
            }
        },

        /**
         * Real-time module (cross-tab sync, conflict resolution)
         */
        RealTime: {
            _syncChannels: {},        // { channelName: [listeners] }
            _conflictStrategies: {},  // { strategy: fn } — INITIALIZE HERE
            
            /**
             * Broadcast message across tabs
             * @param {string} channel - Channel name
             * @param {string} event - Event type
             * @param {*} data - Event data
             */
            broadcast(channel, event, data) {
                const msg = { channel, event, data, timestamp: Date.now() };
                localStorage.setItem(`votax:sync:${channel}`, JSON.stringify(msg));
                this._notifyListeners(channel, event, data);
            },

            /**
             * Subscribe to channel
             * @param {string} channel - Channel name
             * @param {Function} listener - Callback (event, data)
             * @returns {Function} Unsubscribe function
             */
            subscribe(channel, listener) {
                if(!this._syncChannels[channel]) this._syncChannels[channel] = [];
                this._syncChannels[channel].push(listener);
                const handleStorage = (e) => {
                    if(e.key === `votax:sync:${channel}`) {
                        try {
                            const { event, data } = JSON.parse(e.newValue || '{}');
                            listener(event, data);
                        } catch(err) { console.error(err); }
                    }
                };
                window.addEventListener('storage', handleStorage);
                return () => window.removeEventListener('storage', handleStorage);
            },

            /**
             * Register conflict resolution strategy
             * @param {string} name - Strategy name
             * @param {Function} fn - Resolution function (local, remote) => merged
             */
            registerConflictStrategy(name, fn) {
                this._conflictStrategies[name] = fn;
            },

            /**
             * Resolve conflict using strategy
             * @param {string} strategy - Strategy name
             * @param {Object} local - Local version
             * @param {Object} remote - Remote version
             * @returns {Object} Merged result
             */
            resolveConflict(strategy, local, remote) {
                const fn = this._conflictStrategies[strategy] || this._conflictStrategies['last-write-wins'];
                return fn(local, remote);
            }
        }
    };

    // setup default conflict strategies (after VOTAX object definition)
    VOTAX.RealTime._conflictStrategies = VOTAX.RealTime._conflictStrategies || {};
    VOTAX.RealTime._conflictStrategies['last-write-wins'] = (local, remote) => remote;
    VOTAX.RealTime._conflictStrategies['local-wins'] = (local, remote) => local;
    VOTAX.RealTime._conflictStrategies['merge'] = (local, remote) => Object.assign({}, local, remote);

    // expose
    if(!global.VOTAX) global.VOTAX = VOTAX;
    if(typeof module !== 'undefined' && module.exports) module.exports = VOTAX;

})(window);
