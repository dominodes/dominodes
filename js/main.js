var selectedCell = null;

// TODO: DEPRECATE
var selectedInput = null;
var selectedOutput = null;

var cellTemplate = $('#cell-template').html();
Mustache.parse(cellTemplate);

function createCell(x,y,color){
	/*
	Creates a cell and adds it to the graph.
	Selects the created cell.
	 */
	var ID = addNode();
	var data = {
		"label" : nodes[ID].label,
		"value" : '-',
		"color" : 'grey'
	};

	var rendered = Mustache.render(cellTemplate, data);
	var cell = $(rendered).draggable({snap:true, containment: "parent"})
		.bind('drag', onCellDragged)
		.attr("id", ID)
		.css("top", y)
		.css("left", x)
		.dblclick(onCellDblClick)
		.click(onCellClick);
	$(".wrapper").append(cell);
	selectCell(cell.get(0));
	$("#label").focus();
	$("#label").select();
}

function onCellDragged(event, ui){
	/*
	Updates the edges between nodes when one node is dragged.
	 */
	var id = event.currentTarget.id;
	selectCell(event.currentTarget);
	$("#formulaInput").focus();
	var offset = ui.offset;
	var cellWidth = parseInt($("#"+id).css("width").split("px")[0]);
	var cellHeight = parseInt($("#"+id).css("height").split("px")[0]);
	for(var i=0; i<nodes[id].inputs.length;i++){
		var pathid = nodes[id].inputs[i]+id;
		var path = document.getElementById(pathid);
		var ds = path.getAttribute("d").split(" ");
		ds[1] = "C"+((offset.left+parseInt(ds[0].split("M")[1].split(",")[0]))/2)+","+ds[1].split(",")[1];
		ds[2] = ((offset.left+parseInt(ds[0].split("M")[1].split(",")[0]))/2)+","+(offset.top+cellHeight/2);
		ds[3] = offset.left+","+(offset.top+cellHeight/2);
		path.setAttribute('d',ds.join(" "));
	}
	for(var i=0; i<nodes[id].outputs.length;i++){
		var pathid = id+nodes[id].outputs[i];
		var path = document.getElementById(pathid);
		var ds = path.getAttribute("d").split(" ");
		ds[0] = "M"+(offset.left+cellWidth)+","+(offset.top+cellHeight/2);
		ds[1] = "C"+((offset.left+cellWidth+parseInt(ds[3].split(",")[0]))/2)+","+(offset.top+cellHeight/2);
		ds[2] = ((offset.left+cellWidth+parseInt(ds[3].split(",")[0]))/2)+","+ds[2].split(",")[1];
		path.setAttribute('d',ds.join(" "));
	}
}

function setSelectedColor(color){
	/*
	Changes the color of the selected cell to the given color.
	 */
	if(selectedCell){
		clearSelectedColor();
		selectedCell.classList.add(color);
		setColor(selectedCell.id,color);
	}
}

function clearSelectedColor(){
	/*
	Removes every color class from the selected cell.
	 */
	if(selectedCell){
		selectedCell.classList.remove('blue');
		selectedCell.classList.remove('teal');
		selectedCell.classList.remove('green');
		selectedCell.classList.remove('yellow');
		selectedCell.classList.remove('orange');
		selectedCell.classList.remove('red');
		selectedCell.classList.remove('pink');
		selectedCell.classList.remove('grey');
	}
}

function onInputClicked(element){
	/*
	Connects the clicked cell to the previously clicked output cell.
	TODO: DEPRECATE
	 */
	selectedInput = element.parentNode.id;
	if(nodes[selectedOutput].outputs.indexOf(selectedInput) !== -1){
		nodes[selectedInput].inputs.splice(nodes[selectedInput].inputs.indexOf(selectedOutput),1);
		nodes[selectedOutput].outputs.splice(nodes[selectedOutput].outputs.indexOf(selectedInput),1);
		$("#"+selectedOutput+selectedInput).remove();
		delete edges[selectedOutput+selectedInput];
	}
	else if(selectedOutput!==selectedInput){
		addInput(selectedInput,selectedOutput);
		addOutput(selectedOutput,selectedInput);
		var cellHeight = parseInt($("#"+selectedInput).css('height').split(".")[0]);
		var cellWidth = parseInt($("#"+selectedInput).css('width').split(".")[0]);
		var inOff = $("#"+selectedInput).offset();
		var outOff = $("#"+selectedOutput).offset();
		var outX = outOff.left+cellWidth;
		var outY = outOff.top+cellHeight/2;
		var inX = inOff.left;
		var inY = inOff.top+cellHeight/2;
		var diff= (inX-outX)/2;
		var dstr = "M"+outX+","+outY+" C"+(outX+diff)+","+outY+" "+(inX-diff)+","+inY+" "+inX+","+inY;
		var path = "<path id=\""+selectedOutput+selectedInput+"\" d=\""+dstr+"\" />";
		var edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
		edge.setAttribute('d',dstr);
		edge.setAttribute('id',selectedOutput+selectedInput);
		$("#edgesSvg").append(edge);
		refreshGraph();
	}
	selectedInput = null;
	selectedOutput = null;
}

function onOutputClicked(element){
	/*
	Sets the current cell as the selected ouput cell.
	TODO: DEPRECATE
	 */
	selectedInput = null;
	selectedOutput = element.parentNode.id;
}

function onCellClick(e){
	/*
	Selects the clicked cell.
	Focuses the formula input box.
	 */
	selectCell(e.currentTarget);
	$("#formulaInput").focus();
	e.stopPropagation();
}

function onCellDblClick(e){
	/*
	Stops the event from bubbling to prevent new cell from being created.
	 */
	e.stopPropagation();
}

function selectCell(cell){
	/*
	Sets the selected cell as the given cell.
	Adds the selected class to the given cell.
	Loads the sidebar for the given cell.
	 */
	if(selectedCell){
		selectedCell.classList.remove("selected");
	}
	cell.classList.add("selected");
	selectedCell = cell;
	loadSideBar(selectedCell.id);
}

function unselectCell(){
	/*
	Removes the selected class from the current selected cell.
	 */
	if(selectedCell){
		selectedCell.classList.remove("selected");
	}
}

function addToFormula(text){
	/*
	Inserts the given text into the formula input box at the cursor location.
	 */
	var cursorPos = document.getElementById("formulaInput").selectionStart;
	var id = selectedCell.id;
	var oldFormula = nodes[id].formula;
	var newFormula = oldFormula.substring(0,cursorPos)+text+oldFormula.substring(cursorPos);
	setFormula(id,newFormula);
	$("#formulaInput").val(newFormula);
	$("#formulaInput").focus();
}

function loadSideBar(id){
	/*
	Loads the sidebar info for the given cell id.
	TODO: DEPRECATE
	 */
	var label = nodes[id].label;
	var formula = nodes[id].formula;
	var inputs = nodes[id].inputs;
	$("#label").val(label);
	$("#formulaInput").val(formula);
	$("#inputsList").html("");
	for(var i=0; i<inputs.length; i++){
		var c = nodes[inputs[i]].color;
		var l = nodes[inputs[i]].label;
		$("#inputsList").append(
			"<li onclick=\"addToFormula('"+l+"')\" class=\""+c+"\">"+l+"</li>"
		);
	}
}

$("#label").keydown(function(e){
	/*
	Checks to see if the enter key is pressed, and then blurs the input.
	 */
	if(e.which == 13){
		e.stopPropagation();
		e.currentTarget.blur();
	}
});

$("#label").keyup(function(e){
	/*
	Sets the label of the selected cell every time the input changes.
	 */
	setLabel(selectedCell.id, $("#label").val());
});

$("#formulaInput").keydown(function(e){
	/*
	Checks to see if the enter key is pressed, and then blurs the input.
	 */
	if(e.which == 13){
		e.stopPropagation();
		e.currentTarget.blur();
	}
})

$("#formulaInput").keyup(function(e){
	/*
	Sets the formula of the currently selected cell to the value of the input.
	 */
	setFormula(selectedCell.id, $("#formulaInput").val());
});

$(".wrapper").dblclick(function(e){
	/*
	Creates a cell at the location that was double clicked.
	Note:
		If a cell was double clicked, the event is stopped before this is run.
	 */
	createCell(e.pageX - 150,e.pageY - 30);
});

$(".wrapper").click(function(e){
	/*
	Unselects the currently selected cell if blank space is clicked.
	 */
	unselectCell();
});

$(document).keypress(function(e) {
	/*
	Checks to see if the enter key is pressed, and then blurs the input.
	Checks to see if the backspace key is pressed,
		and then deletes the currently selected cell.
	 */
	if(e.which == 13) {
 	 	e.stopPropagation();
 		window.blur();
	    unselectCell();
 	}
	if(e.which == 8 && selectedCell){
		e.stopPropagation();
		removeNode(selectedCell.id);
		window.blur();
	}
});
