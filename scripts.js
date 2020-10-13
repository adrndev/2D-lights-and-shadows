var canvas  = document.getElementById("canvas");
var c = canvas.getContext("2d");

var cw = canvas.width = 480;
var ch = canvas.height = 480;

var tilesize = 32;

var walls = [
  [
    {x:100, y:100},
    {x:200, y:100},
    {x:200, y:200},
    {x:100, y:200}
  ],
  [
    {x:250, y:250},
    {x:250, y:350},
    {x:350, y:350},
    {x:350, y:150},
    {x:250, y:250}
  ],
  [
    {x:75, y:350},
    {x:280, y:410},
    {x:140, y:450},
    {x:32, y:350}
  ]
];

var player = {
  x:cw/2,
  y:ch/2,
  moving: {
    left:false,
    right:false,
    up:false,
    down:false
  }
}

// function getWalls(x, y) {
//   arr = [];
//   arr.push({sx:x, sy:y, tx:x+tilesize, ty:y});
//   arr.push({sx:x+tilesize, sy:y, tx:x+tilesize, ty:y+tilesize});
//   arr.push({sx:x+tilesize, sy:y+tilesize, tx:x, ty:y+tilesize});
//   arr.push({sx:x, sy:y+tilesize, tx:x, ty:y});
//   return arr;
// }

function drawWalls() {
  // c.beginPath();
  $.each(walls, function(i, j){
    c.beginPath();
    $.each(walls[i], function(index, value) {
      if(index==0) {
        c.moveTo(value.x, value.y);
      } else {
        c.lineTo(value.x, value.y);
      }
    });
    c.lineTo(walls[i][0].x, walls[i][0].y);
    c.fillStyle = "lightgray";
    c.fill();
    c.closePath();
  });
  // c.closePath();
}

var mouseX = cw/2, mouseY = cw/2 - 100;

var fov = 150;

$(document).mousemove(function(e){
	mouseX = e.clientX;
  mouseY = e.clientY;
  $("#mouse").text(`mouseX: ${mouseX}, mouseY: ${mouseY}`);
});

function pita(x1, y1, x2, y2) {
  var x = x1 - x2;
  var y = y1 - y2;
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function castRays() {
  var angle = Math.atan2(player.x - mouseX, player.y - mouseY);
  var rays = [];
  var closed = [];
  var intersects = [];
	for(var i=0;i<240;i++) {
    intersects = [];
    length = pita(player.x, player.y, mouseX, mouseY);
    dirX = 200 * Math.cos(-angle+150);
    dirY = 200 * Math.sin(-angle+150);
    dirX+=player.x;
    dirY+=player.y;
    angle+=0.005;
    var ints = intersections(dirX, dirY);
    if(ints.length > 0) {
      let shortest;
      let shortest_intersection;
      // for(var z = 0;z<ints.length;z++) {
      //   var calc = pita(player.x, player.y, ints[z].x, ints[z].y);
      //   if(!shortest || shortest > calc) {
      //     shortest = calc;
      //     shortest_intersection = ints[z];
      //   }
      // }
      for(var z = 0;z<ints.length;z++) {
        var calc = pita(player.x, player.y, ints[z].x, ints[z].y);
        ints[z].calc = calc;
      }
      ints.sort(function(a, b) {
        return parseFloat(a.calc) - parseFloat(b.calc);
      });
      // console.log(ints);
      if(ints.length == 1) {
        // rays.push({x:dirX, y:dirY});
        rays.push({x:ints[0].x, y:ints[0].y});
      } else {
        // console.log(ints);
        rays.push({x:ints[0].x, y:ints[0].y});
      }
    }
    else {
      rays.push({x:dirX, y:dirY});
    }
  }
  let lx, ly;
  c.beginPath();
  $.each(rays, function(i, j) {

    c.strokeStyle = "transparent";
    c.moveTo(player.x, player.y);
    c.lineTo(rays[i].x, rays[i].y);
    if(lx) {
      c.lineTo(lx, ly);
    }
    c.stroke();
    lx = rays[i].x;
    ly = rays[i].y;
  });
  c.save();
  c.globalCompositeOperation = "lighter";
  angles = Math.atan2(player.x - mouseX, player.y - mouseY);
  var grd=c.createRadialGradient(player.x,player.y,1,player.x+angles,player.y+angles,300);
  grd.addColorStop(0,"rgba(255,255,224, 0.4)");
  grd.addColorStop(1,"transparent");

  c.fillStyle = grd;
  c.fill();
  c.restore();
  c.closePath();
}

function intersections(dx, dy) {
  var intersects = [];
  for(var k = 0;k < walls.length;k++) {
    // var wlls = getWalls(walls[k].x, walls[k].y);
    for(var o = 0;o<walls[k].length;o++) {
      if(o==walls[k].length - 1) {
        chk = IsIntersecting({X:player.x, Y:player.y}, {X:dx, Y:dy}, {X:walls[k][o].x, Y:walls[k][o].y}, {X:walls[k][0].x, Y:walls[k][0].y});
      } else {
        chk = IsIntersecting({X:player.x, Y:player.y}, {X:dx, Y:dy}, {X:walls[k][o].x, Y:walls[k][o].y}, {X:walls[k][o+1].x, Y:walls[k][o+1].y});
      }
      // chk = IsIntersecting({X:player.x, Y:player.y}, {X:dx, Y:dy}, {X:walls[k][o].x, Y:walls[k][o].y}, {X:walls[k][o+1].x, Y:walls[k][o+1].y});
      if(chk.seg1 == true && chk.seg2 == true) {
        intersects.push({square: walls[k][o], x: chk.x, y: chk.y});
      }
    }
  }
  return intersects;
}

function IsIntersecting(a, b, c, d)
{
    var denominator = ((b.X - a.X) * (d.Y - c.Y)) - ((b.Y - a.Y) * (d.X - c.X));
    var numerator1 = ((a.Y - c.Y) * (d.X - c.X)) - ((a.X - c.X) * (d.Y - c.Y));
    var numerator2 = ((a.Y - c.Y) * (b.X - a.X)) - ((a.X - c.X) * (b.Y - a.Y));

    // Detect coincident lines (has a problem, read below)
    if (denominator == 0) return numerator1 == 0 && numerator2 == 0;

    var r = numerator1 / denominator;
    var s = numerator2 / denominator;

    return {
        x: a.X + (r * (b.X - a.X)),
        y: a.Y + (r * (b.Y - a.Y)),
        seg1: r >= 0 && r <= 1,
        seg2: s >= 0 && s <= 1
    };
}

function update() {
	requestAnimationFrame(update);
  c.clearRect(0,0,cw,ch);
  drawWalls();
  c.beginPath();
  c.rect(0,0,cw,ch);
  c.fillStyle = "rgba(0,0,0,0.5)";
  c.fill();
  c.closePath();
  $.each(player.moving, function(i, j) {
    if(j == true) {
      if(i == "left") {
        player.x -= 1;
      }
      if(i == "right") {
        player.x += 1;
      }
      if(i == "up") {
        player.y -= 1;
      }
      if(i == "down") {
        player.y += 1;
      }
    }
  });
  castRays();
}

$(document).keydown(function(e) {
  if(e.keyCode == 87) {
    player.moving.up = true;
  }
  if(e.keyCode == 83) {
    player.moving.down = true;
  }
  if(e.keyCode == 65) {
    player.moving.left = true;
  }
  if(e.keyCode == 68) {
    player.moving.right = true;
  }
});

$(document).keyup(function(e) {
  if(e.keyCode == 87) {
    player.moving.up = false;
  }
  if(e.keyCode == 83) {
    player.moving.down = false;
  }
  if(e.keyCode == 65) {
    player.moving.left = false;
  }
  if(e.keyCode == 68) {
    player.moving.right = false;
  }
});

// sx = tilesize, sy = tilesize;
// for(var i=0;i<10;i++) {
//   walls.push({x:sx, y:sy});
//   if(sy>cw/2+100 || i > 5) {
//     sy-=tilesize*2;
//     sx+=32*2;
//   } else {
//     sy+=tilesize*2;
//     sx+=16*2;
//   }
// }

update();
