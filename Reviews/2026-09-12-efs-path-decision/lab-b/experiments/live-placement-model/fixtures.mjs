// Explicit deterministic events and hand-pinned full placement tuples.
export const DRAFTS = 'folder:drafts';
export const PUBLISHED = 'folder:published';
export const AUTHORS = ['A', 'B', 'C'];
export const QUERY = { authors: AUTHORS, scope: DRAFTS };
export const bind = (author, scope, name, target) => ({ op: 'bind', author, scope, name, target });
export const unbind = (author, scope, name) => ({ op: 'unbind', author, scope, name });

export const BASE = [
  bind('A', DRAFTS, 'note', 'F'),                 // admission 1, binding 1
  bind('A', DRAFTS, 'brief', 'F'),                // 2, binding 2
  unbind('A', DRAFTS, 'brief'),                  // 3
  bind('A', DRAFTS, 'temporary-a', 'F'),          // 4, binding 3
  unbind('A', DRAFTS, 'temporary-a'),            // 5
  bind('A', DRAFTS, 'temporary-b', 'F'),          // 6, binding 4
  unbind('A', DRAFTS, 'temporary-b'),            // 7
  bind('A', DRAFTS, 'alias', 'G'),                // 8, binding 5
  bind('B', DRAFTS, 'note', 'F'),                 // 9, binding 6
  bind('B', DRAFTS, 'brief', 'F'),                // 10, binding 7
  bind('C', DRAFTS, 'later', 'H'),                // 11, binding 8
  bind('C', DRAFTS, 'alias', 'H'),                // 12, binding 9
  unbind('A', DRAFTS, 'note'),                   // 13
  bind('A', DRAFTS, 'note', 'G'),                 // 14, same binding 1, revision 3
  bind('A', 'head', 'F', 'RF'),                  // 15, binding 10
  bind('A', 'head', 'G', 'RG'),                  // 16, binding 11
  bind('A', 'head', 'H', 'RH'),                  // 17, binding 12
  bind('A', 'tag:F', 'project', 'F'),            // 18, binding 13
  bind('A', 'tag:H', 'project', 'H'),            // 19, binding 14
  bind('A', 'tag:RF', 'approved', 'F'),          // 20, binding 15
  bind('A', 'tag:RH', 'approved', 'H'),          // 21, binding 16
];

export const EXPECTED = [
  { scope: DRAFTS, name: 'note', author: 'A', target: 'G', revision: 3, admission: 14, bindingOrdinal: 1 },
  { scope: DRAFTS, name: 'alias', author: 'A', target: 'G', revision: 1, admission: 8, bindingOrdinal: 5 },
  { scope: DRAFTS, name: 'later', author: 'C', target: 'H', revision: 1, admission: 11, bindingOrdinal: 8 },
];

// Each group is one modeled atomic publication; compare after the whole group.
export const TRANSITIONS = [
  { label: 'live replacement', actions: [bind('A', DRAFTS, 'note', 'F')] },
  { label: 'replace back', actions: [bind('A', DRAFTS, 'note', 'G')] },
  { label: 'move out', actions: [unbind('A', DRAFTS, 'note'), bind('A', PUBLISHED, 'note', 'G')] },
  { label: 'move back', actions: [unbind('A', PUBLISHED, 'note'), bind('A', DRAFTS, 'note', 'G')] },
  { label: 'higher mask over lower H', actions: [unbind('A', DRAFTS, 'alias')] },
  { label: 'restore higher G', actions: [bind('A', DRAFTS, 'alias', 'G')] },
  { label: 'two new churned names', actions: [bind('A', DRAFTS, 'churn-1', 'F'), unbind('A', DRAFTS, 'churn-1'),
    bind('A', DRAFTS, 'churn-2', 'F'), unbind('A', DRAFTS, 'churn-2')] },
  { label: 'same-key ordered effects in one publication', actions: [bind('A', DRAFTS, 'note', 'F'),
    unbind('A', DRAFTS, 'note'), bind('A', DRAFTS, 'note', 'G')] },
  { label: 'File HEAD whiteout', actions: [unbind('A', 'head', 'H')] },
];
