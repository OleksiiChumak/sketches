const BALLS_COUNT = 2;

const BALL_SPEED = 2;
const BALL_SIZE = 5;
const SLOPE = 0.4;

//Strange Math
const M = 0.01; // (1 - M) is maximum of sigm()
const BIAS = Math.log(M / (1 - M)); // Bias for convenience. If BALL_SIZE = 0, then sigm(0) = M
const EFFECTIVE_BALL_RADIUS = (Math.log((1 - M) / M) - (BIAS - BALL_SIZE)) / SLOPE;
const BOX_SIZE = Math.sqrt(2) * EFFECTIVE_BALL_RADIUS;
//End Strange Math

let balls = [];

function setup() {
    createCanvas(300, 300);
    let randomSpeed = () => random() >= 0.5 ? BALL_SPEED : -BALL_SPEED;

    for (let i = 0; i < BALLS_COUNT; i++) {
        balls.push(new Ball(random(width), random(height), randomSpeed(), randomSpeed()));
    }
    background(toColor(0));
}

function draw() {
    loadPixels();
    balls.forEach(ball => {
        let nearBalls = balls.filter(nearBall => distance(nearBall.x, nearBall.y, ball.x, ball.y) < 2 * BOX_SIZE);
        for (let i = max(0, ball.x - EFFECTIVE_BALL_RADIUS); i < min(width, ball.x + EFFECTIVE_BALL_RADIUS); i++) {
            for (let j = max(0, ball.y - EFFECTIVE_BALL_RADIUS); j < min(height, ball.y + EFFECTIVE_BALL_RADIUS); j++) {
                updatePixel(i, j, nearBalls);
            }
        }
    });
    updatePixels();
    balls.forEach(ball => ball.move());
}

function updatePixel(x, y, balls) {
    let val = reduce(balls.map(b => distance(x, y, b.x, b.y)).map(sigm));
    set(x, y, toColor(val));
}


function reduce(arr) {
    let res = arr.reduce((a, b) => a + b, 0);
    return min(res, 1 - M);
}

function toColor(val) {
    return color(255 * val);
}

// Changed variant of https://en.wikipedia.org/wiki/Sigmoid_function
function sigm(dist) {
    return 1 / (1 + exp(dist * SLOPE - BALL_SIZE + BIAS));
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