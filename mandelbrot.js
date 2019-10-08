let Canvas = function() {
  this.el = document.getElementById("canvas");
  this.el.style.display = "block";
  this.ctx = this.el.getContext("2d");

  this.resize = function(width = window.innerWidth, height = window.innerHeight)  {
    this.el.width = this.width = width;
    this.el.height = this.height = height;
    this.el.style.width = width + "px";
    this.el.style.height = height + "px";
    this.mandelbrot.oneUnit = Math.min(height, width / 1.25) / 2;
  };

  this.rescale = function()  {
    this.el.classList.remove("animated");
    this.el.style.removeProperty("transform-origin");
    this.el.style.removeProperty("transform");
  }
}

let Mandelbrot = function(canvas)  {
  this.canvas = canvas;
  this.canvas.mandelbrot = this;
  this.iterations;
  this.center = {x: -0.25, y: 0};
  this.zoom = 0.5;

  this.getGridCoords = function(x, y) {
    x = (x - this.canvas.width / 2) / this.oneUnit + this.center.x;
    y = - (y - this.canvas.height / 2) / this.oneUnit + this.center.y;
    x = this.center.x - (this.center.x - x) / this.zoom;
    y = this.center.y - (this.center.y - y) / this.zoom;
    return {x: x, y: y};
  }

  this.getPointColor = function(x, y) {
    let x0 = x;
    let y0 = y;
    let i = 1
    let white = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    for (; i <= this.iterations; i++)  {
      newX = x*x - y*y + x0;
      newY = 2*x*y + y0;
      x = newX;
      y = newY;
      if (Math.abs(x) > 2 || Math.abs(y) > 2)  {
        break;
      }
    }
    let length = Math.sqrt(x*x + y*y);
    let iFactor = (i - 1) / (this.iterations - 1);
    if (iFactor < 1)  {
      ni = i - Math.log(Math.log(length) / Math.log(1000)) / Math.log(2);   //Skopiowane z neta
      iFactor = (ni - 1) / (this.iterations - 1);
    }
    return generateColor(iFactor, colorSet);
  }

  this.drawSet = function()  {
    console.log("Zoom: "+this.zoom+"x");
    this.iterations = Math.floor(iterationsMultiplier * Math.pow(this.zoom*this.oneUnit, 1/50));
    this.frame = new Frame(this.canvas.width, this.canvas.height);
    for (x = 0; x < this.canvas.width; x++)  {
      for (y = 0; y < this.canvas.height; y++)  {
        let gridCoords = this.getGridCoords(x, y);
        this.frame.setPixel(x, y, this.getPointColor(gridCoords.x, gridCoords.y));
      }
    }
    this.canvas.ctx.putImageData(this.frame.imageData, 0, 0);
    this.canvas.rescale();
    putGradient();
  }
};

let Frame = function(width, height)  {
  this.width = width;
  this.height = height;
  this.imageData = new ImageData(width, height);

  this.setPixel = function(x, y, [r, g, b, a = 255])  {
    let i = 4 * (y*this.width + x);
    this.imageData.data[i + 0] = r;
    this.imageData.data[i + 1] = g;
    this.imageData.data[i + 2] = b;
    this.imageData.data[i + 3] = a;
  }
}


let canvas = new Canvas();
let mandelbrot = new Mandelbrot(canvas);


canvas.resize();
window.addEventListener("resize", function(){
  canvas.resize();
  zoomer.resize();
  mandelbrot.drawSet();
});


//=========      ZOOMING      =========


let zoomer = document.getElementById("zoomer");
zoomer.zoom = 1;
zoomer.resize = function()  {
  zoomer.style.width = canvas.width / zoomer.zoom + "px";
  zoomer.style.height = canvas.height / zoomer.zoom + "px";
  let borderW = Math.max(3 / zoomer.zoom, 1)
  zoomer.style.borderWidth = borderW + "px";
  zoomer.style.borderRadius = borderW + "px";
}
zoomer.move = function(click)  {
  zoomer.style.left = click.clientX + "px";
  zoomer.style.top = click.clientY + "px";
}
zoomer.resize();
zoomer.move({clientX: canvas.width / 2, clientY: canvas.height / 2})

let pinchLen;
let tempZoom;

canvas.el.addEventListener("mousemove", function(event)  {
  zoomer.move(event);
});
canvas.el.addEventListener("touchmove", function(event)  {
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
});
canvas.el.addEventListener("touchstart", function(event) {
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
});

canvas.el.addEventListener("wheel", function(event)  {
  delta = event.wheelDeltaY;
  deltaAbs = Math.abs(delta);
  if (delta > 0)  {
    zoomer.zoom *= deltaAbs / 100;
  }
  else if (delta < 0)  {
    zoomer.zoom /= deltaAbs / 100;
  }
  zoomer.resize();
});

canvas.el.addEventListener("click", function(event)  {
  let x = event.offsetX, y = event.offsetY;

  canvas.el.classList.add("animated");
  canvas.el.style.transformOrigin = "50% 50%";
  canvas.el.style.transform = "translate("+(canvas.width / 2 - x) * zoomer.zoom + "px, "+(canvas.height / 2 - y) * zoomer.zoom + "px) scale("+zoomer.zoom+")";
  console.log((canvas.width / 2 - x) * zoomer.zoom);

  gridCoords = mandelbrot.getGridCoords(x, y);
  mandelbrot.zoom *= zoomer.zoom;
  mandelbrot.center = {x: gridCoords.x, y: gridCoords.y};
  setTimeout(function() {mandelbrot.drawSet();}, 10);
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

gradientImg = new Frame(canvas.width, 50);
for (x = 0; x < canvas.width; x++)  {
  point = x / (canvas.width - 1);
  color = customGradient2.getColor(point);
  for (y = 0; y < 100; y++)  {
    gradientImg.setPixel(x, y, color);
  }
}

function putGradient()  {
  canvas.ctx.putImageData(gradientImg.imageData, 0, canvas.height - 50);
}


colorSet = "customGradient2";
iterationsMultiplier = 300;    //300 is ideal
/*
mandelbrot.zoom = 34676135;
mandelbrot.center = {x: -1.7697313030574018, y: -0.004836938320806419};
*/
mandelbrot.zoom = 36124794453853;
mandelbrot.center = {x: -1.7697313256040599, y: -0.0048369252286405};

mandelbrot.drawSet();
