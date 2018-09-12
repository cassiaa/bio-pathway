//GLOBAL VARIABLES-------------------------------------------------------------------

//padding from edge of svg canvas to where diagram starts
var padding_left = 50;
var padding_top = 50;

//size of sidebar
var sidebar_w = 200;
var sidebar_h = $(window).height()-15;

//size of svg
var width = $(window).width()-20-sidebar_w;
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

//variables retrieved from atlas file
var link_weight = 1;
var link_type = 1;
var link_color = "#000000";
var link_gradient = 0;
var node_bg_color = "#ffffff";
var node_bg_gradient = 0;
var node_r = 5;

$('#sidebar').height(sidebar_h);


//Append an SVG to document body
var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "svg")
            .attr("style", "background:#f4f4f4");

//Get data from the files and put into arrays links and nodes, respectively
d3.csv("nodes.csv", function (error1, data1) {
    d3.csv("links.csv", function (error2, data2) {
        d3.csv("atlas.csv", function (error3, data3) {
        
        //LOAD DATA------------------------------------------------------------------

        //Throw error if data not found or something else
        if (error1 || error2 || error3) {
            throw error;
        }

        data3.forEach (function (d) {
            var temp = {
                mod: d.mod,
                val: d.val
            };

            console.log(temp.val);
            atlas.push(temp);
        })

        console.log(atlas);

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
                protein2: d.protein2,
                weight: parseFloat(d.weight)
            };
        
            links.push(temp);
        })

        //UPDATE OPTIONS BASED ON ATLAS INPUTS & DATA---------------------------------
        for (var i = 0; i < atlas.length; i++) {
            
            var curr = atlas[i];
            
            //JUSTIFY: whether the nodes are weighted at the top or the center
            //0 = top-weighted
            //1 = center-weighted
            if (curr.mod === "justify") {
                if (curr.val == 1) {
                    reconfigure_alignment();
                }
            }

            //LINK_WEIGHT: determines the stroke-width of the link
            //val = how wide link is in px
            //1 : use default value
            //!1 : use link weights in link file
            if (curr.mod === "link_weight") {
                console.log("inside link_weight");
                link_weight = curr.val;
            }

            //LINK_TYPE: determines if straight lines or bezier curves used
            //0: straight lines
            //1: bezier curves (default)
            if (curr.mod === "link_type") {
                link_type = curr.val;
            }

            //LINK_COLOR: determines color of links between nodes
            //input is a hex value (default: #000000)
            if (curr.mod === "link_color") {
                link_color = curr.val;
            }

            //LINK_GRADIENT: determines if links will be solid or mapped to color gradient based on link wgt
            //0 : solid color (default)
            //1 : use gradient
            if (curr.mod == "link_gradient") {
                link_gradient = curr.val;
                console.log("gradient: " + link_gradient);
            }

            //NODE_BG_COLOR: hex code for background color of nodes
            if (curr.mod == "node_bg_color") {
                node_bg_color = curr.val;
            }

            //NODE_BG_GRADIENT: 
            //0: no gradient (solid)
            //!0: use a gradient
            if (curr.mod == "node_bg_gradient") {
                node_bg_gradient = curr.val;
            }

            //NODE_ROUNDEDNESS:
            //integer that specifies the radius of the node corners
            //default = 5
            if (curr.mod == "node_roundedness") {
                node_r = curr.val;
                console.log(node_r);
            }
        }

        //Reconfigure the distance between boxes to fit the data
        reconfigure_col_space();
        reconfigure_row_space();

        //DRAW SVG ELEMENTS---------------------------------------------------------
        
        //Straight line links between nodes
        /*
        var lines = svg.selectAll("line")
                .data(links)
                .enter()
                .append("line")
                .attr("x1", function (d) {
                    var idx_in = find_protein_idx(d.protein1);
                    return (nodes[idx_in].col * (box_w+box_x_margin) + padding_left +box_w);
                })
                .attr("y1", function (d) {
                    var idx_in = find_protein_idx(d.protein1);
                    return (nodes[idx_in].row*(box_h+box_y_margin) + padding_top+(box_h/2));
                })
                .attr("x2", function (d) {
                    var idx_out = find_protein_idx(d.protein2);
                    return (nodes[idx_out].col * (box_w+box_x_margin) + padding_left);
                })
                .attr("y2", function (d) {
                    var idx_out = find_protein_idx(d.protein2);
                    return (nodes[idx_out].row*(box_h+box_y_margin)+padding_top+(box_h/2));
                })
                .attr("stroke", "#000000");
                */
        //Create bezier curves from start to end nodes
        //Created with help from: https://bl.ocks.org/PerterB/3ace54f8a5584f51f9d8
       
        var cubic_lines = svg.selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("d", function (d) {
                    var idx_in = find_protein_idx(d.protein1);
                    var idx_out = find_protein_idx(d.protein2);
                    var startx = nodes[idx_in].col * (box_w+box_x_margin) + padding_left + box_w;
                    var starty = nodes[idx_in].row*(box_h+box_y_margin) + padding_top+(box_h/2);
                    var endx = nodes[idx_out].col * (box_w+box_x_margin) + padding_left;
                    var endy = nodes[idx_out].row*(box_h+box_y_margin)+padding_top+(box_h/2);

                    if (link_type == 0) {
                        //straight line
                        return get_straight_path([startx, starty], [endx, endy]);
                    } else {
                        return get_cubic_path ([startx, starty], [endx, endy]);
                    }
                    
                })
                .attr("fill", "none")
                .attr("stroke-width", function (d) {
                    if (link_weight == 1) {
                        return link_weight;
                    } else {
                        return Math.abs(d.weight) * 3;
                    }
                })
                .attr("stroke", function (d) {
                    if (link_gradient == 0) {
                        return (link_color);
                    
                    } else {

                        return find_rgb_scale(d.weight, "#000000", link_color);
                    }
                })
                .attr("opacity", 0.8)
                ;

        var node = svg.selectAll("g")
                .data(nodes)
                .enter()
                .append("g")
                .attr("transform", function (d) {
                    var pos_x = d.col * (box_w + box_x_margin)+padding_left;
                    var pos_y = d.row * (box_h + box_y_margin)+padding_top;

                    return "translate(" + pos_x + "," + pos_y + ")";
                })


        var boxes = node.append("rect")
                .attr("rx", node_r)
                .attr("ry", node_r)
                .attr("width", box_w)
                .attr("height", box_h)
                .style("fill", function (d) {
                    if (node_bg_gradient == 0) {
                        return node_bg_color;
                    } else {
                        var p_idx = find_weight_idx(d.protein);
                        var weight = links[p_idx].weight;
                        return find_rgb_scale(weight, "#ffffff", node_bg_color);
                    }
                })
                .style("stroke", "darkgray");     
                
        var box_text = node.append("text")
                .attr("x", 13)
                .attr("y", box_h/2 + 5)
                .text(function (d) {
                    return d.protein;
                })
                .style("font-size", "12px")
                .style("font-family", "Arial");

            });         

        //Draw node rectangles
       /* var boxes = node.selectAll("rect")
                .data(nodes)
                .enter()
                .append("rect")
                .attr("x", function (d) {
                    console.log("drawing box");
                    return (d.col * (box_w + box_x_margin)+padding_left);
                })
                .attr("y", function (d) {
                    return (d.row * (box_h + box_y_margin)+padding_top);
                })
                .attr("rx", node_roundedness)
                .attr("ry", node_roundedness)
                .attr("width", box_w)
                .attr("height", box_h)
                .style("fill", function (d) {
                    if (node_bg_gradient == 0) {
                        return node_bg_color;
                    } else {
                        console.log("d.protein = " + d.protein);
                        var p_idx = find_weight_idx(d.protein);
                        console.log("p_idx = " + p_idx);
                        var weight = links[p_idx].weight;
                        return find_rgb_scale(weight, "#ffffff", node_bg_color);
                    }
                })
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

            }); */
    });
});

//------------------------------------------------------------------------------------
// HELPER FUNCTIONS
//------------------------------------------------------------------------------------

function get_straight_path (start, end) {
    return "M" + start[0] + "," + start[1] +
            "L" + end[0] + "," + end[1];
}

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

//NODES -> LINKS
//Input: Protein name (from nodes array)
//Output: Returns index of that protein in links.protein2 array, -1 if not found
function find_weight_idx (protein) {
    for (var i = 0; i < links.length; i++) {
        if (links[i].protein2 == protein) {
            console.log("index of protein2 = " + i);
            return i;
        }
    }

    return -1;
}
    
//LINKS -> NODES
//Input: Protein name (from links array)
//Output: Returns index of that protein in the nodes array or -1 if not found
function find_protein_idx (protein) {

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

    var curr_col = -1;
    var shift;

    for (var i = 0; i < nodes.length; i++) {
        //skip if curr col == longest_col (bc already found longest col)
        if (curr_col == longest_col) {
            continue;
        }

        //reset when you get to a new column value
        //find a new shift value
        if (curr_col != nodes[i].col) {
            //set current column equal to this column
            curr_col = nodes[i].col;

            //find curr col length
            var col_length = find_col_length(curr_col);
            //find curr col midpoint
            var mpc = (col_length - 1) / 2;
            console.log("mp of curr col = " + mpc);
            shift = mpl - mpc;
        }

        //shift all row values for this column
        if (curr_col == nodes[i].col) {
            nodes[i].row += shift;
        }

        
    }
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

//returns an rgb string calculated by the interpolation of a weight btwn two colors
//Input: weight + two colors to interpolate between
//Output: rgb string calculated for interpolated weight value btwn color1 and color2
function find_rgb_scale (weight, color1, color2) {
    
    //calculate highest weight first
    var max = -1;
    for (var i = 0; i < links.length; i++) {
        if (Math.abs(links[i].weight) > max) {
            max = Math.abs(links[i].weight);
        }
    }

    var num_scale = d3.scaleLinear() 
    .domain([0,max])
    .range([0,1]);
    var num = num_scale(Math.abs(weight));
    var rgb = d3.interpolateRgb(color1, color2)(num);
    return rgb;
}

// // CODE FOR IMMEDIATE SVG LOAD--------------------------------------------
// d3.xml("KRAS_ELK1_v7_time2.svg").mimeType("image/svg+xml").get(function(error, xml) {
//     if (error) throw error;
//     document.body.appendChild(xml.documentElement);
// });