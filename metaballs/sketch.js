const BALLS_COUNT = 5;

const BALL_SPEED = 2;
const BALL_SIZE = 5;
const SLOPE = 0.4;

let balls = [];

function setup() {
    createCanvas(150, 150);
    let randomSpeed = () => random() >= 0.5 ? BALL_SPEED : -BALL_SPEED;

    for (let i = 0; i < BALLS_COUNT; i++) {
        balls.push(new Ball(random(width), random(height), randomSpeed(), randomSpeed()));
    }

}

function draw() {
    loadPixels();
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            updatePixel(i, j);
        }
    }
    updatePixels();
    balls.forEach(ball => ball.move());
}

function updatePixel(x, y) {
    let dist = reduce(balls.map(b => distance(x, y, b.x, b.y)).map(sigm));

    set(x, y, color(255 * dist));
}

function sigm(dist) {
    let m = 0.01; //should be small, no solution if zero
    let d = log(m / (1 - m)); //special bias so sigm(0) = m
    return 1 / (1 + exp(dist * SLOPE - BALL_SIZE + d));
}

function reduce(arr) {
    let res = arr.reduce((a, b) => a + b, 0);
    return min(res, 0.9);
}


function distance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return sqrt(dx * dx + dy * dy);
}

class Ball {

    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 0 || this.x > width) {
            this.dx = -this.dx;
        }
        if (this.y < 0 || this.y > height) {
            this.dy = -this.dy;
        }
    }

}