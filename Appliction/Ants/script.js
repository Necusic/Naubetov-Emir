class Ant {

    constructor() {
        this.currentNode = cy.nodes()[Math.floor(Math.random() * cy.nodes().length)]
        this.route = cy.collection();
        this.route.push(this.currentNode);
        this.routeEdges = cy.collection();
        this.visited = cy.collection(); 
    }

   
    visitEdge(edge) {
        let connectedNodes = edge.connectedNodes();
        for (let i = 0; i < connectedNodes.length; i++) {
            
            if (this.currentNode !== connectedNodes[i]) {
                
                this.routeEdges.push(edge);
                this.currentNode = connectedNodes[i];
                this.route.push(connectedNodes[i]);
                
                break;
            }
        }
        this.visited.push(edge.connectedNodes())
        
    }

    
    chooseNextEdge() {
        let edges = this.currentNode.connectedEdges();
        
        let probabilities = this.calcProbabilities();
        
        let r = Math.random();
        let total = 0;
        for (let i = 0; i < edges.length; i++) {
            total += probabilities[i];
           
            if (total >= r) {
                return edges[i];
            }
        }
        throw "We ant found shit"

    }

    
    calcProbabilities() {
        console.log("Calculating probabilities...")
        let edges = this.currentNode.connectedEdges();
       
        let probabilities = [edges.length];
        let pheromone = 0.0;
        for (let i = 0; i < edges.length; i++) {
            if (!edges[i].connectedNodes().every(c => this.route.includes(c))) {
                pheromone +=
                    Math.pow(edges[i].data('pheromoneCount'), antColony.alpha) * Math.pow(1.0 / calcDistanceBetweenPoints(edges[i].connectedNodes()[0], edges[i].connectedNodes()[1]), antColony.beta);
            }
        }
        for (let j = 0; j < edges.length; j++) {
            
            if (edges[j].connectedNodes().every(c => this.route.includes(c))) {
                probabilities[j] = 0.0;
            } else {
                let numerator =
                    Math.pow(edges[j].data('pheromoneCount'), antColony.alpha) * Math.pow(1.0 / calcDistanceBetweenPoints(edges[j].connectedNodes()[0], edges[j].connectedNodes()[1]), antColony.beta);
                probabilities[j] = numerator / pheromone;
            }
        }
        console.log('Probabilities: ' + probabilities);
        return probabilities;
    }


}
var cy = cytoscape({
    
    container: document.getElementById('cy'),
    style: [
        {
            selector: 'node' ,
            style: {
                shape: 'hexagon',
                label: 'data(id)',
                color: 'white'
            }
        },
        {
            selector: 'edge' ,
            style: {
                'label' : function ( ele){
                    return Math.floor(ele.data('pheromoneCount'));
                },
                'line-color': 'mapData(pheromoneCount, 1, 50,  #ffcc66, #ff0000)',
                'opacity': 'mapData(pheromoneCount, 1, 50, 0.03, 1)',
                color: "white"
            }
        },
        {
            selector: '.startNode' ,
            style: {
                'background-color' : 'GREEN'
            }
        },
        {
            selector: '.endNode' ,
            style: {
                'background-color' : 'RED'
            }
        }

    ],
   
    zoom: 4,
    pan: { x: 0, y: 0 },

    
    minZoom: 1,
    maxZoom: 4,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    panningEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: true,
    selectionType: 'single',
    touchTapThreshold: 8,
    desktopTapThreshold: 4,
    autolock: false,
    autoungrabify: false,
    autounselectify: false,

    
    headless: false,
    styleEnabled: true,
    hideEdgesOnViewport: false,
    textureOnViewport: false,
    motionBlur: false,
    motionBlurOpacity: 0.2,
    pixelRatio: 'auto'
});
let startNode;
let endNode;
let nodeIndex = 0;

let randomConfig = {
    name: 'random',
    fit: true, 
    padding: 50, 
    boundingBox: undefined, 
    animate: true, 
    animationDuration: 500, 
    animationEasing: undefined, 
    animateFilter: function (node, i) {
        return true;
    }, 
    transform: function (node, position) {
        return position;
    } 
};


function layoutGraph() {
    cy.layout(options).run();
}

function randomizeGraph() {
    cy.layout(optionsRandom).run();
}

function fitGraphToScreen() {
    cy.fit(50);
}

function setAsStartNode(node) {
    if (node.length === 0) {
        alert('Please Select a Node')
    } else if (node.same(endNode)) {
        alert('You cant set Start and End to the Same Node')
    } else {

        if (typeof startNode !== 'undefined') {
            startNode.removeClass('startNode');
        }
        startNode = node;
        startNode.addClass('startNode');
    }
}

function setAsEndNode(node) {
    if (node.length === 0) {
        alert('Please Select a Node')
    } else if (node.same(startNode)) {
        alert('You cant set Start and End to the Same Node')
    } else {
        if (typeof endNode !== 'undefined') {
            endNode.removeClass('endNode');
        }
        endNode = node;
        endNode.addClass('endNode');
    }
}

function addACONode() {
    let extent = cy.extent();
    let nodeX = Math.random() * (extent['x2'] - extent['x1']) + extent['x1'];
    let nodeY = Math.random() * (extent['y2'] - extent['y1']) + extent['y1'];
    let node = cy.add({
        group: 'nodes',
        position: {x: nodeX, y: nodeY},
        data: {
            id: 'N' + nodeIndex
        }
    });
    nodeIndex++;
    connectNodeToNetwork(node);
}

function connectNodeToNetwork(node) {
    for (let i = 0; i < cy.nodes().length - 1; i++) {
        if (node !== cy.nodes()[i]) {
            let edge = cy.add({
                group: 'edges',
                data: {source: node.id(), target: cy.nodes()[i].id(), pheromoneCount: 1}
            });
        }
    }
}

function removeACONode() {
    cy.remove(cy.nodes().last())
}

function routeToString(route) {
    let routeString = route.map(function (ele) {
        return " " + ele.id();
    });

    console.log(routeString);
    return routeString;
}

class AntColony {
    constructor() {
        this.evaporation = document.getElementById('evapSlider').value / 100;
        this.Q = document.getElementById('q').value;
        this.alpha = document.getElementById('alpha').value;
        this.beta = document.getElementById('beta').value;
        this.targetPopSize = document.getElementById('population').value;
        this.curIteration = 0;
        this.maxIterations = 10;
        this.bestSolution = null;
        this.bestSolutionLength = null;
        this.population = [];
        this.randomFactor = 0.01;
        this.timesResultChanged = 0;
        this.autoInterval = null;
    }

    randomSolution() {
        let route = cy.collection();
        route.push(cy.nodes()[Math.floor(Math.random() * cy.nodes().length)])
        while (!route.same(cy.nodes())) {
            let edges = route[route.length - 1].connectedEdges();
            let targets = edges.connectedNodes();
            let chosenNode = targets[Math.floor(Math.random() * targets.length)];
            if (!route.includes(chosenNode)) {
                route.push(chosenNode);
            }
        }
        route.push(route.first());
        return route;
    }

    
    initPopulation() {
        this.population = []
        for (let i = 0; i < this.targetPopSize; i++) {
            this.population.push(new Ant());
        }
    }

    
    updateBest() {
        
        if (this.bestSolution === null) {
            this.bestSolution = this.randomSolution();
            this.bestSolutionLength = calcRouteLength(this.bestSolution);
            document.getElementById('curBest').innerHTML = routeToString(this.bestSolution) + ' (Initial Random Result)';
            document.getElementById('curBestLength').innerHTML = this.bestSolutionLength + ' (Initial Random Result)';
            document.getElementById('resultChangedCount').innerHTML = '0';
        } else {
            for (const a of this.population) {
                
                if (calcRouteLength(a.route) < this.bestSolutionLength || a.route.length !== this.bestSolution.length) {
                    this.bestSolution.first().removeClass('startNode');
                    this.bestSolution = a.route.slice();
                    this.bestSolutionLength = calcRouteLength(a.route);
                    this.timesResultChanged++;
                    document.getElementById('curBest').innerHTML = routeToString(this.bestSolution);
                    document.getElementById('curBestLength').innerHTML = this.bestSolutionLength;
                    document.getElementById('resultChangedCount').innerHTML = this.timesResultChanged;
                    appendRouteTable(this.bestSolution, this.bestSolutionLength, this.curIteration);
                    this.bestSolution.first().addClass('startNode');
                }

            }
        }
    }

    
    updatePheromones() {
        let edges = cy.edges();
        let pheromones = new Array(edges.length);
        let contribution = new Array(edges.length);
        contribution.fill(0);
        pheromones.fill(0);
        console.log(pheromones);
        console.log(contribution);
        for (let i = 0; i < edges.length; i++) {
            pheromones[i] = edges[i].data('pheromoneCount');
        }
        
        cy.batch(function () {
            for (let i = 0; i < edges.length; i++) {
                edges[i].data('pheromoneCount', edges[i].data('pheromoneCount') * (1 - this.evaporation));
            }
        }.bind(this));
       
        for (let i = 0; i < this.population.length; i++) {
            let a = this.population[i];
           
            let antContribution = this.Q / calcRouteLength(a.routeEdges.connectedNodes())
            cy.batch(function () {
                for (let j = 0; j < a.routeEdges.length; j++) {
                    let element = a.routeEdges[j];
                    
                    element.data('pheromoneCount', Math.max(element.data('pheromoneCount') + antContribution), 1);
                    

                }
            }.bind(this));
            
        }
        console.log("New Pheromones:")
        console.log(pheromones)
        console.log(contribution)
        
    }


    
    initializeACO() {
        console.log("Initializing population...");
        this.initPopulation();
        console.log("Updating best solution...");
        this.updateBest();
        resetPheromoneTrails();
        
        cy.on('position', function (event) {
            
            antColony.bestSolutionLength = calcRouteLength(antColony.bestSolution);
            document.getElementById("curBestLength").innerHTML = antColony.bestSolutionLength;
        });

    }

    doIteration() {
        document.getElementById('curIteration').innerHTML = this.curIteration;
        this.initPopulation();
        this.moveAnts();
        this.updatePheromones();
        this.updateBest()
        console.log("Starting Algorithm...")
        console.log("Best tour length: " + this.bestSolutionLength);
        console.log("Best Solution: " + routeToString(this.bestSolution));
        this.curIteration++;
    }

    
    moveAnts() {
        for (const a of this.population) {
            while (a.routeEdges.connectedNodes().length < cy.nodes().length) {
                console.log("Current Node of Ant:");
                console.log(a.currentNode);
                a.visitEdge(a.chooseNextEdge());
            }
            
            let edgeBackToStart = a.route.last().edgesWith(a.route.first())
            
            a.visitEdge(edgeBackToStart);
            console.log('Calculated Route:')
            console.log(a.routeEdges);
            console.log('Route Length: ' + calcRouteLength(a.routeEdges.connectedNodes()))
        }
    }

    
    toggleAutoIteration() {
        let checkbox = document.getElementById("autoIterationBox");
        if (checkbox.checked) {
            this.autoInterval = setInterval(this.doIteration.bind(antColony), 1500);
        } else {
            clearInterval(this.autoInterval);
        }
    }

}

function calcDistanceBetweenPoints(point1, point2) {
    let a = point1.position('x') - point2.position('x')
    let b = point1.position('y') - point2.position('y')
    return Math.sqrt(a * a + b * b);
}


function resetPheromoneTrails() {
    let edges = cy.edges();
    for (let i = 0; i < edges.length; i++) {
        edges[i].data('pheromoneCount', 1)
    }
}

function calcRouteLength(route) {
    let routeLength = 0;
    for (let i = 0; i < route.length - 1; i++) {
        routeLength += calcDistanceBetweenPoints(route[i], route[i + 1])
    }
    return routeLength;
}

function resetACO() {
    document.getElementById('autoIterationBox').checked = false;
    clearInterval(antColony.autoInterval);
    antColony = new AntColony();
    antColony.initializeACO();
    document.getElementById('curIteration').innerText = "0";
    resetTable();
}

function appendRouteTable(route, routeLength, iteration) {
    let table = document.getElementById('table');
    let tbody = table.getElementsByTagName('tbody')[0];
    let newRow = tbody.insertRow();
    let newCell = newRow.insertCell();
    let newText = document.createTextNode(iteration);
    newCell.appendChild(newText);
    let newCell2 = newRow.insertCell(1);
    let newText2 = document.createTextNode(routeToString(route));
    newCell2.appendChild(newText2);
    let newCell3 = newRow.insertCell(2);
    let newText3 = document.createTextNode(routeLength);
    newCell3.appendChild(newText3);
}

function resetTable() {
    let table = document.getElementById('table');
    let tbody = table.getElementsByTagName('tbody')[0];
    let newTBody = document.createElement('tbody');
    table.replaceChild(newTBody, tbody);
}

function updateEvap(value) {
    antColony.evaporation = value / 100;
    document.getElementById('evapLabel').innerHTML = value + '%';
}

let antColony = null;
document.addEventListener('DOMContentLoaded', function () {
    antColony = new AntColony();
    antColony.initializeACO();
})
