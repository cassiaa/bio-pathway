//Styling variables
var width = $(window).width()-15;
var height = $(window).height()-15;
var box_x_margin = 100;
var box_y_margin = 30;
var box_w = 100;
var box_h = 50;
var margin_left = 30;
var margin_top = 30;

//all data retrieved from csv files
var links = [];
var nodes = [];

//Append an SVG to document body
var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "svg")
            .attr("style", "background:#EFEFEF");

//Get data from the files
d3.csv("nodes.csv", function (error1, data1) {
    d3.csv("links.csv", function (error2, data2) {
        
        //Throw error if data not found or something else
        if (error1 || error2) {
            throw error;
        }

        //Input: nodes.csv
        //Output: nodes array filled with info from nodes.csv
        data1.forEach(function (d) {
            var temp = {
                protein: d.protein,
                col: parseInt(d.col),
                row: parseInt(d.row)
            };
        
            nodes.push(temp);
        })

        console.log(nodes);
    
        //Input: links.csv
        //Output: links array filled w link info from links.csv
        data2.forEach (function (d) {
            var temp = {
                protein1: d.protein1,
                weight1: parseFloat(d.weight1),
                protein2: d.protein2,
                weight2: parseFloat(d.weight2)
            };
        
            links.push(temp);
        })

        
        //Draw node rectangles
        var boxes = svg.selectAll("rect")
                .data(nodes)
                .enter()
                .append("rect")
                .attr("x", function (d) {
                    console.log("drawing box");
                    return (d.col * (box_w + box_x_margin)+margin_left);
                })
                .attr("y", function (d, i) {
                    return (d.row * (box_h + box_y_margin)+margin_top);
                })
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("width", box_w)
                .attr("height", box_h)
                .style("fill", "#FFFFFF")
                .style("stroke", "darkgray");
        
        //Text for nodes
        var box_text = svg.selectAll("text")
                .data(nodes)
                .enter()
                .append("text")
                .attr("x", function (d) {
                    return (d.col * (box_w + box_x_margin) + 20 + margin_left);
                })
                .attr("y", function (d) {
                    return (d.row * (box_h + box_y_margin) + box_h/2 + margin_top);
                })
                .text(function (d) {
                    return d.protein;
                })
                .style("font-size", "12px")
                .style("font-family", "Arial");
        
        //Straight line links between nodes
        var lines = svg.selectAll("line")
                .data(links)
                .enter()
                .append("line")
                .attr("x1", function (d) {
                    var idx_in = find_protein(d.protein1);
                    return (nodes[idx_in].col * (box_w+box_x_margin) + margin_left +box_w);
                })
                .attr("y1", function (d) {
                    var idx_in = find_protein(d.protein1);
                    return (nodes[idx_in].row*(box_h+box_y_margin) + margin_top+(box_h/2));
                })
                .attr("x2", function (d) {
                    var idx_out = find_protein(d.protein2);
                    return (nodes[idx_out].col * (box_w+box_x_margin) + margin_left);
                })
                .attr("y2", function (d) {
                    var idx_out = find_protein(d.protein2);
                    return (nodes[idx_out].row*(box_h+box_y_margin)+margin_top+(box_h/2));
                })
                .attr("stroke", "#000000");
        
    });
});
    
//Input: Protein name (from links array)
//Output: Index of that protein in the nodes array
function find_protein (protein) {

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].protein == protein) {
            return i;
        }
    }
    
    return -1;
}



// // CODE FOR IMMEDIATE SVG LOAD--------------------------------------------
// d3.xml("KRAS_ELK1_v7_time2.svg").mimeType("image/svg+xml").get(function(error, xml) {
//     if (error) throw error;
//     document.body.appendChild(xml.documentElement);
// });