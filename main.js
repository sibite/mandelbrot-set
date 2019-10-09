
let UserInterface = function(el)  {
  this.el = el;
  this.container = el.getElementsByClassName("container")[0];
  this.zoom = document.getElementById("zoom");
  this.saved = document.getElementById("saved-container");
  this.savedButton = document.getElementById("saved-button");
  this.savedOpened = false;

  this.resize = function(width = window.innerWidth, height = window.innerHeight)  {
    this.el.style.width = width + "px";
    this.el.style.height = height + "px";
  };

  this.updateZoom = function(zoom)  {
    if (zoom >= 1000000)  {
      this.zoom.innerHTML = "Zoom: " + zoom.toExponential(2);
    }  else  {
      this.zoom.innerHTML = "Zoom: " + zoom.toFixed(2);
    }
  }

  this.addSaved = function(save)  {
    let el = document.createElement("div");
    el.classList = "saved";
    el.innerHTML = "<h3>"+save.name+"</h3>"+
    "<span><b>X:</b>"+save.x+"</span>"+
    "<span><b>Y:</b>"+save.y+"</span>"+
    "<span><b>Zoom:</b>"+save.zoom+"</span>";
    el.setAttribute("x", save.x);
    el.setAttribute("y", save.y);
    el.setAttribute("zoom", save.zoom);
    this.saved.appendChild(el);
  }

  this.switchSaved = function(close = false)  {
    if (this.savedOpened == true || close == true)  {
      this.saved.style.right = "-300px";
      this.zoom.style.right = "0px";
      this.savedOpened = false;
    } else  {
      this.saved.style.right = "0px";
      this.zoom.style.right = "300px";
      this.savedOpened = true;
    }
  }
};

//==========     DECLARING      ============


//=== CANVAS & MANDELBROT

let canvas = new Canvas();
let mandelbrot = new Mandelbrot(canvas);

//=== GUI

let gui = new UserInterface(document.getElementById("gui"));
gui.updateZoom(mandelbrot.zoom);


//==========     SAVED POINTS       ============


presets.forEach(function(preset)  {
  gui.addSaved(preset);
});


//==========     CANVAS RESIZE     ============


canvas.resize();
window.addEventListener("resize", function(){
  canvas.resize();
  zoomer.resize();
  gui.resize();
  mandelbrot.drawSet();
});


//=========      ZOOMING      =========

let pinchLen;
let tempZoom;

let zoomer = document.getElementById("zoomer");
zoomer.zoom = 2;
zoomer.resize = function()  {
  zoomer.style.width = canvas.width / zoomer.zoom + "px";
  zoomer.style.height = canvas.height / zoomer.zoom + "px";
}
zoomer.move = function(click)  {
  zoomer.style.left = click.clientX + "px";
  zoomer.style.top = click.clientY + "px";
}

zoomer.resize();
zoomer.move({clientX: canvas.width / 2, clientY: canvas.height / 2})


//========      SET VIEW      ==========

let setView = function(x, y, zoom, screenX = false, screenY = false)  {
  let zoomMult = zoom / mandelbrot.zoom;
  x = +x; y = +y; zoom = +zoom;

  if (screenX != false && screenY != false)  {
    canvas.el.classList.add("animated");
    canvas.el.style.transformOrigin = "50% 50%";
    canvas.el.style.transform = "translate("
    +(canvas.width / 2 - screenX) * zoomMult + "px, "
    +(canvas.height / 2 - screenY) * zoomMult + "px) scale("+zoomMult+")";
  }

  mandelbrot.zoom = zoom;
  mandelbrot.center = {x: x, y: y};
  gui.updateZoom(mandelbrot.zoom);
  setTimeout(function() {mandelbrot.drawSet();}, 10);
}

//=== EVENTS


document.body.addEventListener("mousemove", function(event)  {
  if (event.target == canvas.el || event.target == gui.container)  {
    zoomer.move(event);
  }
});


document.body.addEventListener("touchmove", function(event)  {
  if (event.target == canvas.el || event.target == gui.container)  {
    console.log(event);
    event.preventDefault();
    if (event.touches.length == 2)  {
      newPinchLen = Math.sqrt(
        Math.pow(event.touches[0].clientX - event.touches[1].clientX, 2)
        + Math.pow(event.touches[0].clientY - event.touches[1].clientY, 2)
      );
      zoomer.zoom = tempZoom * pinchLen / newPinchLen;
      zoomer.resize();
    }
    else if (event.touches.length == 1)  {
      zoomer.move(event.touches[0]);
    }
  }
});


document.body.addEventListener("touchstart", function(event) {
  if (event.target == canvas.el || event.target == gui.container)  {
    if (event.touches.length == 2)  {
      pinchLen = Math.sqrt(
        Math.pow(event.touches[0].clientX - event.touches[1].clientX, 2)
        + Math.pow(event.touches[0].clientY - event.touches[1].clientY, 2)
      );
      tempZoom = zoomer.zoom;
    }
    else if (event.touches.length == 3)  {
      switchFullscreen();
    }
  }
});


document.body.addEventListener("wheel", function(event)  {
  if (event.target == canvas.el || event.target == gui.container)  {
    delta = event.wheelDeltaY;
    deltaAbs = Math.abs(delta);
    if (delta > 0)  {
      zoomer.zoom *= deltaAbs / 100;
    }
    else if (delta < 0)  {
      zoomer.zoom /= deltaAbs / 100;
    }
    zoomer.resize();
  }
});


document.body.addEventListener("click", function(event)  {
  if (event.target == canvas.el || event.target == gui.container)  {
    let x = event.offsetX, y = event.offsetY, zoom = zoomer.zoom * mandelbrot.zoom;
    gui.switchSaved(true);
    gridCoords = mandelbrot.getGridCoords(x, y);
    setView(gridCoords.x, gridCoords.y, zoom, x, y);
  }
});

gui.savedButton.addEventListener("click", function() {gui.switchSaved()});

gui.saved.addEventListener("click", function(event)  {
  if (saved = event.target.closest(".saved"))
  {
    gui.switchSaved(true);
    setView(saved.getAttribute("x"), saved.getAttribute("y"), saved.getAttribute("zoom"));
  }
});




//============ FULLSCREEN ===============

function switchFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement ||
    document.mozFullScreenElement)  {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
  }
  else  {
    elem = document.body;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }
}

gradientImg = new Frame(canvas.width, 20);
for (x = 0; x < canvas.width; x++)  {
  point = x / (canvas.width - 1) * customGradient2.points[customGradient2.points.length - 1][0];
  color = customGradient2.getColor(point);
  for (y = 0; y < 20; y++)  {
    gradientImg.setPixel(x, y, color);
  }
}

function putGradient()  {
  //canvas.ctx.putImageData(gradientImg.imageData, 0, 0);
}


/*
mandelbrot.zoom = 34676135;
mandelbrot.center = {x: -1.7697313030574018, y: -0.004836938320806419};

mandelbrot.zoom = 36124794453853;
mandelbrot.center = {x: -1.7697313256040599, y: -0.0048369252286405};

mandelbrot.zoom = 254263;
mandelbrot.center = {x: -1.7693831, y: -0.004235265};
*/
mandelbrot.drawSet();
