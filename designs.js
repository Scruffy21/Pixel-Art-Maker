const sizeForm = $("#sizePicker");
const myTable = $("table#pixel_canvas");
const primary_color = document.getElementById("primaryColorPicker");
const secondary_color = document.getElementById("secondaryColorPicker");
const eraser_color = document.getElementById("eraserColorPicker");
const fill_input = $("#fillColorPicker");
const reset_button = $("#resetCellsColor");
let isDown = false; // whether the mouse button is pressed
let log = []; // stores all the operations that take place on the grid, to allow users to undo/redo their actions
let myIndex = -5; //any number smaller than -1 would do. it's to keep track of where I am in the log array.
let reset = false; //for resetting myIndex when I make changes to the canvas
let undoRedoMode = false;
let tool = "first_pen";
let keys = {} //keys currently pressed
let undoInterval, redoInterval; //this is for undoing/redoing with the button quickly

//make grid when everything is ready. It seems there's no need to put anything else in the .ready method.
$(document).ready(makeGrid());

//creates the grid using user's input
function makeGrid() {
    let height = $("input#input_height").val();
    let width = $("input#input_width").val();
    for (let rowIndex = 0; rowIndex < width; rowIndex++) {
        let row = myTable[0].insertRow(rowIndex);
        for (let colIndex = 0; colIndex < width; colIndex++) {
            let cell = row.insertCell(colIndex);
            cell.classList.add("cellBorders");
        }
    }
}

//listener to open/close instructions
const instr = $(".instr-toggle")[0];
// console.log(instr);
// 

const instrCont = $(".instructions-cont")[0];
$(instr).click(function () {
    console.log("clicked");
    $(instrCont).toggleClass("instr-show");
});

// fills all cells with a color
function fillAll (color) {
    let allCells = $("#pixel_canvas td");
    allCells.css("background-color", color);
}

// for logging. use this to create an object when cell color changes. and store the object in log array.
function logCellChange(cell, prevColor, curColor) {
    reduceLog(); //checks if changes were made to the canvas after redoing actions. if so, deletes part of log array.
    this.type = "cellChange";
    this.row = $(cell).parent().index();
    this.column = $(cell).index();
    this.prevColor = prevColor;
    this.curColor = curColor;
}

//for logging. create object when fill action performed. and store the object in log array.
function logFill(prevhtml, fillColor) {
    reduceLog();
    this.type = "fill";
    this.fillColor = fillColor;
    this.prevhtml = prevhtml;
}

//when the user makes changes after undoing coloring, then a part of the log is discarded.
function reduceLog() {
    if (undoRedoMode && myIndex !== log.length -1) {
        let entriesToRemove = log.length - 1 - myIndex;
        log.splice(myIndex +1, entriesToRemove);
        undoRedoMode = false;
    }
}

//main undo function
function undo() {
    //stop the function when there is no more actions to undo
    if (myIndex < 0 && reset == false) {
        return false;
    }
    undoRedoMode = true;
    if (reset) {
        myIndex = log.length -1;
    }
    if (log[myIndex].type === "cellChange") {
        undoRedoCell(myIndex, "undo");
    }
    else if (log[myIndex].type === "fill") {
        undoRedoFill(myIndex, "undo");
    }
    else {
        console.log("something went wrong");
    }
    reset = false;
    myIndex -= 1;
}

//main redo function
function redo() {
    //check myIndex. if it's at the end (log.length - 1) then do nothing
    if (myIndex >= log.length -1 || myIndex < -1) {
        return false;
    }
    myIndex += 1;
    if (log[myIndex].type === "cellChange") {
        undoRedoCell(myIndex, "redo");
    }
    else if (log[myIndex].type === "fill") {
        undoRedoFill(myIndex, "redo");
    }   
    else {
        console.log("something went wrong");
    }
}

//helper for undoing/redoing coloring of one cell
//action can be "undo" or "redo"
function undoRedoCell(index, action) {
    let myObj = log[index];
    let rowIndex = myObj.row;
    let colIndex = myObj.column;
    let theRow = $("tbody").children("tr")[rowIndex];
    let myCell = $(theRow).children("td")[colIndex];
    if (action == "undo") {
        $(myCell).css("background-color", myObj.prevColor);
    }
    else if (action == "redo") {
        $(myCell).css("background-color", myObj.curColor);
    }
    else console.log("wrong action in undoRedoCell");
}

//helper for undoing and redoing the fillAll action
//action can be "undo" or "redo"
function undoRedoFill(index, action) {
    let myObj = log[index];
    if (action == "undo") {
        $(myTable).html(myObj.prevhtml);
    }
    else if (action == "redo") {
        fillAll(myObj.fillColor);
    }
    else {
        console.log("wrong action in undoRedoFill");
    }
}

//helper for hex to rgb conversion
//takes in a string in the format #xxyyzz
//won't work if shorthand hexColor provided
function toRgb(hexColor) {
    if (hexColor.length !== 7) {
        alert("wrong hexColor input format");
        return false;
    }
    let strippedString = hexColor.replace("#", "");
    let valueArr = [];
    let tempVal = ""
    for (let i = 0; i < 6; i++) {
        tempVal += strippedString.charAt(i);
        if (tempVal.length === 2) {
            valueArr.push(tempVal);
            tempVal = "";
        }
    }
    let rgbOutput = "rgb("
    for (let i = 0; i < 3; i++) {
        rgbOutput += parseInt((valueArr[i]), 16);
        (i !== 2) ? (rgbOutput += ", ") : (rgbOutput += ")");
    }
    return rgbOutput;
}

//helper for rgb to hex conversion. takes in a string in the format rgb(x, y, z)
//turns out I didn't need it..., so commenting it out
// function toHex(rgbColor) {
//         //gets array of values
//         let strippedArr = rgbColor.replace(/[(),]/g, "").replace("rgb", "").split(" ");
//         if (strippedArr.length !== 3) { 
//             alert("wrong rgb format provided");
//             return false;
//         }
//         let hexOutput = "#";
//         strippedArr.forEach(function(element){
//             hexOutput += Number(element).toString(16);
//         })
//         return hexOutput;
// }
    
sizeForm.submit(function(event) {
    event.preventDefault();
    $(myTable).html("");
    makeGrid();
    log = []; //resets log
    myIndex = -5; //resets current index in the log
});

//fill all cells with color
$("#fillButton").click( function() {
    fillColor = fill_input.val();
    eraser_color.value = fillColor;
    log.push(new logFill($("table").html(), fillColor));
    fillAll(fillColor);
    reset = true;
});

// reset cell colors button
$(reset_button).on("click", function() {
    log.push(new logFill($("table").html(), "white"));
    fillAll("#ffffff");
    reset = true;
});


$("#toggleGrid").on("click", function() {
    $("td").toggleClass("cellBorders");
});

$("#undoButton").on("pointerdown pointerup", function (e) {
    if (e.type === "pointerdown") {
        undoInterval = setInterval(undo, 10);
    }
    else {
        clearInterval(undoInterval);
    }
});

$("#redoButton").on("pointerdown pointerup", function (e) {
    if (e.type === "pointerdown") {
        redoInterval = setInterval(redo, 10);
    }
    else {
        clearInterval(redoInterval);
    }
});


//handling drawing
myTable.on("mousedown", "td", function(event) {
    event.preventDefault();
    reset = true;
    let cellToChange = event.target;
    // for logging of the old color of the cell
    let prevColor = $(cellToChange).css("background-color");
    switch (event.which) {
        case 1:
            isDown = true;
            if (keys["17"]) {         
                $(cellToChange).css("background-color", secondary_color.value);
                tool = "second_pen";
                //only log a color change if cell color changes.
                if (toRgb(secondary_color.value) !== prevColor) {
                    log.push(new logCellChange(cellToChange, prevColor, primary_color.value,));
                }
            }
            else {
                $(cellToChange).css("background-color", primary_color.value);
                tool = "first_pen";
                if (toRgb(primary_color.value) !== prevColor) {
                    log.push(new logCellChange(cellToChange, prevColor, primary_color.value,));
                }
            }
            break;
        case 3:
            isDown = true;
            $(cellToChange).css("background-color", eraser_color.value);
            tool = "eraser";
            if (toRgb(eraser_color.value) !== prevColor) {
                log.push(new logCellChange(cellToChange, prevColor, primary_color.value,));
            }
            break;
    }
});

$(window).on("mouseup", function(event) {
    isDown = false;
});

myTable.on("mouseenter", "td", function(event) {
    event.preventDefault();
    let cellToChange = event.target
    let prevColor = $(cellToChange).css("background-color");
    //this is just for ease of changing, so that no mouseup is needed to change between primary and secondary colors
    if (tool === "first_pen" && keys["17"]) {
        tool = "second_pen";
    }
    if (tool === "second_pen" && !keys.hasOwnProperty("17")) {
        tool = "first_pen";
    }
    if (isDown) {
        if (tool === "first_pen") {
            $(cellToChange).css("background-color", primary_color.value)
            if (toRgb(primary_color.value) !== prevColor) {
                log.push(new logCellChange(cellToChange, prevColor, primary_color.value,));
            }
        }
        else if (tool === "second_pen") {
            $(cellToChange).css("background-color", secondary_color.value)
            if (toRgb(secondary_color.value) !== prevColor) {     
                log.push(new logCellChange(cellToChange, prevColor, secondary_color.value,));
            }
        }
        else {
            $(cellToChange).css("background-color", eraser_color.value)
            if (toRgb(eraser_color.value) !== prevColor) {        
                log.push(new logCellChange(cellToChange, prevColor, eraser_color.value));
            }
        }
    }
});

//key listener
$(window).on("keydown", function(event) {
    keys[event.which] = true;
    //check if ctrl + z is pressed. if so, invoke undo() function
    if (keys["17"] && keys["90"]) {
        undo();
    }
    //check if ctrl + y is pressed. if so, invoke redo() function
    if (keys["17"] && keys["89"]) {
        redo();
    }
});

//removes key from keys array after keyup event was fired
$(window).on("keyup", function(event) {
    delete keys[event.which];
});

//so that context menu doesn't pop up on release of right mouse button
$(myTable).contextmenu(false);
