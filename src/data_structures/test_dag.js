const assert = require("chai").assert;

const _ = require("underscore");
const DAG = require("./dag.js");

describe("DAG", () => {
  var dag;

  describe("Initialization", () => {
    describe("constructor", () => {
      const n_verts = 3;

      it("should produce an object", () => {
        dag = new DAG();
        assert.typeOf(dag, "object");
        dag = new DAG(n_verts);
        assert.typeOf(dag, "object");
      });

      it("should have the correct number of vertices", () => {
        dag = new DAG();
        assert.equal(dag.num_vertices(), 0);
        dag = new DAG(n_verts);
        assert.equal(dag.num_vertices(), n_verts);
      });

      it("should have no edges", () => {
        dag = new DAG(n_verts);
        for (let i = 0; i < n_verts; i++) {
          assert.isEmpty(dag._edges_to[i]);
          assert.isEmpty(dag._edges_from[i]);
        }
      });
    });

    describe("copy", () => {
      const n_verts = 3;

      it("should copy the object", () => {
        dag = DAG.chain(n_verts);
        let copy = dag.copy();
      });
    });

    describe("is_equal", () => {
      const n_verts = 3;
      var dag2;
      var dag3;

      it("should return true if another DAG is equal", () => {
        dag = DAG.chain(n_verts);
        dag2 = DAG.chain(n_verts);
        assert(dag.is_equal(dag2));
        assert(dag2.is_equal(dag));
      });

      it("should return false if another DAG is not equal", () => {
        dag = DAG.chain(n_verts);
        dag2 = DAG.chain(n_verts + 1);
        dag3 = DAG.antichain(n_verts);
        assert(!dag.is_equal(dag2));
        assert(!dag.is_equal(dag3));
      });
    });
  });

  describe("Vertices", () => {
    const n_verts = 3;

    beforeEach(() => {
      dag = DAG.chain(n_verts);
    });

    describe("add_vertex", () => {
      beforeEach(() => {
        dag = new DAG();
        dag.add_vertex();
      });

      it("should add a new vertex", () => {
        assert.equal(dag.num_vertices(), 1);
      });

      it("should add an isolated vertex", () => {
        assert.isEmpty(dag._edges_to[0]);
        assert.isEmpty(dag._edges_from[0]);
      });
    });

    describe("has_vertex", () => {
      it("should return true if vertex is valid and false if not", () => {
        assert(dag.has_vertex(0));
        assert(dag.has_vertex(2));
        assert(!dag.has_vertex(3));
        assert(!dag.has_vertex(undefined));
        assert(!dag.has_vertex("a"));
      });
    });

    describe("_validate_vertex", () => {
      const invalid_inputs = [
        -1,
        "a",
        null,
        undefined,
        0.5,
        n_verts,
        n_verts + 3.5
      ];

      it("should throw an error if the input is not a valid index", () => {
        for (let i = 0; i < invalid_inputs.length; i++) {
          assert.throws(() => {
            DAG._validate_vertex(invalid_inputs[i], dag.num_vertices());
          });
        }
      });
    });

    describe("num_vertices", () => {
      it("should return the number of vertices of the DAG", () => {
        assert.equal(dag.num_vertices(), n_verts);
      });
    });

    describe("remove_vertex", () => {
      const n_verts = 4;
      const edges = [[0, 1], [0, 2], [1, 3], [2, 3]];
      const deleted_vert = 1;
      const remaining_edges = [[0, 1], [1, 2]];

      beforeEach(() => {
        dag = new DAG(n_verts, edges);
        dag.remove_vertex(deleted_vert);
      });

      it("should remove a vertex from a DAG", () => {
        assert.equal(dag.num_vertices(), n_verts - 1);
      });

      it("should delete all edges incident to deleted vertex and reindex remining vertices", () => {
        let compare = new DAG(n_verts - 1, remaining_edges);
        assert(dag.is_equal(compare));
      });
    });
  });

  describe("Edges", () => {
    const n_verts = 3;

    beforeEach(() => {
      dag = DAG.chain(n_verts);
    });

    describe("add_edge", () => {
      const n_verts = 3;
      const edges = [[0, 1], [1, 2]];
      const cycle_edge = [2, 0];

      beforeEach(() => {
        dag = new DAG(n_verts);
        for (let i = 0; i < edges.length; i++) {
          dag.add_edge(edges[i][0], edges[i][1]);
        }
      });

      it("should add the specified edges", () => {
        for (let i = 0; i < edges.length; i++) {
          let v1 = edges[i][0];
          let v2 = edges[i][1];
          assert.containsAllKeys(dag._edges_from[v1], [v2]);
          assert.containsAllKeys(dag._edges_to[v2], [v1]);
        }
      });

      it("should throw an error if creating a cycle", () => {
        let v1 = cycle_edge[0];
        let v2 = cycle_edge[1];
        assert.throws(() => {
          dag.add_edge(v1, v2);
        });
      });
    });

    describe("num_edges", () => {
      const n_verts = 6;

      it("should count the number of edges", () => {
        dag = DAG.chain(n_verts);
        dag.add_edge(1, 4);
        dag.add_edge(2, 5);
        assert.equal(dag.num_edges(), n_verts - 1 + 2);
      });
    });

    describe("has_edge", () => {
      const n_verts = 3;

      beforeEach(() => {
        dag = DAG.chain(n_verts);
      });

      it("should return true for an existing edge", () => {
        assert(dag.has_edge(0, 1));
      });

      it("should return false for a non-existing edge", () => {
        assert(!dag.has_edge(0, 2));
      });

      it("should throw an error if the inputs are not valid indices", () => {
        assert.throws(() => {
          dag.has_edge("a", 1);
        });
        assert.throws(() => {
          dag.has_edge(0, 1.5);
        });
      });
    });

    describe("remove_edge", () => {
      const n_verts = 3;

      beforeEach(() => {
        dag = DAG.chain(n_verts);
      });

      it("should remove an existing edge and return true", () => {
        assert(dag.has_edge(0, 1));
        assert(dag.remove_edge(0, 1));
        assert(!dag.has_edge(0, 1));
      });

      it("should do nothing for a non-existing edge and return false", () => {
        assert(!dag.has_edge(0, 2));
        assert(!dag.remove_edge(0, 2));
        assert(!dag.has_edge(0, 2));
      });

      it("should throw an error if the inputs are not valid indices", () => {
        assert.throws(() => {
          dag.remove_edge("a", 1);
        });
        assert.throws(() => {
          dag.remove_edge(0, 1.5);
        });
      });
    });

    describe("edges_from", () => {
      const v = 1;

      it("should return an Array of vertices adjacent to a source vertex", () => {
        let edges_from = dag.edges_from(v);
        assert.isArray(edges_from);
        assert.deepEqual(edges_from, [2]);
      });
    });

    describe("edges_to", () => {
      const v = 1;

      it("should return an Array of vertices adjacent to a target vertex", () => {
        let edges_to = dag.edges_to(v);
        assert.isArray(edges_to);
        assert.deepEqual(edges_to, [0]);
      });
    });
  });

  describe("Properties", () => {
    const n_verts = 3;

    beforeEach(() => {
      dag = DAG.chain(n_verts);
    });

    describe("has_path", () => {
      const v1 = 0;
      const v2 = 2;

      it("should find a path from a vertex to itself", () => {
        assert.isTrue(dag.has_path(v1, v1));
      });

      it("should find a directed path between two vertices", () => {
        assert.isTrue(dag.has_path(v1, v2));
      });

      it("should not detect a path directed in the opposite direction", () => {
        assert.isFalse(dag.has_path(v2, v1));
      });

      it("should throw an error if an invalid index is specified", () => {
        assert.throws(() => {
          dag.has_path(-1, v2);
        });
        assert.throws(() => {
          dag.has_path(v1, -1);
        });
      });
    });

    describe("sources", () => {
      it("should return a list of sources", () => {
        let sources = dag.sources();
        assert.isArray(sources);
        assert.lengthOf(sources, 1);
        assert.equal(sources[0], 0);
      });
    });

    describe("sinks", () => {
      it("should return a list of sinks", () => {
        let sinks = dag.sinks();
        assert.isArray(sinks);
        assert.lengthOf(sinks, 1);
        assert.equal(sinks[0], 2);
      });
    });
  });

  describe("Traversals", () => {
    const n_verts = 4;
    const edges = [[0, 1], [0, 2], [1, 3], [2, 3]];

    beforeEach(() => {
      dag = new DAG(n_verts);
      for (let i = 0; i < edges.length; i++) {
        dag.add_edge(edges[i][0], edges[i][1]);
      }
    });

    describe("traversal", () => {
      var traversal;

      beforeEach(() => {
        traversal = dag.traversal();
      });

      it("should allow traversal in dependency order", () => {
        assert.deepEqual(traversal.available(), [0]);
        traversal.visit(0);
        assert.deepEqual(traversal.available(), [1, 2]);
        traversal.visit(2);
        assert.deepEqual(traversal.available(), [1]);
        traversal.visit(1);
        assert.deepEqual(traversal.available(), [3]);
        traversal.visit(3);
        assert.deepEqual(traversal.available(), []);
      });

      it("should allow visiting of dependent vertices", () => {
        traversal.visit(1, 2);
        assert.deepEqual(traversal.available(), [0, 3]);
      });

      it("should allow checking of visited vertices", () => {
        traversal.visit(0, 2, 1);
        assert.deepEqual(traversal.visited(), [0, 1, 2]);
      });
    });

    describe("linear_traversal", () => {
      it("should produce the lex minimal linear traversal", () => {
        let lin_traversal = dag.linear_traversal();
        assert.deepEqual(lin_traversal, [0, 1, 2, 3]);
      });
    });

    describe("layered_traversal", () => {
      it("should produce the layered traversal of the DAG", () => {
        let lay_traversal = dag.layered_traversal();
        assert.deepEqual(lay_traversal, [[0], [1, 2], [3]]);
      });
    });
  });

  describe("Constructors", () => {
    describe("DAG.antichain", () => {
      const n_verts = 3;

      beforeEach(() => {
        dag = DAG.antichain(n_verts);
      });

      it("should produce an antichain with the specified number of vertices", () => {
        assert.equal(dag.num_vertices(), n_verts);
        for (let i = 0; i < n_verts; i++) {
          assert.isEmpty(dag._edges_from[i]);
          assert.isEmpty(dag._edges_to[i]);
        }
      });
    });

    describe("DAG.chain", () => {
      const n_verts = 3;

      beforeEach(() => {
        dag = DAG.chain(n_verts);
      });

      it("should produce a chain with the specified number of vertices", () => {
        assert.equal(dag.num_vertices(), n_verts);
        assert.isEmpty(dag._edges_to[0]);
        assert.isEmpty(dag._edges_from[n_verts - 1]);
        for (let i = 0; i < n_verts - 1; i++) {
          assert.hasAllKeys(dag._edges_from[i], [i + 1]);
          assert.hasAllKeys(dag._edges_to[i + 1], [i]);
        }
      });
    });

    describe("DAG.reversed", () => {
      const n_verts = 3;

      beforeEach(() => {
        dag = DAG.chain(n_verts);
      });

      it("should produce a copy of a DAG with all edges reversed", () => {
        let rev = DAG.reversed(dag);
        assert(dag.has_edge(0, 1));
        assert(!rev.has_edge(0, 1));
        assert(rev.has_edge(1, 0));
        assert(dag.has_edge(1, 2));
        assert(!rev.has_edge(1, 2));
        assert(rev.has_edge(2, 1));
        assert(!dag.has_edge(0, 2));
        assert(!rev.has_edge(2, 0));
      });
    });
  });
});
