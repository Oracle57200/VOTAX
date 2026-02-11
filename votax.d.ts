/**
 * VOTAX v3.0.0 TypeScript Definitions
 * Complete feature library for mini-projects
 */

interface VOTAXItem {
  id: string;
  code: string;
  tags: string[];
  [key: string]: any;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

interface PaginationResult<T = VOTAXItem> {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  items: T[];
}

interface RelationConfig {
  keyFrom: string;
  keyTo: string;
  [key: string]: any;
}

interface AnimationOptions {
  easing?: (t: number) => number;
  stagger?: number;
}

interface SchemaRule {
  required?: boolean;
  type?: string;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

// ===== VOTAX Global Object =====

declare const VOTAX: {
  version: string;
  _store: Record<string, any[]>;
  _templates: Record<string, object>;
  _hooks: Record<string, Record<string, Function[]>>;
  _relations: Record<string, Record<string, RelationConfig[]>>;
  _computed: Record<string, Record<string, Function>>;
  _history: any[];
  _uidCounter: number;
  _meta: Record<string, number>;
  _dbName: string;

  CRUD: {
    registerTemplate(module: string, template: object): void;
    on(module: string, event: string, fn: (payload: any) => void | boolean): void;
    add<T extends VOTAXItem>(module: string, item: Partial<T>, opts?: object): T | null;
    get<T extends VOTAXItem>(module: string, id: string): T | null;
    getAll<T extends VOTAXItem>(module: string, opts?: object): T[];
    update<T extends VOTAXItem>(module: string, id: string, patch: Partial<T>): T | null;
    remove(module: string, id: string): boolean;
    bulkUpdate(module: string, predicate: Function | string, patch: object): number;
    bulkRemove(module: string, predicate: Function | string): number;
    search<T extends VOTAXItem>(module: string, q: string, fields?: string[]): T[];
    query<T extends VOTAXItem>(module: string, filters: object | any[]): T[];
    addRelation(moduleFrom: string, moduleTo: string, keyFrom: string, keyTo: string, opts?: object): RelationConfig;
    getRelated<T extends VOTAXItem>(fromModule: string, itemId: string, toModule: string, opts?: object): T[];
    registerComputed(module: string, name: string, fn: (item: any) => any): void;
    compute(module: string, id: string, name: string): any;
    addTag(module: string, id: string, tag: string): VOTAXItem | null;
    removeTag(module: string, id: string, tag: string): VOTAXItem | null;
    stats(module: string, op: 'count' | 'sum' | 'avg' | Function, field?: string): number | any;
    sample<T extends VOTAXItem>(module: string, n?: number): T[];
    seed<T extends VOTAXItem>(module: string, n?: number, factory?: Partial<T> | ((index: number) => Partial<T>)): T[];
    undo(): boolean;
    clear(module?: string): void;
    _store: Record<string, any[]>;
    _templates: Record<string, object>;
    _hooks: Record<string, Record<string, Function[]>>;
  };

  Images: {
    preview(file: File): Promise<string>;
    resize(fileOrDataUrl: File | string, maxW?: number, maxH?: number, quality?: number): Promise<string>;
  };

  Persistence: {
    initIndexedDB(): Promise<IDBDatabase>;
    saveLocal(module: string): boolean;
    loadLocal(module: string): boolean;
    exportJSON(): string;
    importJSON(jsonStr: string): boolean;
    saveAllLocal(): boolean;
    loadAllLocal(prefix?: string): number;
  };

  Validation: {
    registerSchema(module: string, schema: Record<string, SchemaRule>): void;
    validate(module: string, item: object): ValidationResult;
    setupHooks(module: string): void;
    getErrors(): any[];
    clearErrors(): void;
    _schemas: Record<string, object>;
    _errors: any[];
  };

  UI: {
    formFor(module: string, onSubmit?: (data: object) => void): HTMLFormElement;
    modal(title: string, content: string | HTMLElement, buttons?: Array<{ label: string; onclick: () => void }>): HTMLDivElement;
    makeDraggable<T extends VOTAXItem>(container: string | HTMLElement, items: T[], onReorder?: (items: T[]) => void): void;
    renderDashboard(container: string | HTMLElement, module: string): void;
  };

  Performance: {
    buildIndex(module: string, field: string): object;
    paginate<T extends VOTAXItem>(module: string, page?: number, pageSize?: number): PaginationResult<T>;
    queryWithIndex<T extends VOTAXItem>(module: string, field: string, value: any): T[];
    _indexes: Record<string, Record<string, object>>;
  };

  Animate: {
    to(target: string | HTMLElement, toProps: object, duration?: number, opts?: AnimationOptions): Promise<void>;
    from(target: string | HTMLElement, fromProps: object, duration?: number, opts?: AnimationOptions): Promise<void>;
    fromTo(target: string | HTMLElement, fromProps: object, toProps: object, duration?: number, opts?: AnimationOptions): Promise<void>;
    ease: {
      linear(t: number): number;
      easeIn(t: number): number;
      easeOut(t: number): number;
      easeInOut(t: number): number;
      cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number;
    };
    timeline(): {
      add(target: string | HTMLElement, props: object, duration: number, opts?: AnimationOptions): any;
      play(): Promise<void>;
    };
    spring(target: string | HTMLElement, fromProps: object, toProps: object, stiffness?: number, damping?: number): Promise<void>;
  };

  RealTime: {
    broadcast(channel: string, event: string, data: any): void;
    subscribe(channel: string, listener: (event: string, data: any) => void): () => void;
    registerConflictStrategy(name: string, fn: (local: object, remote: object) => object): void;
    resolveConflict(strategy: string, local: object, remote: object): object;
  };
};

export default VOTAX;
