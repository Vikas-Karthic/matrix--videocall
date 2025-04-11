let img = new Image();
let imgX = 50; // Initial X position
let imgY = 50; // Initial Y position
let imgWidth = 200,
  imgHeight = 150; // Default dimensions
let isDragging = false; // Track if the image is being dragged
let isResizing = false; // Track if the image is being resized
let imgLoaded = false; // Check if image is loaded
let imageMode = false; // Toggle between image and drawing modes
let dra = false; // Track drawing mode

const openImageButton = document.querySelector(".open-image-btn");
const toggleImageModeButton = document.querySelector(".toggle-image-mode");

// Function to load the image from file input
const loadImage = (file) => {
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    imgWidth = img.width / 2; // Set initial width
    imgHeight = img.height / 2; // Set initial height
    imgLoaded = true;
    drawCanvas(); // Draw everything including the image
    emitImageAction("load", { imgX, imgY, imgWidth, imgHeight }); // Emit initial load action
  };
};

// Redraws the entire canvas, including drawings and the image if in image mode
const DRAW = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  setCanvasBackground(); // Reset background if needed

  // Draw any stored drawings here if you need to preserve existing drawings

  if (imgLoaded) {
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight); // Draw the image
  }
};

// Handle file input for image selection
openImageButton.addEventListener("click", () => {
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
  toggleImageModeButton.textContent = imageMode
    ? "Exit Image Mode"
    : "Enable Image Mode";

  // Reset dragging and resizing states when exiting image mode
  if (!imageMode) {
    isDragging = false;
    isResizing = false;
  }
});

// Emit image actions (load, move, resize) to the server
const emitImageAction = (action, data) => {
  socket.emit("imageAction", { action, data });
};

// Handle mouse events for dragging and resizing the image only when image mode is enabled
canvas.addEventListener("mousedown", (e) => {
  if (imageMode && imgLoaded) {
    const offsetX = e.offsetX,
      offsetY = e.offsetY;

    // Check if click is within image bounds for dragging
    if (
      offsetX > imgX &&
      offsetX < imgX + imgWidth &&
      offsetY > imgY &&
      offsetY < imgY + imgHeight
    ) {
      isDragging = true;
    }

    // Check if click is on the bottom-right corner for resizing
    const resizeMargin = 10;
    if (
      offsetX > imgX + imgWidth - resizeMargin &&
      offsetY > imgY + imgHeight - resizeMargin
    ) {
      isResizing = true;
    }
  } else if (!imageMode) {
    // Start drawing if not in image mode
    dra = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (imageMode && imgLoaded) {
    if (isDragging) {
      imgX = e.offsetX - imgWidth / 2;
      imgY = e.offsetY - imgHeight / 2;
      DRAW(); // Redraw the image in the new position
      emitImageAction("move", { imgX, imgY });
    } else if (isResizing) {
      imgWidth = e.offsetX - imgX;
      imgHeight = e.offsetY - imgY;
      DRAW(); // Redraw the image with new dimensions
      emitImageAction("resize", { imgWidth, imgHeight });
    }
  } else if (dra && !imageMode) {
    // Draw on the canvas if not in image mode
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  dra = false; // Stop drawing
});

// Listen for image actions from other users and update the canvas
socket.on("imageAction", (data) => {
  switch (data.action) {
    case "load":
      imgX = data.data.imgX;
      imgY = data.data.imgY;
      imgWidth = data.data.imgWidth;
      imgHeight = data.data.imgHeight;
      imgLoaded = true;
      DRAW();
      break;
    case "move":
      imgX = data.data.imgX;
      imgY = data.data.imgY;
      DRAW();
      break;
    case "resize":
      imgWidth = data.data.imgWidth;
      imgHeight = data.data.imgHeight;
      DRAW();
      break;
  }
});
