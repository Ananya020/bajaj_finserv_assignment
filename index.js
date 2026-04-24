const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  let invalid_entries = [];
  let duplicate_edges = [];

  const edgeSet = new Set();
  const usedEdges = new Set();

  const adj = {};
  const childParent = {};
  const childSet = new Set();

  // Step 1 & 2
  data.forEach((item) => {
    const str = item.trim();

    if (!/^[A-Z]->[A-Z]$/.test(str) || str[0] === str[3]) {
      invalid_entries.push(item);
      return;
    }

    if (edgeSet.has(str)) {
      duplicate_edges.push(str);
      return;
    }

    edgeSet.add(str);

    const [parent, child] = str.split("->");

    // Multi-parent check
    if (childParent[child]) return;

    childParent[child] = parent;

    if (!adj[parent]) adj[parent] = [];
    adj[parent].push(child);

    childSet.add(child);
  });

  // All nodes
  const nodes = new Set();
  Object.keys(adj).forEach((k) => {
    nodes.add(k);
    adj[k].forEach((c) => nodes.add(c));
  });

  // Find roots
  let roots = [...nodes].filter((n) => !childSet.has(n));

  if (roots.length === 0 && nodes.size > 0) {
    roots = [Array.from(nodes).sort()[0]];
  }

  let hierarchies = [];
  let visitedGlobal = new Set();

  function dfs(node, visited) {
    if (visited.has(node)) return "cycle";

    visited.add(node);

    let children = adj[node] || [];
    let tree = {};

    for (let child of children) {
      let res = dfs(child, new Set(visited));
      if (res === "cycle") return "cycle";
      tree[child] = res;
    }

    return tree;
  }

  function getDepth(node) {
    if (!adj[node] || adj[node].length === 0) return 1;
    return 1 + Math.max(...adj[node].map(getDepth));
  }

  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = "";
  let maxDepth = 0;

  roots.forEach((root) => {
    let result = dfs(root, new Set());

    if (result === "cycle") {
      total_cycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
    } else {
      let treeObj = {};
      treeObj[root] = result;

      let depth = getDepth(root);

      total_trees++;

      if (
        depth > maxDepth ||
        (depth === maxDepth && root < largest_tree_root)
      ) {
        maxDepth = depth;
        largest_tree_root = root;
      }

      hierarchies.push({
        root,
        tree: treeObj,
        depth,
      });
    }
  });

  res.json({
    user_id: "yourname_ddmmyyyy",
    email_id: "your@email.com",
    college_roll_number: "your_roll",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root,
    },
  });
});

app.listen(3000, () => console.log("Server running"));