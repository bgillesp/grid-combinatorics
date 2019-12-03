const _ = require("underscore");
const util = require("./util.js");

/**
 * Implementation of a simple directed acyclic graph
 */
class DAG {
  /**
   * Construct a new DAG with a specified number of vertices and specified
   * edges.
   * @param {Number} [n_verts=0] - The number of vertices for the new DAG.
   * @param {Array} [edges=[]]   - An array of edges.  Each element should be an
   * Array of length 2 giving the start and end vertex indices.
   */
  constructor(n_verts = 0, edges = []) {
    if (!_.isNumber(n_verts) || n_verts < 0 || n_verts != Math.floor(n_verts)) {
      throw new TypeError(
        "specified number of vertices is not a nonnegative integer"
      );
    }
    if (!_.isArray(edges)) {
      throw new TypeError("specified edges is not an Array");
    }
    this._n_verts = 0;
    this._edges_to = [];
    this._edges_from = [];
    for (let i = 0; i < n_verts; i++) {
      this._add_vertex();
    }
    for (let i = 0; i < edges.length; i++) {
      if (!_.isArray(edges[i]) || edges[i].length != 2) {
        throw new TypeError(
          "specified edge at index " + i + " is not an Array of two vertices"
        );
      }
      this.add_edge(edges[i][0], edges[i][1]);
    }
  }

  /**
   * Return a copy of this DAG.
   * @return {DAG} - A copy of this DAG.
   */
  copy() {
    let dag = new DAG();
    dag._n_verts = this._n_verts;
    for (let i = 0; i < this._n_verts; i++) {
      dag._edges_to[i] = new Set(this._edges_to[i]);
      dag._edges_from[i] = new Set(this._edges_from[i]);
    }
    return dag;
  }

  /**
   * Checks whether this DAG is equal to another DAG, where order of the
   * vertices matters.
   * @param  {DAG} other - The other DAG to compare to.
   * @return {Boolean}   - Whether the two DAGs are equal.
   */
  is_equal(other) {
    if (this.num_vertices() != other.num_vertices()) return false;
    for (let i = 0; i < this._edges_from.length; i++) {
      if (!util.set_equal(this._edges_from[i], other._edges_from[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Add a new isolated vertex to the DAG.
   * @return {Number} - The index of the new vertex.
   */
  add_vertex() {
    this._add_vertex();
    return this.num_vertices() - 1;
  }
  _add_vertex() {
    this._n_verts += 1;
    this._edges_to.push(new Set());
    this._edges_from.push(new Set());
  }

  /**
   * Return whether a given input represents a vertex of the DAG, that is, if it
   * is one of the num_vertices consecutive integers starting with 0.
   * @param index      - The input to test.
   * @return {Boolean} - Whether the input is a vertex.
   */
  has_vertex(input) {
    return (
      _.isNumber(input) &&
      input >= 0 &&
      input < this.num_vertices() &&
      input == Math.floor(input)
    );
  }

  /**
   * Throws a TypeError if the input is not a valid index for the DAG.
   * @param input - The input to be validated.
   */
  static _validate_vertex(input, len) {
    if (
      !_.isNumber(input) ||
      input < 0 ||
      input >= len ||
      input != Math.floor(input)
    ) {
      throw new TypeError("specified index is not valid: " + input);
    }
  }

  /**
   * Return the number of vertices of the DAG.
   * @return {Number} - The number of vertices of the DAG.
   */
  num_vertices() {
    return this._n_verts;
  }

  /**
   * Remove a vertex and all incident edges from the DAG, reindexing remaining
   * vertices to form a range of integers starting at 0.
   * @param  {Number} index - The Index of the vertex to remove.
   */
  remove_vertex(index) {
    DAG._validate_vertex(index, this._n_verts);
    this._remove_vertex(index);
  }
  _remove_vertex(index) {
    this._n_verts -= 1;
    this._edges_to.splice(index, 1);
    this._edges_from.splice(index, 1);
    let reindex_set = set => {
      for (let i = 0; i < this._n_verts; i++) {
        let arr = Array.from(set);
        arr = _.map(arr, n => (n < index ? n : n - 1));
        return new Set(arr);
      }
    };
    for (let i = 0, len = this._n_verts; i < len; i++) {
      this._edges_to[i].delete(index);
      this._edges_to[i] = reindex_set(this._edges_to[i]);
      this._edges_from[i].delete(index);
      this._edges_from[i] = reindex_set(this._edges_from[i]);
    }
  }

  /**
   * Adds an edge to the DAG between two specified vertices.  Throws an error if
   * the addition introduces a cycle to the DAG.
   * @param {Number} i - Index of the starting vertex.
   * @param {Number} j - Index of the ending vertex.
   */
  add_edge(i, j) {
    DAG._validate_vertex(i, this._n_verts);
    DAG._validate_vertex(j, this._n_verts);
    if (this.has_path(j, i)) {
      throw new Error("specified edge would create a cycle");
    } else {
      this._add_edge(i, j);
    }
  }
  _add_edge(i, j) {
    this._edges_from[i].add(j);
    this._edges_to[j].add(i);
  }

  /**
   * Return the total number of edges in this DAG.
   * @return {Number} - The number of edges.
   */
  num_edges() {
    let count = 0;
    for (let i = 0, len = this.num_vertices(); i < len; i++) {
      count += this._edges_from[i].size;
    }
    return count;
  }

  /**
   * Return whether the DAG has an edge between two specified vertices.
   * @param {Number} i - Index of the starting vertex.
   * @param {Number} j - Index of the ending vertex.
   * @return {Boolean} - Whether the DAG has an edge between the vertices.
   */
  has_edge(i, j) {
    DAG._validate_vertex(i, this._n_verts);
    DAG._validate_vertex(j, this._n_verts);
    return this._has_edge(i, j);
  }
  _has_edge(i, j) {
    return this._edges_from[i].has(j);
  }

  /**
   * Remove an edge from the DAG, and return whether the edge existed.
   * @param {Number} i - Index of the starting vertex.
   * @param {Number} j - Index of the ending vertex.
   * @return {Boolean} - Whether the edge existed before removal.
   */
  remove_edge(i, j) {
    DAG._validate_vertex(i, this._n_verts);
    DAG._validate_vertex(j, this._n_verts);
    let removed = this._has_edge(i, j);
    this._remove_edge(i, j);
    return removed;
  }
  _remove_edge(i, j) {
    this._edges_from[i].delete(j);
    this._edges_to[j].delete(i);
  }

  /**
   * Return the indices of vertices adjacent to a specified source vertex.
   * @param  {Number} index - The index of the source vertex.
   * @return {Array}        - The vertices adjacent to the source vertex.
   */
  edges_from(index) {
    DAG._validate_vertex(index, this._n_verts);
    return this._edges_from_arr(index);
  }
  _edges_from_arr(index) {
    return Array.from(this._edges_from[index]).sort();
  }

  /**
   * Return the indices of vertices adjacent to a specified target vertex.
   * @param  {Number} index - The index of the target vertex.
   * @return {Array}        - The vertices adjacent to the target vertex.
   */
  edges_to(index) {
    DAG._validate_vertex(index, this._n_verts);
    return this._edges_to_arr(index);
  }
  _edges_to_arr(index) {
    return Array.from(this._edges_to[index]).sort();
  }

  /**
   * Returns whether there is a directed path between two vertices of the DAG.
   * @param  {Number} i - The starting vertex index.
   * @param  {Number} j - The ending vertex index.
   * @return {Boolean}  - True if there is a directed path from the starting
   *                      vertex to the ending vertex, or false otherwise.
   */
  has_path(i, j) {
    DAG._validate_vertex(i, this._n_verts);
    DAG._validate_vertex(j, this._n_verts);
    return this._has_path(i, j);
  }
  _has_path(i, j) {
    if (i == j) return true;
    let traversal = [i];
    for (let k = 0; k < traversal.length; k++) {
      let u = traversal[k],
        edges = this._edges_from_arr(u);
      for (let l = 0, len = edges.length; l < len; l++) {
        let v = edges[l];
        if (!traversal.includes(v)) {
          if (v == j) return true;
          traversal.push(v);
        }
      }
    }
    return false;
  }

  /**
   * Return an Array of the vertex numbers which are source vertices of the DAG.
   * @return {Array} - An Array of nonnegative integers representing the source
   *                   vertices.
   */
  sources() {
    let sources = [];
    for (let i = 0, len = this.num_vertices(); i < len; i++) {
      if (this._edges_to[i].size == 0) {
        sources.push(i);
      }
    }
    return sources;
  }

  /**
   * Return an Array of the vertex numbers which are sink vertices of the DAG.
   * @return {Array} - An Array of nonnegative integers representing the sink
   *                   vertices.
   */
  sinks() {
    let sinks = [];
    for (let i = 0, len = this.num_vertices(); i < len; i++) {
      if (this._edges_from[i].size == 0) {
        sinks.push(i);
      }
    }
    return sinks;
  }

  /**
   * Return a DAGTraversal object to track traversal of this DAG in dependency
   * order, starting at the source nodes.
   * @return {DAGTraversal} - The DAGTraversal object.
   */
  traversal() {
    return new DAGTraversal(this._edges_to);
  }

  /**
   * Return an Array containing a permutation of the indices of this DAG giving
   * a dependency order traversal.  Each index is chosen as the minimum
   * available for traversal among those not occuring previously in the Array,
   * so the traversal order is lexicographically minimal among all possible.
   * @return {Array} - The permutation of indices giving a dependency order
   *                   traversal of this DAG.
   */
  linear_traversal() {
    let traversal = this.traversal();
    let ordering = [];
    while (ordering.length < this.num_vertices()) {
      let index = traversal.available()[0];
      ordering.push(index);
      traversal.visit(index);
    }
    return ordering;
  }

  /**
   * Return an Array containing Arrays of indices of the DAG representing a
   * layered dependency traversal.  Each Array gives the vertices available in a
   * traversal after visiting all the previously listed vertices.
   * @return {Array} - The Array consisting of layers of a layered traversal.
   */
  layered_traversal() {
    let traversal = this.traversal();
    let available = traversal.available();
    let layers = [];
    while (available.length > 0) {
      let layer = Array.from(available);
      layers.push(layer);
      traversal.visit(layer);
      available = traversal.available();
    }
    return layers;
  }

  /**
   * Return a DAG with no edges.
   * @param  {Number} len - The number of vertices of the new DAG.
   * @return {DAG}     - A new antichain DAG object.
   */
  static antichain(len) {
    let dag = new DAG(len);
    return dag;
  }

  /**
   * Return a DAG with a single edge between vertices i and i+1 for each i.
   * @param  {Number} len - The number of vertices of the new DAG.
   * @return {DAG}     - A new chain DAG object.
   */
  static chain(len) {
    let dag = new DAG(len);
    for (let i = 0; i < len - 1; i++) {
      dag.add_edge(i, i + 1);
    }
    return dag;
  }

  /**
   * Return a copy of a DAG with all edges reversed.
   * @return {DAG} - A copy of the DAG with all edges reversed.
   */
  static reversed(dag) {
    let reversed = dag.copy();
    let tmp = reversed._edges_from;
    reversed._edges_from = reversed._edges_to;
    reversed._edges_to = tmp;
    return reversed;
  }
}

/**
 * Class representing a dependency traversal of a DAG.  A vertex u is dependent
 * on a vertex v if the DAG has an edge directed from v to u.  A dependency
 * traversal of a DAG keeps track of a collection of visited vertices, and can
 * retrieve the collection of vertices which do not depend on an unvisited
 * vertex.  In this way, the vertices can be ordered in such a way that no
 * vertex depends on a vertex before it in the ordering.
 */
class DAGTraversal {
  /**
   * Construct a new DAGTraversal object with given dependencies.
   * @param {Array} dependencies - An Array of dependencies between vertices.
   * The entry at index i should be a Set including the vertices which are
   * dependencies for vertex i.
   */
  constructor(dependencies) {
    this._n_verts = dependencies.length;
    this._edges = [];
    for (let i = 0; i < dependencies.length; i++) {
      this._edges.push(new Set(dependencies[i]));
    }
    this._visited = new Set();
  }

  /**
   * Visit one or more vertices in this traversal.
   * @param indices - Either an Array or rest parameters for numerical indices.
   */
  visit(...indices) {
    if (indices.length == 1 && _.isArray(indices[0])) {
      indices = indices[0];
    }
    for (let i = 0, len = indices.length; i < len; i++) {
      DAG._validate_vertex(indices[i], this._n_verts);
      this._visit(indices[i]);
    }
  }
  _visit(index) {
    for (let j = 0, len = this._edges.length; j < len; j++) {
      this._edges[j].delete(index);
    }
    this._visited.add(index);
  }

  /**
   * Return a sorted Array listing the visited vertices.
   * @return {Array} - The vertices visited already by this Traversal.
   */
  visited() {
    return Array.from(this._visited).sort();
  }

  /**
   * Return a sorted Array listing the vertices not depending on any of the
   * vertices not yet visited by this Traversal.
   * @return {Array} - The available vertices.
   */
  available() {
    let available = new Array();
    for (let i = 0; i < this._edges.length; i++) {
      if (this._edges[i].size == 0 && !this._visited.has(i)) {
        available.push(i);
      }
    }
    return available;
  }
}

module.exports = DAG;
