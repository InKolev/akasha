
function RevealTheNetwork() {

    var radius = 25;
    var width = 1000, height = 600;
    var svg = d3.select("#network-container").append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("overflow", "hidden");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
        .force("link", d3
            .forceLink()
            .id(function (d) { return d.id; })
            .distance(function (d) { return d.distance; }))
        .force("charge", d3
            .forceManyBody()
            .strength(-125))
        .force("center", d3
            .forceCenter(width / 2, height / 2))
        .force('collision', d3
            .forceCollide()
            .radius(function (d) { return d.radius * 2; }));

    d3.json("network.json", function (error, graph) {
        if (error) throw error;

        var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke-width", function (d) { return Math.sqrt(d.value); });

        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("image")
            .data(graph.nodes)
            .enter().append("image")
            .attr("xlink:href", function (d) {
                return d.img;
            })
            .attr("width", 48)
            .attr("height", 48)
            .attr("x", -25)
            .attr("y", -25)
            .attr("r", radius)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("title")
            .text(function (d) { return d.id; });

        simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(graph.links);

        function ticked() {
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            // Allow image nodes to be rendered properly.
            node
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            // Prevent nodes from leaping out of bounds. Makes the nodes stay only inside the canvas.
            node
                .attr("cx", function (d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
                .attr("cy", function (d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
        }
    });

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

}