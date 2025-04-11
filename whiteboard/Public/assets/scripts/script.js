const canvas = document.querySelector("canvas"),
  toolBtns = document.querySelectorAll(".tool"),
  fillColor = document.querySelector("#fill-color"),
  sizeSlider = document.querySelector("#size-slider"),
  colorBtns = document.querySelectorAll(".colors li.options"),
  colorPicker = document.querySelector("#color-picker"),
  clearCanvas = document.querySelector(".clear-canvas"),
  saveImg = document.querySelector(".save-img"),
  undoBtn = document.querySelector(".undo"),
  redoBtn = document.querySelector(".redo"),
  generatePdfBtn = document.querySelector(".generate-pdf"),
  ctx = canvas.getContext("2d");

var socket = io.connect("http://localhost:8080/"); // Connect to the server

let prevMouseX,
  prevMouseY,
  snapshot,
  isDrawing = false,
  selectedTool = "brush",
  brushWidth = 5,
  selectedColor = "#000000";

// For UNDO & REDO operation
let undoStack = [];
let redoStack = [];
let tableStack = []; // Stack for storing table actions
let redoTableStack = []; // Stack for redo table actions

let isHost = false; // Default to non-host

// Listen for the host status from the server
socket.on("hostStatus", (data) => {
    isHost = data.isHost;
    if (isHost) {
        alert("You are the host! You can draw and manage the canvas.");
    } else {
        alert("You are a viewer. You cannot draw on the canvas.");
    }
});
// Update the selected color
colorBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".options .selected").classList.remove("selected");
    btn.classList.add("selected");
    selectedColor = window
      .getComputedStyle(btn)
      .getPropertyValue("background-color");
  });
});

// Handle color picker change
colorPicker.addEventListener("input", () => {
  const pickerBtn = colorPicker.parentElement; // Select the parent button of the picker
  pickerBtn.style.backgroundColor = colorPicker.value; // Change the button color
  pickerBtn.click(); // Simulate a click to select the new color
});

sizeSlider.addEventListener("change", () => (brushWidth = sizeSlider.value)); // Update brush size

// Function to set canvas background
const setCanvasBackground = () => {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = selectedColor;
};

// Save the current canvas state as an image
const saveCanvasState = () => {
  return canvas.toDataURL(); // Save canvas image as dataURL
};

// Restore the saved canvas state
const restoreCanvasState = (imageData) => {
  const img = new Image();
  img.src = imageData;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image to fit canvas
  };
};

// Recalculate the canvas size and restore content
const resizeCanvas = () => {
  const canvasContent = saveCanvasState(); // Save the current canvas content
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  setCanvasBackground(); // Reset the canvas background
  restoreCanvasState(canvasContent); // Restore the saved canvas content
};

// Call resizeCanvas on load
window.addEventListener("load", resizeCanvas);

// Save the current canvas state in undoStack and clear redoStack if needed
const saveState = (stack, keepRedo = false) => {
  if (!keepRedo) {
    redoStack = []; // Clear redo stack when a new action is performed
  }
  stack.push(canvas.toDataURL()); // Save canvas image as dataURL
};

// Save the table state to the undo stack
const saveTableState = (stack, tableData, keepRedo = false) => {
  if (!keepRedo) {
    redoTableStack = []; // Clear redo table stack when a new action is performed
  }
  stack.push(tableData); // Save table data
};

// Restore a state from the given stack (undo or redo)
const restoreState = (popStack, pushStack, broadcast = true) => {
  if (popStack.length > 0) {
    const imageDataURL = popStack.pop(); // Get the last state from the undo/redo stack
    pushStack.push(canvas.toDataURL()); // Save the current state to the opposite stack before popping
    restoreCanvasState(imageDataURL);
    if (broadcast) {
      emitDrawingData(popStack === undoStack ? "undo" : "redo", {
        state: imageDataURL,
      });
    }
  }
};

// Restore the table state from the stack
const restoreTableState = (popStack, pushStack, broadcast = true) => {
  if (popStack.length > 0) {
    const tableData = popStack.pop();
    pushStack.push(tableData); // Push the current table state to redo stack
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    setCanvasBackground(); // Reset background

    // Redraw all tables from the stack
    tableStack.forEach((table) => {
      drawTable(
        table.rows,
        table.cols,
        table.cellWidth,
        table.cellHeight,
        table.startX,
        table.startY
      );
    });
    if (broadcast) {
      emitDrawingData(popStack === tableStack ? "undoTable" : "redoTable");
    }
  }
};

// Emit drawing data to the server
const emitDrawingData = (action, data) => {
  socket.emit("drawing", { action, data });
};

// Function to draw a table on the canvas
const drawTable = (rows, cols, cellWidth, cellHeight, startX, startY) => {
  ctx.beginPath();
  // Draw rows
  for (let i = 0; i <= rows; i++) {
    ctx.moveTo(startX, startY + i * cellHeight);
    ctx.lineTo(startX + cols * cellWidth, startY + i * cellHeight);
  }
  // Draw columns
  for (let j = 0; j <= cols; j++) {
    ctx.moveTo(startX + j * cellWidth, startY);
    ctx.lineTo(startX + j * cellWidth, startY + rows * cellHeight);
  }
  ctx.strokeStyle = selectedColor;
  ctx.lineWidth = brushWidth;
  ctx.stroke();
};

// Event listener for the table button
document.getElementById("table").addEventListener("click", () => {
  let rows = parseInt(prompt("Enter number of rows:"));
  let cols = parseInt(prompt("Enter number of columns:"));
  let cellWidth = parseInt(prompt("Enter cell width:"));
  let cellHeight = parseInt(prompt("Enter cell height:"));
  let startX = 50,
    startY = 50; // Initial coordinates

  const tableData = { rows, cols, cellWidth, cellHeight, startX, startY };
  drawTable(rows, cols, cellWidth, cellHeight, startX, startY);

  // Save the table state for undo
  saveTableState(tableStack, tableData);
  emitDrawingData("table", tableData); // Emit table creation to server
});

// Handle undo
undoBtn.addEventListener("click", () => {
  if (undoStack.length > 0) {
    restoreState(undoStack, redoStack); // Undo the last action
  } else if (tableStack.length > 0) {
    restoreTableState(tableStack, redoTableStack);
  } else {
    alert("Nothing to undo");
  }
});

// Handle redo
redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    restoreState(redoStack, undoStack);
  } else if (redoTableStack.length > 0) {
    restoreTableState(redoTableStack, tableStack);
  } else {
    alert("Nothing to redo");
  }
});

// Drawing Rectangle
const drawRect = (e) => {
  // Restore the previous canvas state (snapshot) to avoid overlapping drawings
  ctx.putImageData(snapshot, 0, 0);

  // Calculate the width and height of the rectangle based on mouse movement
  const width = e.offsetX - prevMouseX;
  const height = e.offsetY - prevMouseY;

  // Begin drawing the rectangle
  ctx.beginPath();
  ctx.rect(prevMouseX, prevMouseY, width, height);

  // Fill or stroke the rectangle based on the user's selection
  if (fillColor.checked) {
    ctx.fill();
  } else {
    ctx.stroke();
  }

  // Emit drawing data for real-time collaboration or other purposes
  emitDrawingData("rectangle", {
    x: prevMouseX,
    y: prevMouseY,
    width,
    height,
    fill: fillColor.checked,
  });
};
// const floodFill = (startX, startY, fillColor) => {
  // Get the canvas image data
//   const ctxImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//   const pixelData = ctxImageData.data;

//   // Get the starting pixel color
//   const startPixelPos = (startY * canvas.width + startX) * 4;
//   const startColor = pixelData.slice(startPixelPos, startPixelPos + 4);

//   // Helper function to check if a pixel matches the start color
//   const matchStartColor = (pixelPos) => {
//     return (
//       pixelData[pixelPos] === startColor[0] && // Red channel
//       pixelData[pixelPos + 1] === startColor[1] && // Green channel
//       pixelData[pixelPos + 2] === startColor[2] && // Blue channel
//       pixelData[pixelPos + 3] === startColor[3] // Alpha channel
//     );
//   };

//   // Helper function to set the color of a pixel
//   const colorPixel = (pixelPos) => {
//     pixelData[pixelPos] = fillColor[0]; // Red channel
//     pixelData[pixelPos + 1] = fillColor[1]; // Green channel
//     pixelData[pixelPos + 2] = fillColor[2]; // Blue channel
//     pixelData[pixelPos + 3] = fillColor[3]; // Alpha channel
//   };

//   // If the starting color matches the fill color, exit (no need to fill)
//   if (
//     fillColor[0] === startColor[0] &&
//     fillColor[1] === startColor[1] &&
//     fillColor[2] === startColor[2] &&
//     fillColor[3] === startColor[3]
//   ) {
//     return;
//   }

//   // Stack for pixels to process
//   const pixelStack = [[startX, startY]];

//   // Process the pixels in the stack
//   while (pixelStack.length) {
//     const [x, y] = pixelStack.pop();
//     let pixelPos = (y * canvas.width + x) * 4;

//     // Move up to find the top boundary of the current span
//     while (y >= 0 && matchStartColor(pixelPos)) {
//       y--;
//       pixelPos -= canvas.width * 4; // Move one row up
//     }

//     // Move back down to the first pixel of the current span
//     y++;
//     pixelPos += canvas.width * 4;

//     let reachLeft = false;
//     let reachRight = false;

//     // Fill and check the span below
//     while (y < canvas.height && matchStartColor(pixelPos)) {
//       // Color the current pixel
//       colorPixel(pixelPos);

//       // Check the pixel to the left
//       if (x > 0) {
//         const leftPixelPos = pixelPos - 4;
//         if (matchStartColor(leftPixelPos)) {
//           if (!reachLeft) {
//             pixelStack.push([x - 1, y]);
//             reachLeft = true;
//           }
//         } else {
//           reachLeft = false;
//         }
//       }

//       // Check the pixel to the right
//       if (x < canvas.width - 1) {
//         const rightPixelPos = pixelPos + 4;
//         if (matchStartColor(rightPixelPos)) {
//           if (!reachRight) {
//             pixelStack.push([x + 1, y]);
//             reachRight = true;
//           }
//         } else {
//           reachRight = false;
//         }
//       }

//       // Move down to the next row
//       y++;
//       pixelPos += canvas.width * 4;
//     }
//   }

//   // Put the updated image data back onto the canvas
//   ctx.putImageData(ctxImageData, 0, 0);
// };


// Drawing Circle
// Function to draw a circle
const drawCircle = (e) => {
  // Restore the previous snapshot of the canvas to prevent drawing overlaps
  ctx.putImageData(snapshot, 0, 0);

  // Calculate the radius of the circle based on the mouse's current position
  let radius = Math.sqrt(
    Math.pow(prevMouseX - e.offsetX, 2) + Math.pow(prevMouseY - e.offsetY, 2)
  );

  // Start drawing the circle
  ctx.beginPath();
  ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);

  // Fill or stroke the circle based on user choice
  if (fillColor.checked) {
    ctx.fill();
  } else {
    ctx.stroke();
  }

  // Emit drawing data for real-time collaboration or other uses
  emitDrawingData("circle", {
    x: prevMouseX,
    y: prevMouseY,
    radius,
    fill: fillColor.checked,
  });
};

// Function to draw a triangle
const drawTriangle = (e) => {
  // Restore the previous snapshot of the canvas
  ctx.putImageData(snapshot, 0, 0);

  // Calculate the third point of the triangle symmetrically based on the mouse movement
  const x3 = prevMouseX * 2 - e.offsetX;

  // Start drawing the triangle
  ctx.beginPath();
  ctx.moveTo(prevMouseX, prevMouseY); // First point
  ctx.lineTo(e.offsetX, e.offsetY); // Second point
  ctx.lineTo(x3, e.offsetY); // Third point
  ctx.closePath(); // Close the path to form the triangle

  // Fill or stroke the triangle based on user choice
  if (fillColor.checked) {
    ctx.fill();
  } else {
    ctx.stroke();
  }

  // Emit drawing data for real-time collaboration or other uses
  emitDrawingData("triangle", {
    x1: prevMouseX,
    y1: prevMouseY,
    x2: e.offsetX,
    y2: e.offsetY,
    x3: x3,
    y3: e.offsetY,
    fill: fillColor.checked,
  });
};





// Basic drawing script
const startDraw = (e) => {
  isDrawing = true;
  prevMouseX = e.offsetX;
  prevMouseY = e.offsetY;
  ctx.beginPath();
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
  ctx.fillStyle = selectedColor;
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); // Save the current canvas state
  saveState(undoStack); // Save the current state to undo stack
  emitDrawingData("start", {
    tool: selectedTool,
    color: selectedColor,
    brushWidth,
  });
};

const drawing = (e) => {
  if (!isDrawing) return;
  ctx.putImageData(snapshot, 0, 0);
  if (selectedTool === "brush" || selectedTool === "eraser") {
    ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    emitDrawingData("draw", {
      prevX: prevMouseX,
      prevY: prevMouseY,
      currX: e.offsetX,
      currY: e.offsetY,
      tool: selectedTool,
    });
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
  } else if (selectedTool === "rectangle") {
    drawRect(e);
  } else if (selectedTool === "circle") {
    drawCircle(e);
  } else if (selectedTool === "triangle") {
    drawTriangle(e);
  } else if (selectedTool === "fill") {
    // Handle the fill tool
    const color = hexToRgba(selectedColor); // Convert selected color to rgba
    floodFill(x, y, color);
    emitDrawingData("fill", { x, y, color });
  }
  else if (selectedTool === "line") {
    // Straight-line drawing when the ruler is enabled
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushWidth;
    ctx.stroke();}
};

const hexToRgba = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255]; // Add alpha 255 for full opacity
};

// Mouse and touch event handlers for fill tool
// Start drawing only if the user is the host
canvas.addEventListener("mousedown", (e) => {
  if (!isHost) {
      return;
  }
  startDraw(e); // Call the existing function to initiate drawing
});

// Continue drawing only if the user is the host
canvas.addEventListener("mousemove", (e) => {
  if (!isHost) return; // Prevent non-host users from drawing
  drawing(e); // Call the existing function to handle drawing
});

// Stop drawing (no additional checks needed here as only hosts can start drawing)
canvas.addEventListener("mouseup", () => {
  if (!isHost) return; // No need to emit drawing data for non-hosts
  isDrawing = false; // End the drawing state
  emitDrawingData("end");
});


// Touch event listeners
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent scrolling
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  startDraw(touch.clientX - rect.left, touch.clientY - rect.top);
});
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault(); // Prevent scrolling
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  drawing(touch.clientX - rect.left, touch.clientY - rect.top);
});
canvas.addEventListener("touchend", () => {
  isDrawing = false;
  emitDrawingData("end");
});

// Update tool button listeners for fill tool
toolBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");
    selectedTool = btn.id;
  });
  btn.addEventListener("touchstart", () => {
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");
    selectedTool = btn.id;
  });
});

// SOCKET.IO INTEGRATION: Listening for updates from the server
socket.on("drawing", (data) => {
  switch (data.action) {
    case "draw":
      ctx.beginPath();
      ctx.moveTo(data.data.prevX, data.data.prevY);
      ctx.lineTo(data.data.currX, data.data.currY);
      ctx.strokeStyle = data.data.tool === "eraser" ? "#fff" : data.data.color;
      ctx.lineWidth = data.data.brushWidth;
      ctx.stroke();
      break;

    case "rectangle":
      ctx.beginPath();
      ctx.lineWidth = brushWidth;
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      if (data.data.fill) {
        ctx.fillRect(
          data.data.x,
          data.data.y,
          data.data.width,
          data.data.height
        );
      } else {
        ctx.strokeRect(
          data.data.x,
          data.data.y,
          data.data.width,
          data.data.height
        );
      }
      break;

    case "circle":
      ctx.beginPath();
      ctx.lineWidth = brushWidth;
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.arc(data.data.x, data.data.y, data.data.radius, 0, 2 * Math.PI);
      data.data.fill ? ctx.fill() : ctx.stroke();
      break;

    case "triangle":
      ctx.beginPath();
      ctx.lineWidth = brushWidth;
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.moveTo(data.data.x1, data.data.y1);
      ctx.lineTo(data.data.x2, data.data.y2);
      ctx.lineTo(data.data.x1 * 2 - data.data.x2, data.data.y2);
      ctx.closePath();
      data.data.fill ? ctx.fill() : ctx.stroke();
      break;

    case "table":
      drawTable(
        data.data.rows,
        data.data.cols,
        data.data.cellWidth,
        data.data.cellHeight,
        data.data.startX,
        data.data.startY
      );
      tableStack.push(data.data);
      break;

    case "clear":
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setCanvasBackground();
      break;

    case "undo":
    case "redo":
      restoreCanvasState(data.data.state);
      break;

    case "undoTable":
      restoreTableState(tableStack, redoTableStack, false);
      break;

    case "redoTable":
      restoreTableState(redoTableStack, tableStack, false);
      break;

    case "tool-change":
      selectedTool = data.data.tool;
      break;

    case "size-change":
      brushWidth = data.data.brushWidth;
      break;

    case "color-change":
      selectedColor = data.data.color;
      break;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const toolsIcon = document.querySelector(".tools");
  const toolsSection = document.querySelector(".tools-section");
  const mainBody = document.querySelector(".main-body");
  const nextPageBtn = document.getElementById("next-page-btn");
  const nextPage = document.getElementById("next-page");
  const prevPageBtn = document.getElementById("prev-page-btn"); // Optional: if you have a back button

  // Toggle the tools section visibility
  toolsIcon.addEventListener("click", () => {
    toolsSection.classList.toggle("hidden");
    mainBody.classList.toggle("full-width");
    toolsSection.style.display = null;
    nextPage.style.display = null;
    nextPageBtn.style.display = "block";
    // After toggling, resize the canvas but retain its content
    resizeCanvas();
  });

  // Handle navigation to the next page
  nextPageBtn.addEventListener("click", () => {
    toolsSection.style.display = "none"; // Hide tools section
    nextPage.style.display = "block"; // Show the next page
    nextPageBtn.style.display = "none"; // Hide the "Next" button
    resizeCanvas(); // Resize canvas after page change
  });

  prevPageBtn?.addEventListener("click", () => {
    nextPage.style.display = "none"; /* Hide the next page */
    toolsSection.style.display = "block"; /* Show the tools section again */
    nextPageBtn.style.display = "block";
    resizeCanvas(); /* Show the "Next" button */
  });
  // Adjust canvas size on window resize
  window.addEventListener("resize", resizeCanvas);
});



saveImg.addEventListener("click", () => {
  if(isHost){
  const additionalHeight = 1000; // Amount to extend
  const whiteboardSection = document.querySelector(".whiteboard-section");

  // Save the current canvas content
  const savedContent = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Dynamically adjust the height of the canvas
  canvas.height += additionalHeight; // Increase internal canvas height for drawing
  canvas.width = canvas.offsetWidth; // Ensure internal width matches display width
  canvas.style.height = `${canvas.height}px`; // Adjust canvas visual height
  canvas.style.width = `${canvas.offsetWidth}px`; // Maintain canvas visual width

  // Restore the saved content to the resized canvas
  ctx.putImageData(savedContent, 0, 0);

  // Fill the newly added area with a white background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, savedContent.height, canvas.width, additionalHeight);

  // Notify other users about the canvas extension with the updated content
  socket.emit("canvas-extend", {
      additionalHeight,
      canvasData: canvas.toDataURL("image/png"), // Send the updated canvas as an image
  });

  // Ensure the parent container allows scrolling
  whiteboardSection.style.overflowY = "auto"; // Enable vertical scrolling
  whiteboardSection.style.maxHeight = "100vh"; // Limit visible height to the viewport

  // Optional: Notify the host
  alert(`Canvas extended by ${additionalHeight}px!`);
}
});


socket.on("updateCanvasHeight", (data) => {
  if(!isHost){
  const { additionalHeight, canvasData } = data;

  // Save the current canvas content
  const currentContent = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Dynamically adjust the height of the canvas
  canvas.height += additionalHeight; // Increase the internal height
  canvas.width = canvas.offsetWidth; // Ensure internal width matches display width
  canvas.style.height = `${canvas.height}px`; // Adjust canvas visual height
  canvas.style.width = `${canvas.width}px`; // Maintain canvas visual width

  // Restore the received content to the resized canvas
  const img = new Image();
  img.src = canvasData; // The base64 image from the host
  img.onload = () => {
      ctx.drawImage(img, 0, 0); // Draw the host's canvas content onto the resized canvas
  };

  // Ensure the parent container allows scrolling
  const whiteboardSection = document.querySelector(".whiteboard-section");
  whiteboardSection.style.overflowY = "auto";
  whiteboardSection.style.maxHeight = "100vh";

  // Optional: Notify the user
  alert(`Canvas height extended by ${additionalHeight}px by the host.`);
}
});






// Event listener for the "PDF" button
generatePdfBtn.addEventListener("click", () => {
  // Check if the canvas has any content
  if (canvas.width === 0 || canvas.height === 0) {
      alert("Canvas is empty! Nothing to export.");
      return;
  }

  // Convert the canvas to a data URL
  const canvasData = canvas.toDataURL("image/png");

  // Prompt the user for the PDF name
  let pdfName = prompt("Enter the name for the PDF:", "canvas-drawing");
  if (!pdfName || pdfName.trim() === "") {
      pdfName = "canvas-drawing"; // Default name if none is provided
  }

  // Initialize jsPDF
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height], // Match the canvas size
  });

  // Add the canvas image to the PDF
  pdf.addImage(canvasData, "PNG", 0, 0, canvas.width, canvas.height);

  // Save the PDF with the specified name
  pdf.save(`${pdfName}.pdf`);

  // Optional: Notify the user
  alert(`PDF "${pdfName}.pdf" has been generated!`);
});
 

// Add event listener for clear canvas button
clearCanvas.addEventListener("click", () => {
  // Save the current state to undoStack before clearing
  saveState(undoStack);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setCanvasBackground();
  emitDrawingData("clear"); // Broadcast the clear action
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// // Spotlight properties




















let img = new Image();
let imgX = 50; // Initial X position
let imgY = 50; // Initial Y position
let imgWidth = 200, imgHeight = 150; // Default dimensions
let isDragging = false; // Track if the image is being dragged
let isResizing = false; // Track if the image is being resized
let imgLoaded = false; // Check if the image is loaded
let imageMode = false; // Toggle between image and drawing modes
let dragOffsetX = 0, dragOffsetY = 0; // Track offsets for dragging

const openImageButton = document.querySelector(".open-image-btn");
const toggleImageModeButton = document.querySelector(".toggle-image-mode");

// Function to load the image from file input
const loadImage = (file) => {
  const objectURL = URL.createObjectURL(file); // Create object URL for image
  img.src = objectURL;
  img.onload = () => {
    imgWidth = img.width / 2; // Set initial dimensions
    imgHeight = img.height / 2;
    imgLoaded = true;
    drawimgCanvas(); // Redraw the canvas

    // Emit load action with image data URL and properties
    const imgDataUrl = img.src;
    emitImageAction("load", { imgDataUrl, imgX, imgY, imgWidth, imgHeight });

    URL.revokeObjectURL(objectURL); // Revoke the object URL to prevent memory leaks
  };
};

// Handle file input for image selection
openImageButton.addEventListener("click", () => {
  if(!isHost)return;
  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.accept = "image/*";
  inputFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) loadImage(file);
  });
  inputFile.click();
});

// Toggle between image mode and drawing mode
toggleImageModeButton.addEventListener("click", () => {
  imageMode = !imageMode;
  toggleImageModeButton.textContent = imageMode ? "Exit Image Mode" : "Enable Image Mode";

  // Reset dragging and resizing states when exiting image mode
  if (!imageMode) {
    isDragging = false;
    isResizing = false;
  }
});

const drawimgCanvas = () => {
  const currentCanvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Clear canvas for redrawing
  ctx.clearRect(0, 0, canvas.width, canvas.height); 
  setCanvasBackground(); // Reset background if needed

  // Restore previously saved content
  ctx.putImageData(currentCanvasData, 0, 0);

  // Draw the image if it's loaded
  if (imgLoaded) {
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
  }

  
};


// Emit image actions (load, move, resize) to the server
const emitImageAction = (action, data) => {
  socket.emit("imageAction", { action, data });
};

// Handle mouse events for dragging and resizing the image
canvas.addEventListener("mousedown", (e) => {
  if (!isHost || !imageMode || !imgLoaded) return; // Restrict to host
  const offsetX = e.offsetX, offsetY = e.offsetY;

  // Check if mouse is inside the image for dragging
  if (
      offsetX > imgX &&
      offsetX < imgX + imgWidth &&
      offsetY > imgY &&
      offsetY < imgHeight
  ) {
      isDragging = true;
      dragOffsetX = offsetX - imgX;
      dragOffsetY = offsetY - imgY;
  }

  // Check if the mouse is near the bottom-right corner for resizing
  const resizeMargin = Math.max(10, Math.min(imgWidth, imgHeight) * 0.05);
  if (
      offsetX > imgX + imgWidth - resizeMargin &&
      offsetY > imgY + imgHeight - resizeMargin
  ) {
      isResizing = true;
  }
});






canvas.addEventListener("mousemove", (e) => {
  const offsetX = e.offsetX, offsetY = e.offsetY;

  if (!isHost||(!imageMode && !imgLoaded)) return;
    const resizeMargin = 10;
    if (
      offsetX > imgX + imgWidth - resizeMargin &&
      offsetY > imgY + imgHeight - resizeMargin
    ) {
      canvas.style.cursor = "nwse-resize"; // Resize cursor
    }
    // Update cursor for dragging if inside the image bounds
    else if (
      offsetX > imgX &&
      offsetX < imgX + imgWidth &&
      offsetY > imgY &&
      offsetY < imgY + imgHeight
    ) {
      canvas.style.cursor = "move"; // Drag cursor
    }
    // Reset cursor if not in a draggable or resizable area
    else {
      canvas.style.cursor = "default";
    }

    if (isDragging) {
      imgX = e.offsetX - dragOffsetX;
      imgY = e.offsetY - dragOffsetY;
      drawimgCanvas();
      emitImageAction("move", { imgX, imgY });
    } else if (isResizing) {
      imgWidth = e.offsetX - imgX;
      imgHeight = e.offsetY - imgY;
      drawimgCanvas(); // Redraw everything
      emitImageAction("resize", { imgWidth, imgHeight });
    }
  
  if (!imageMode) {
    canvas.style.cursor = "default";
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
});
const redrawCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  setCanvasBackground(); // Reset the canvas background

  // Draw the image first
  if (imgLoaded) {
      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
  }

  // Restore the saved canvas drawings
  const canvasData = undoStack.length ? undoStack[undoStack.length - 1] : null;
  if (canvasData) {
      restoreCanvasState(canvasData);
  }

  // Additional features like spotlight, rulers, etc.
  if (spotlightEnabled) {
      drawSpotlight();
  }
};

// Listen for image actions from other users and update the canvas
socket.on("imageAction", (data) => {
  switch (data.action) {
    case "load":
      img.src = data.data.imgDataUrl;
      imgX = data.data.imgX;
      imgY = data.data.imgY;
      imgWidth = data.data.imgWidth;
      imgHeight = data.data.imgHeight;
      imgLoaded = true;
      drawimgCanvas(); // Redraw canvas
      break;
    case "move":
      imgX = data.data.imgX;
      imgY = data.data.imgY;
      drawimgCanvas(); // Redraw canvas
      break;
    case "resize":
      imgWidth = data.data.imgWidth;
      imgHeight = data.data.imgHeight;
      drawimgCanvas(); // Redraw canvas
      break;
  }
});


let spotlightEnabled = false;
let spotlightX = 0;
let spotlightY = 0;
let spotlightRadius = 100;

const drawSpotlight = () => {
  if (!spotlightEnabled) return;

  // Restore the canvas content
  restoreCanvasState();

  // Darken the area outside the spotlight
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Save the canvas state for clipping
  ctx.save();

  // Clip the spotlight circle
  ctx.beginPath();
  ctx.arc(spotlightX, spotlightY, spotlightRadius, 0, Math.PI * 2);
  ctx.clip();

  // Clear the area for magnification
  ctx.clearRect(
    spotlightX - spotlightRadius,
    spotlightY - spotlightRadius,
    spotlightRadius * 2,
    spotlightRadius * 2
  );

  const zoomScale = 6; // Zoom level

  // Calculate the center of the zoomed area relative to the image
  const relativeX = (spotlightX - imgX) / imgWidth;
  const relativeY = (spotlightY - imgY) / imgHeight;

  // Calculate source coordinates for the zoomed image
  const sourceWidth = img.width / zoomScale;
  const sourceHeight = img.height / zoomScale;

  const sourceX = (img.width - sourceWidth) * relativeX;
  const sourceY = (img.height - sourceHeight) * relativeY;

  // Draw the zoomed portion of the image within the spotlight
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    spotlightX - spotlightRadius,
    spotlightY - spotlightRadius,
    spotlightRadius * 2,
    spotlightRadius * 2
  );

  // Restore the canvas state
  ctx.restore();
};


// Redraw the canvas with the adjusted spotlight effect
const drawCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setCanvasBackground(); // Reset the background if needed

  // Draw the image
  if (imgLoaded) {
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
  }
  if (rulerEnabled) {
    drawRuler();
  }

  // Draw the adjusted spotlight effect
  if (spotlightEnabled) {
    drawSpotlight();
  }
};

// Enable mouse movement tracking for adjusted spotlight
canvas.addEventListener("mousemove", (e) => {
  if (isHost && spotlightEnabled) {
    const rect = canvas.getBoundingClientRect();
    spotlightX = e.clientX - rect.left;
    spotlightY = e.clientY - rect.top;
    drawCanvas();

    // Broadcast the spotlight movement to others
    socket.emit('spotlightMove', { spotlightX, spotlightY });
}
});

// Toggle spotlight mode
document.querySelector(".toggle-spotlight-btn").addEventListener("click", () => {
  if(isHost){
  spotlightEnabled = !spotlightEnabled;
  drawCanvas();}
});
// Listen for spotlight updates from the host
socket.on('spotlightUpdate', (data) => {
  spotlightX = data.spotlightX;
  spotlightY = data.spotlightY;
  drawCanvas(); // Redraw the canvas with the updated spotlight position
});


// Restore the canvas when disabling spotlight mode
canvas.addEventListener("mouseleave", () => {
  if (spotlightEnabled) {
    drawCanvas();
  }
});
let rulerEnabled = false; // Track whether the ruler is enabled



const drawRuler = () => {
  const rulerSpacing = 50; // Spacing between ruler markers in pixels
  const rulerHeight = 20; // Height of the ruler markers
  const fontSize = 12; // Font size for the marker labels

  ctx.save();
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.lineWidth = 1;
  ctx.font = `${fontSize}px Arial`;

  // Draw top ruler
  for (let x = 0; x < canvas.width; x += rulerSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rulerHeight); // Marker height
    ctx.stroke();

    // Draw marker labels
    ctx.fillText(x, x + 2, fontSize); // Add small offset for clarity
  }

  // Draw left ruler
  for (let y = 0; y < canvas.height; y += rulerSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rulerHeight, y); // Marker width
    ctx.stroke();

    // Draw marker labels
    ctx.fillText(y, 2, y + fontSize); // Add small offset for clarity
  }

  ctx.restore();
};

const toggleRulerButton = document.querySelector(".addcanvas");
toggleRulerButton.addEventListener("click", () => {
  rulerEnabled = !rulerEnabled; // Toggle ruler state
  toggleRulerButton.textContent = rulerEnabled ? "Hide Ruler" : "Show Ruler"; // Update button text
  if (rulerEnabled) {
    selectedTool = "line"; // Force straight-line tool
    drawCanvas(); // Redraw the canvas
  }else{
    selectedTool="brush";
  }
});

