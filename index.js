//padding from edge of svg canvas to where diagram starts
var padding_left = 100;
var padding_top = 100;

//size of svg
var width = $(window).width()-15;
var height = $(window).height()-15;

//margin between boxes
var box_x_margin = 100;
var box_y_margin = 30;

//size of boxes
var box_w = 100;
var box_h = 30;


//all data retrieved from csv files and will fill these arrays
var links = [];
var nodes = [];

//Append an SVG to document body
var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "svg")
            .attr("style", "background:#EFEFEF");

//Get data from the files and put into arrays links and nodes, respectively
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

        //Reconfigure the distance between boxes to fit the data
        reconfigure_col_space();
        reconfigure_row_space();
        
        //Draw node rectangles
        var boxes = svg.selectAll("rect")
                .data(nodes)
                .enter()
                .append("rect")
                .attr("x", function (d) {
                    console.log("drawing box");
                    return (d.col * (box_w + box_x_margin)+padding_left);
                })
                .attr("y", function (d, i) {
                    return (d.row * (box_h + box_y_margin)+padding_top);
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
                    return (d.col * (box_w + box_x_margin) + 20 + padding_left);
                })
                .attr("y", function (d) {
                    return (d.row * (box_h + box_y_margin) + box_h/2 + padding_top);
                })
                .text(function (d) {
                    return d.protein;
                })
                .style("font-size", "12px")
                .style("font-family", "Arial");
        
        //Straight line links between nodes
        // var lines = svg.selectAll("line")
        //         .data(links)
        //         .enter()
        //         .append("line")
        //         .attr("x1", function (d) {
        //             var idx_in = find_protein(d.protein1);
        //             return (nodes[idx_in].col * (box_w+box_x_margin) + padding_left +box_w);
        //         })
        //         .attr("y1", function (d) {
        //             var idx_in = find_protein(d.protein1);
        //             return (nodes[idx_in].row*(box_h+box_y_margin) + padding_top+(box_h/2));
        //         })
        //         .attr("x2", function (d) {
        //             var idx_out = find_protein(d.protein2);
        //             return (nodes[idx_out].col * (box_w+box_x_margin) + padding_left);
        //         })
        //         .attr("y2", function (d) {
        //             var idx_out = find_protein(d.protein2);
        //             return (nodes[idx_out].row*(box_h+box_y_margin)+padding_top+(box_h/2));
        //         })
        //         .attr("stroke", "#000000");

        //Create bezier curves from start to end nodes
        //Created with help from: https://bl.ocks.org/PerterB/3ace54f8a5584f51f9d8
        var cubic_lines = svg.selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("d", function (d, i) {
                    var idx_in = find_protein(d.protein1);
                    var idx_out = find_protein(d.protein2);
                    var startx = nodes[idx_in].col * (box_w+box_x_margin) + padding_left + box_w;
                    var starty = nodes[idx_in].row*(box_h+box_y_margin) + padding_top+(box_h/2);
                    var endx = nodes[idx_out].col * (box_w+box_x_margin) + padding_left;
                    var endy = nodes[idx_out].row*(box_h+box_y_margin)+padding_top+(box_h/2);

                    return get_cubic_path ([startx, starty], [endx, endy]);
                })
                .attr("fill", "none")
                .attr("stroke", "#000000");

        
    });
});

function get_cubic_path (start, end) {
    var x0 = start[0],
        y0 = start[1],

        x1 = end[0],
        y1 = end[1],

        xi = d3.interpolateNumber(x0, x1),
        
        x2 = xi(0.5),
        y2 = y0, 

        x3 = x2, 
        y3 = y1;        

        //Mx0,y0 Cx2,y2 x3,y3 x1,y1
    return "M" + x0 + "," + y0 + 
           " C" + x2 + "," + y2 + " " + 
                x3 + "," + y3 + " " +
                x1 + "," + y1;
}
    
//Input: Protein name (from links array)
//Output: Returns index of that protein in the nodes array or -1 if not found
function find_protein (protein) {

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].protein == protein) {
            return i;
        }
    }
    
    return -1;
}

//CAN PROBABLY BE REPLACED W D3.LINEAR.SCALE

//resets box_y_margin (space between rows) to fit all nodes in one column
function reconfigure_row_space() {
    var num_rows = find_max_row();
    var used_space = (padding_top*2) + (box_h * num_rows) + 30;
    box_y_margin = (height - used_space) / (num_rows-1);
}

//resets box_x_margin (space between cols) to fit all nodes in one row
function reconfigure_col_space() {
    var num_cols = find_max_col();
    var used_space = (padding_left*2) + (box_w * num_cols) + 30;
    box_x_margin = (width - used_space) / (num_cols-1);
}

//Input: none (uses global nodes array)
//Output: returns the maximum number of rows the given dataset may have 
function find_max_row () {
    var max = 0;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].row > max) {
            max = nodes[i].row;
        }
    }

    //+1 because rows are 0-indexed
    return max + 1;
}

//Input: none (uses global nodes array)
//Output: returns the maximum number of columns the given dataset may have 
function find_max_col() {
    var max = 0;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].col > max) {
            max = nodes[i].col;
        }
    }

    //+1 because columns are 0-indexed
    return max + 1;
}

// // CODE FOR IMMEDIATE SVG LOAD--------------------------------------------
// d3.xml("KRAS_ELK1_v7_time2.svg").mimeType("image/svg+xml").get(function(error, xml) {
//     if (error) throw error;
//     document.body.appendChild(xml.documentElement);
// });