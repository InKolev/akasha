var isNetworkRendered = false;

function RevealTheNetwork() {

    if (isNetworkRendered) return;

    var network = {
        "nodes": [
            {
                "id": "Ivan",
                "group": 1,
                "img": "avatars/Ivan.png"
            },
            {
                "id": "Nikolay Kolev",
                "group": 2,
                "img": "avatars/NikolayKolev.png"
            },
            {
                "id": "Nikolay Stoychev",
                "group": 3,
                "img": "avatars/Ivan.png"
            },
            {
                "id": "Nikolay Dobrev",
                "group": 4,
                "img": "avatars/NikolayDobrev.png"
            },
            {
                "id": "Ivan Papanov",
                "group": 5,
                "img": "avatars/NikolayDobrev.png"
            },
            {
                "id": "Dobromira Dobreva",
                "group": 6,
                "img": "avatars/DobromiraDobreva.png"
            }
        ],
        "links": [
            {
                "source": "Nikolay Stoychev",
                "target": "Nikolay Dobrev",
                "value": 20,
                "distance": 150
            },
            {
                "source": "Ivan",
                "target": "Ivan Papanov",
                "value": 20,
                "distance": 150
            },
            {
                "source": "Nikolay Stoychev",
                "target": "Ivan Papanov",
                "value": 30,
                "distance": 150
            },
            {
                "source": "Nikolay Stoychev",
                "target": "Nikolay Kolev",
                "value": 30,
                "distance": 150
            },
            {
                "source": "Nikolay Stoychev",
                "target": "Dobromira Dobreva",
                "value": 30,
                "distance": 150
            }
        ]
    };

    var targetDiv = document.getElementsByClassName("network-container")[0];

    var width = targetDiv.clientWidth;
    var height = targetDiv.clientHeight;

    var chart = ForceGraph(network,
        {
            nodeId: d => d.id,
            nodeGroup: d => d.group,
            nodeTitle: d => d.id,
            linkStrokeWidth: l => Math.sqrt(l.value),
            height: height,
            width: width,
            nodeRadius: 25
        });

    targetDiv.appendChild(chart);
    isNetworkRendered = true;
}

function ForceGraph({
    nodes, // an iterable of node objects (typically [{id}, …])
    links // an iterable of link objects (typically [{source, target}, …])
}, {
    nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
    nodeGroup, // given d in nodes, returns an (ordinal) value for color
    nodeGroups, // an array of ordinal values representing the node groups
    nodeTitle, // given d in nodes, a title string
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 5, // node radius, in pixels
    nodeStrength,
    linkSource = ({ source }) => source, // given d in links, returns a node identifier string
    linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
    linkStroke = "#999", // link stroke color
    linkStrokeOpacity = 0.6, // link stroke opacity
    linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
    linkStrokeLinecap = "round", // link stroke linecap
    linkStrength,
    colors = d3.schemeTableau10, // an array of color strings, for the node groups
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    invalidation // when this promise resolves, stop the simulation
} = {}) {
    // Compute values.
    const N = d3.map(nodes, nodeId).map(intern);
    const LS = d3.map(links, linkSource).map(intern);
    const LT = d3.map(links, linkTarget).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);


    // Replace the input nodes and links with mutable objects for the simulation.
    nodes = d3.map(nodes, (n, i) => ({ id: N[i], img: n.img }));
    links = d3.map(links, (l, i) => ({ source: LS[i], target: LT[i], distance: l.distance }));

    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

    // Construct the forces.
    const forceNode = d3.forceManyBody().strength(-125);
    const forceLink = d3.forceLink(links)
        .id(({ index: i }) => N[i])
        .distance(function (element) {
            return element.distance;
        });

    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);

    const simulation = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center", d3.forceCenter())
        .on("tick", ticked);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    const link = svg.append("g")
        .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        .attr("stroke-opacity", linkStrokeOpacity)
        .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
        .attr("stroke-linecap", linkStrokeLinecap)
        .selectAll("line")
        .data(links)
        .join("line");

    const node = svg.append("g")
        .attr("fill", nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth)
        .selectAll("image")
        .data(nodes)
        .enter().append("svg:image")
        .attr("xlink:href", function (d) {
            return d.img;
        })
        .attr("width", 48)
        .attr("height", 48)
        .attr("x", -25)
        .attr("y", -25)
        .join("image")
        .attr("r", nodeRadius)
        .call(drag(simulation));

    if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
    if (L) link.attr("stroke", ({ index: i }) => L[i]);
    if (G) node.attr("fill", ({ index: i }) => color(G[i]));
    if (T) node.append("title").text(({ index: i }) => T[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());

    function intern(value) {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // Allow image nodes to be rendered properly.
        node
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        // Prevent nodes from leaping out of bounds. Makes the nodes stay only inside the canvas.
        //node
        //    .attr("cx", function (d) { return d.x = Math.max(nodeRadius, Math.min(width - nodeRadius, d.x)); })
        //    .attr("cy", function (d) { return d.y = Math.max(nodeRadius, Math.min(height - nodeRadius, d.y)); });
    }

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return Object.assign(svg.node(), { scales: { color } });
}