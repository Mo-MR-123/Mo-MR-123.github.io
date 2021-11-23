// Parameters
const width		= 750;
const height		= 750;
const defaultScale = 8700;
const centerLat	= 5.5;	
const centerLon  	= 52.2;
const scaleMinExtent = 1; // default scale
const scaleMaxExtent = 8;
const clickZoomScale = 5; // the scale to zoom to when region on the map is clicked

const svg = d3.select("#d3-map")
    .append("svg")
	.attr("width", width)
	.attr("height", height);

// Append svg to body 
const g = svg.append("g");

// Adjust projection based on scale and center of the map 
const projection = d3.geoMercator()
    .center([centerLat, centerLon])     // GPS of location to zoom on
    .scale(defaultScale)                       // This is like the zoom
    .translate([ width/2, height/2 ])

// calculate geo path to be used for d tag in svg 
const path = d3.geoPath()
    .projection(projection)

// handle zooming into an area that has been clicked, with reset (reset zoom to initial default scale)
let active = d3.select(null);
function reset() {
    active = d3.select(null);

    svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity);
}
function mouseclicked(dataOfPath) {  
    if (active.node() === this) return reset();
    active = d3.select(this);

    var bounds = path.bounds(dataOfPath);
    var x = (bounds[0][0] + bounds[1][0]) / 2;
    var y = (bounds[0][1] + bounds[1][1]) / 2;
    var translate = [width / 2 - clickZoomScale * x, height / 2 - clickZoomScale * y];

    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(clickZoomScale));
}

function zoomFunction() {
    g.attr("transform", d3.event.transform);
}

// create zoom funcionality for panning and zooming on the map.
// call it on svg so that the zoom funcionality is used on the map.
const zoom = d3.zoom()
    .translateExtent([[0, 0], [width, height]])
    .scaleExtent([scaleMinExtent, scaleMaxExtent])
    .on("zoom", zoomFunction);
svg.call(zoom);

d3.helper = {};

d3.helper.tooltip = function(accessor){
    return function(selection){
        var tooltipDiv;
        var bodyNode = d3.select('body').node();

        selection.on("mouseover", function(d, i){
            d3.select(this)
            .transition(0)
            .style("stroke", "blue")
            .style("stroke-width", "2");

            // Clean up lost tooltips
            d3.select('body').selectAll('div.tooltip').remove();

            // Append tooltip
            tooltipDiv = d3.select('body').append('div').attr('class', 'tooltip');
            var absoluteMousePos = d3.mouse(bodyNode);
            tooltipDiv.style('left', (absoluteMousePos[0] + 10)+'px')
                .style('top', (absoluteMousePos[1] - 15)+'px')
                .style('position', 'absolute') 
                .style('z-index', 1001);
        })
        .on('mousemove', function(d, i) {
            // Move tooltip
            var absoluteMousePos = d3.mouse(bodyNode);
            tooltipDiv.style('left', (absoluteMousePos[0] + 10)+'px')
                .style('top', (absoluteMousePos[1] - 15)+'px');
            var tooltipText = accessor(d, i) || '';
            tooltipDiv.html(tooltipText);
        })
        .on("mouseout", function(d, i) {
            // Remove tooltip
            d3.select(this)
            .transition(0)
            .style("stroke", "black")
            .style("stroke-width", "1");
            
            tooltipDiv.remove();
        });
    };
};

function drawMap(data) {
    // Load the polygon data of the Netherlands and show it.
    g.selectAll("path")
    .data(data.mapData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .on("click", mouseclicked)
    .each(function(d) {
        d3.select(this).selectAll("path")
        .data(data.covidCumulativeDayData.filter(function(D) {
            return D.Municipality_name == d.properties.areaName
        }))
        .enter()
        .append("path")
        .attr("Total_reported", function(D) {
            return D.Total_reported
        })
        .attr("Hospital_admission", function(D) {
            return D.Hospital_admission
        })
        .attr("Deceased", function(D) {
            console.log(D.Deceased)
            return D.Deceased
        })
        // Tot hier klopt het wel. TODO: Figure out how to get covid attributes in the tooltip call below.
    })
    .call(d3.helper.tooltip(
        function(d) {
            return "<b>"+ d.properties.areaName + "</b>"
             + "\nTotal_reported: " + d.Total_reported + "\nHospital_admission: " + d.Hospital_admission
             + "\nDeceased: " + d.Deceased;
        }
    ));
}



