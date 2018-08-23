//padding from edge of svg canvas to where diagram starts
var padding_left = 50;
var padding_top = 50;

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
var atlas = [];

//column with the most nodes (i.e., highest number of rows in a column)
var longest_col = 0;
var most_rows = 0;

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
        d3.csv("atlas.csv", function (error3, data3) {
        
        //Throw error if data not found or something else
        if (error1 || error2 || error3) {
            throw error;
        }

        data3.forEach (function (d) {
            var temp = {
                justify: parseInt(d.justify)
            };

            atlas.push(temp);
        })

        //Input: nodes.csv
        //Output: nodes array filled with info from nodes.csv
        data1.forEach(function (d) {
            var temp = {
                protein: d.protein,
                col: parseFloat(d.col),
                row: parseFloat(d.row)
            };
        
            nodes.push(temp);

            //update most_rows and longest_col if current one is higher
            if (temp.row > most_rows) {
                most_rows = temp.row;
                longest_col = temp.col;
            }
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

        //Check if nodes need to be shifted based on what was uploaded for justify
        //0 = top weighted
        //1 = center weighted
        if (atlas[0].justify == 1) {

            reconfigure_alignment();
            
        }

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
                    return (d.col * (box_w + box_x_margin) + 13 + padding_left);
                })
                .attr("y", function (d) {
                    return (d.row * (box_h + box_y_margin) + box_h/2 + 5 + padding_top);
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
                .attr("stroke", "#000000")
                ;

            }); 
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

function reconfigure_alignment() {
    
    var longest_col_length = find_col_length(longest_col);
 
    //midpoint of the longest column (mpl)
    var mpl = (longest_col_length - 1) / 2;
    console.log("midpoint of longest col = " + mpl);
    
    //For each remaining column: 
        //Find midpoint of curr_col
        //shift = mid_longest - mid_current
        //Add shift to every row value for that column

    
}

//takes a column index and finds the length of it
function find_col_length (column) {
    
    //index in the nodes array where column starts
    var col_start;
    var col_end;
    var col_length;
    
    //iterate through nodes array until you find the 
    //index of the first node of the column
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].col == column) {
            col_start = i;
            console.log("col_start = " + col_start);
            break;
        }
    }

    //find the index of the last node in the column
    for (var i = col_start; i < nodes.length; i++) {
        //stop searching through array once we are not looking at the same column
        if (nodes[i].col != column) {
            break;
        }

        col_end = i;
    }

    console.log("col_end = " + col_end);

    //calculate length of the column
    col_length = col_end - col_start + 1;
    console.log("col_length = " + col_length);

    return col_length;
}

// // CODE FOR IMMEDIATE SVG LOAD--------------------------------------------
// d3.xml("KRAS_ELK1_v7_time2.svg").mimeType("image/svg+xml").get(function(error, xml) {
//     if (error) throw error;
//     document.body.appendChild(xml.documentElement);
// });