const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  const invalid_entries = [];
  const duplicate_edges = [];
  const edgeSet = new Set();
  const duplicateSet = new Set();
  const adj = {};
  const childParent = {};
  const childSet = new Set();

  data.forEach((item) => {
    const str = item.trim();

    if (!/^[A-Z]->[A-Z]$/.test(str) || str[0] === str[3]) {
      invalid_entries.push(item);
      return;
    }

    if (edgeSet.has(str)) {
      if (!duplicateSet.has(str)) {
        duplicate_edges.push(str);
        duplicateSet.add(str);
      }
      return;
    }

    edgeSet.add(str);

    const [parent, child] = str.split("->");

    if (childParent[child]) return;

    childParent[child] = parent;

    if (!adj[parent]) adj[parent] = [];
    adj[parent].push(child);

    childSet.add(child);
  });

  const nodes = new Set();
  Object.keys(adj).forEach((k) => {
    nodes.add(k);
    adj[k].forEach((c) => nodes.add(c));
  });

  let roots = [...nodes].filter((n) => !childSet.has(n));

  if (roots.length === 0 && nodes.size > 0) {
    roots = [Array.from(nodes).sort()[0]];
  }

  const hierarchies = [];

  function dfs(node, visited) {
    if (visited.has(node)) return "cycle";

    visited.add(node);

    const children = adj[node] || [];
    const tree = {};

    for (const child of children) {
      const result = dfs(child, new Set(visited));
      if (result === "cycle") return "cycle";
      tree[child] = result;
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
    const result = dfs(root, new Set());

    if (result === "cycle") {
      total_cycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
    } else {
      const treeObj = {};
      treeObj[root] = result;

      const depth = getDepth(root);
      total_trees++;

      if (depth > maxDepth || (depth === maxDepth && root < largest_tree_root)) {
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
    user_id: "AnanyaAgrawal_03012006",
    email_id: "aa6196@srmist.edu.in",
    college_roll_number: "RA2311003010974",
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

app.listen(3000, () => console.log("Server running on port 3000"));