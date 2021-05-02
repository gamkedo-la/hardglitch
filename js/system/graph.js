// This file profides facilities for building arbitrary graphs and searching paths in these.

export {

}

import * as debug from "./debug.js";

import { position_from_index } from "./utility.js";

function is_vertex_id(value){
    return Number.isInteger(value) && value >= 0;
}


// Defines vertice (zero to multiple vertex) in a graph.
// Any implementation must inherit from this and implement the functions.
class Vertice {

    // Returns the value/object of the vertex with the specified id.
    value_of(vertex_id){ throw "missing implementation"; }

    // Count of vertice.
    get count(){ throw "missing implementation"; }

    // Add a vertex and optionally set a value.
    add(vertex_id, value){ throw "missing implementation"; }

    // Removes a vertex and its value.
    remove(id){ throw "missing implementation"; }

};


// Defines edges in a graph, connecting vertices.
// Any implementation must inherit from this and implement the functions.
class Edges{
    // How many connections (edges) exist.
    get count(){ throw "missing implementation"; }
    // Removes all connections.
    clear() { throw "missing implementation"; }

    // Returns an array of vertex ids which are connected to the specified id.
    neighbors_of(vertex_id){ throw "missing implementation"; }

    // Returns a value associated with a connection between two ids (for example with weight) if existing.
    value_of(from_id, to_id){ throw "missing implementation"; }

    // Creates a directed connection between two vertice and/or optionally associate a value (for example some weight value).
    connect(from_id, to_id, value){ throw "missing implementation"; }

    // Removes a directed connection between two vertice and any associated value.
    disconnect(from_id, to_id){ throw "missing implementation"; }

    connect_bidirect(first_id, second_id, value){
        this.connect(first_id, second_id, value);
        this.connect(second_id, first_id, value);
    }

    disconnect_bidirect(first_id, second_id){
        this.disconnect(first_id, second_id);
        this.disconnect(second_id, first_id);
    }
};


class Graph {
    constructor(vertice, edges){
        debug.assertion(()=>vertice instanceof Vertice);
        debug.assertion(()=>edges instanceof Edges);
        this.vertice = vertice;
        this.edges = edges;
    }

};



class PathFinder {


    find_path(graph, begin_id, predicate){

    }

    find_path_to(graph, begin_id, destination_id){

    }

};


// Gives edges for a "grid" of fixed width.
// Does not support adding/removing edges.
class GridEdges extends Edges {
    constructor(width, height, allow_diagnoals = false){
        debug.assertion(()=>Number.isInteger(width) && width >= 0);
        debug.assertion(()=>Number.isInteger(height) && height >= 0);
        debug.assertion(()=>typeof allow_diagnoals === "boolean");
        this.width = width;
        this.height = height;
        this.allow_diagnoals = allow_diagnoals;
    }

    get count() { return this.width * this.height; }

    neighbors_of(vertex_id){
        debug.assertion(()=> is_vertex_id(vertex_id));
        const north = vertex_id - this.width;
        const south = vertex_id + this.width;
        const east = vertex_id + 1;
        const west = vertex_id - 1;

        const neighbors = [north, south, east, west];

        if(this.allow_diagnoals){
            const north_east = north + 1;
            const south_east = south + 1;
            const north_west = north - 1;
            const south_west = south - 1;
            neighbors.push(north_east, south_east, north_west, south_west);
        }

        return neighbors.filter(id => id >= 0 && id < this.count);
    }

};