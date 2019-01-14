const MAX_TRUNK_HEIGHT = 90;
const BRANCH_RATIO = 0.75;
const MAX_ANGLE = Math.PI / 7;
const MAX_DEPTH = 10;

let trunk_height = 1;

function setup() {
    createCanvas(400, 400);
}

function draw() {
    background(10);

    translate(width / 2, height);
    stroke(color(0, 153, 0));
    branch(trunk_height);
    trunk_height = min(trunk_height + 1, MAX_TRUNK_HEIGHT);
}

function branch(len, depth = 0) {
    strokeWeight(sqrt(len)*1.2);
    line(0, 0, 0, -len);
    if (depth < MAX_DEPTH) {
        let angle = MAX_ANGLE * trunk_height / MAX_TRUNK_HEIGHT;
        translate(0, -len);
        push();
        rotate(angle);
        branch(len * BRANCH_RATIO, depth + 1);
        pop();
        push();
        rotate(-angle);
        branch(len * BRANCH_RATIO, depth + 1);
        pop();
    }
}
