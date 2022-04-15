let canvas = document.getElementsByTagName('canvas')[0],
    ctx = canvas.getContext('2d'),

    // Colors
    colors = [
        '#EE34D2',
        '#C88A65',
        '#A50B5E',
        '#733380',
        '#87421F',
        '#ED0A3F',
        '#0095B7',
        '#33CC99',
        '#00468C',
        '#0066FF',
       
    ],

    distanceFunctions = {
        "Euclidean": euclidean,
        //fix this shit
        "Manhattan": manhattan
    },
    distance, // function (will be dynamically set)

    buttonAddPointsManually = document.getElementById('add-points-manually'),
    buttonAddPointsRandomly = document.getElementById('add-points-randomly'),
    buttonRemoveAllPoints = document.getElementById('remove-all-points'),

    buttonAddCentroidsManually = document.getElementById('add-centroids-manually'),
    buttonAddCentroidsRandomly = document.getElementById('add-centroids-randomly'),
    buttonRemoveAllCentroids = document.getElementById('remove-all-centroids'),

    
    buttonRun = document.getElementById('run-steps-in-loop'),

    inputAddPointsRandomlyCount = document.getElementById('add-data-points-randomly-count'),
    inputAddCentroidsRandomlyCount = document.getElementById('add-centroids-randomly-count'),
    inputRunMilliseconds = document.getElementById('run-steps-in-loop-milliseconds'),
    selectDistanceFunction = document.getElementById('distance-function');


canvas.addEventListener('click', (e) => addNewPoint(getPointClickedOnCanvas(e)), false);

buttonAddPointsManually.addEventListener('click', toggleAddingPointsManually, false);
buttonAddPointsRandomly.addEventListener('click', () => addPointsRandomly(+inputAddPointsRandomlyCount.value), false);
buttonRemoveAllPoints.addEventListener('click', removeAllPoints, false);

buttonAddCentroidsManually.addEventListener('click', toggleAddingCentroidsManually, false);
buttonAddCentroidsRandomly.addEventListener('click', () => addCentroidsRandomly(+inputAddCentroidsRandomlyCount.value), false);
buttonRemoveAllCentroids.addEventListener('click', removeAllCentroids, false);



buttonRun.addEventListener('click', run, false);

inputAddPointsRandomlyCount.addEventListener('keyup', (e) => ifEnterThenCall(e, () => buttonAddPointsRandomly.click()));
inputAddCentroidsRandomlyCount.addEventListener('keyup', (e) => ifEnterThenCall(e, () => buttonAddCentroidsRandomly.click()));
inputRunMilliseconds.addEventListener('keyup', (e) => ifEnterThenCall(e, restart));

fillDistanceFunctionSelect();
changeDistanceFunction();
selectDistanceFunction.addEventListener('change', changeDistanceFunction, false);


let Points = [],
    centroids = [],
    PointsAssignedCentroids = {}, 
    addingPointsManually = false,
    addingCentroidsManually = false,
    steps = [
        reassignPoints,
        updateCentroidsPositions
    ],
    currentStep,
    nextAfter,
    timeout,
    loopRunning = false;

function addNewPoint(point) {
    if (addingPointsManually) {
        Points.push(point);
        redrawAll();
    } else if (addingCentroidsManually) {
        if (tryAddNewCentroid(point)) {
            redrawAll();
        } else {
            showCentroidLimitReachedMessage();
            toggleAddingCentroidsManually();
        }
    }
}

function getPointClickedOnCanvas(e) {
    let canvasRect = canvas.getBoundingClientRect();
    return [
        e.clientX - canvasRect.left - 1,
        e.clientY - canvasRect.top - 1
    ];
};

function toggleAddingPointsManually() {
    if (addingCentroidsManually) {
        toggleAddingCentroidsManually();
    }
    addingPointsManually = !addingPointsManually;
    toggleButtonText(buttonAddPointsManually);
    updateCanvasStyles();
}

function addPointsRandomly(count) {
    for (let i = 0; i < count; ++i) {
        let newPoint;
        do {
            newPoint = [
                randInt(0, canvas.width - 1),
                randInt(0, canvas.height - 1)
            ];
        } while (newPoint in centroids);
        Points.push(newPoint);
    }
    redrawAll();
}

function removeAllPoints() {
    Points = [];
    PointsAssignedCentroids = {};
    redrawAll();
}

function toggleAddingCentroidsManually() {
    if (!addingCentroidsManually && isCentroidLimitReached()) {
        showCentroidLimitReachedMessage();
        return;
    }
    if (addingPointsManually) {
        toggleAddingPointsManually();
    }
    addingCentroidsManually = !addingCentroidsManually;
    toggleButtonText(buttonAddCentroidsManually);
    updateCanvasStyles();
}

function addCentroidsRandomly(count) {
    let limitReached = false;
    for (let i = 0; i < count; ++i) {
        let newPoint;
        do {
            newPoint = [
                randInt(0, canvas.width - 1),
                randInt(0, canvas.height - 1)
            ];
        } while (newPoint in centroids);
        if (!tryAddNewCentroid(newPoint)) {
            limitReached = true;
            break;
        }
    }
    redrawAll();
    if (limitReached) {
        showCentroidLimitReachedMessage();
    }
}

function removeAllCentroids() {
    centroids = [];
    PointsAssignedCentroids = {};
    redrawAll();
}

function reassignPoints() {
    Points.map((point, pointIndex) => {
        let smallestDistance = Number.MAX_SAFE_INTEGER,
            closestCentroidIndex = undefined;
        centroids.map((centroid, centroidIndex) => {
            let dist = distance(point, centroid);
            if (dist < smallestDistance) {
                smallestDistance = dist;
                closestCentroidIndex = centroidIndex;
            }
        });
        PointsAssignedCentroids[pointIndex] = closestCentroidIndex;
    });
    redrawAll();
}

function updateCentroidsPositions() {
    centroids.map((centroid, centroidIndex) => {
        let assignedPoints = Points.filter((_, pointIndex) => PointsAssignedCentroids[pointIndex] == centroidIndex),
            sumX = 0,
            sumY = 0;
        if (assignedPoints.length == 0)
            return;
        assignedPoints.map(([x, y]) => {
            sumX += x;
            sumY += y;
        });
        centroid[0] = sumX / assignedPoints.length;
        centroid[1] = sumY / assignedPoints.length;
    });
    redrawAll();
}

function run() {
    addCentroidsRandomly(+inputAddCentroidsRandomlyCount.value)
    toggleButtonText(buttonRun);
    if (!loopRunning) {
        loopRunning = true;
        currentStep = 0;
        nextAfter = +inputRunMilliseconds.value;
        if (isNaN(nextAfter) || nextAfter <= 0) {
            alert('Wrong value!');
            return;
        }
        enqueNextStep(0);
    } else {
        removeAllCentroids();
        clearTimeout(timeout);
        loopRunning = false;
    }
}

function ifEnterThenCall(e, func) {
    e.keyCode == 13 && func();
}

function restart() {
    if (loopRunning) {
        run();
        
    }
    run();
}

function euclidean(point1, point2) {
    return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2));
}

function manhattan(point1, point2) {
    return Math.abs(point1[0] - point2[0]) + Math.abs(point1[1] - point2[1]);
}

function fillDistanceFunctionSelect() {
    for (let name in distanceFunctions) {
        let option = document.createElement('option');
        option.value = option.innerHTML = name;
        selectDistanceFunction.appendChild(option);
    }
}

function changeDistanceFunction() {
    distance = distanceFunctions[selectDistanceFunction.value];
}

function redrawAll() {
    canvas.width = canvas.width;
    Points.map(drawPoint);
    centroids.map(drawCentroid);
}

function tryAddNewCentroid(point) {
    if (isCentroidLimitReached()) {
        return false;
    }
    centroids.push(point);
    return true;
}

function showCentroidLimitReachedMessage() {
    setTimeout(() => alert(`Sorry, reached limit of ${colors.length} colors.`), 50);
}

function toggleButtonText(button) {
    let currentText = button.innerHTML;
    button.innerHTML = button.getAttribute('data-toggle');
    button.setAttribute('data-toggle', currentText);
}

function updateCanvasStyles() {
    if (addingPointsManually || addingCentroidsManually) {
        canvas.classList.add('canvas-picking-active');
    } else {
        canvas.classList.remove('canvas-picking-active');
    }
}

function randInt(min, max) {
    if (arguments.length == 1) {
        max = arguments[0];
        min = 0;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isCentroidLimitReached() {
    return centroids.length >= colors.length;
}

function enqueNextStep(overrideAfter) {
    let delay = overrideAfter != undefined ? overrideAfter : nextAfter;
    timeout = setTimeout(() => {
        steps[currentStep]();
        currentStep = (currentStep + 1) % steps.length;
        enqueNextStep();
    }, delay);
}

function drawPoint([x, y], index) {
    ctx.save();
        ctx.fillStyle = colors[PointsAssignedCentroids[index]];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    ctx.restore();
}

function drawCentroid([x, y], index) {
    ctx.save()
        ctx.strokeStyle = ctx.fillStyle = colors[index];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.save();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
    ctx.restore();
}
