const RADIUS = 25;
const BUBBLES = 5;
const JIGGLE_FREQUENCY = 0.02;
const JIGGLE_DISTANCE = 3.5 * RADIUS;
const FILL = false;

const CELL_SIZE = 1;

const MARGIN = RADIUS;
const D = func(RADIUS);


let blobs;

function setup() {
    createCanvas(300, 300);
    //noFill();
    blobs = [new Blob(width / 2, height / 2)];

}

function draw() {
    background(0, 60);
    blobs.forEach(
        blob => blob.draw()
    );
}

function func(dist) {
    return 1 / (dist * dist);
}

class Blob {
    constructor(x, y) {
        this.points = new Array(BUBBLES).fill(null).map(() => new Point(x, y));
        this.x = x;
        this.y = y;

        this.biases = new Array(BUBBLES).fill(null).map(() => random(TWO_PI / JIGGLE_FREQUENCY));
        this.updateDimensions();
    }

    updateDimensions() {
        let x1, y1, x2, y2;

        x1 = this.points[0].x;
        y1 = this.points[0].y;
        x2 = this.points[0].x;
        y2 = this.points[0].y;

        for (let i = 1; i < this.points.length; i++) {
            let p = this.points[i];
            x1 = min(x1, p.x);
            y1 = min(y1, p.y);

            x2 = max(x2, p.x);
            y2 = max(y2, p.y);
        }

        this.leftTop = new Point(x1 - RADIUS - MARGIN, y1 - RADIUS - MARGIN);
        this.widht = x2 - this.leftTop.x + RADIUS + MARGIN;
        this.height = y2 - this.leftTop.y + RADIUS + MARGIN;
    }

    jiggle() {
        for (let i = 0, a = 0; i < BUBBLES; i++, a += TWO_PI / BUBBLES) {
            let point = this.points[i];
            point.x = this.x + cos(a) * JIGGLE_DISTANCE * sin(JIGGLE_FREQUENCY * this.biases[i]++);
            point.y = this.y + sin(a) * JIGGLE_DISTANCE * sin(JIGGLE_FREQUENCY * this.biases[i]++);
        }
        this.updateDimensions();
    }


    _indexX(i) {
        return this.leftTop.x + i * CELL_SIZE;
    }

    _indexY(j) {
        return this.leftTop.y + j * CELL_SIZE;
    }


    _scan() {
        let pixs = [];
        for (let i = 0; i * CELL_SIZE <= this.widht; i++) {
            pixs[i] = [];
            let x = this._indexX(i);
            for (let j = 0; j * CELL_SIZE <= this.height; j++) {
                let y = this._indexY(j);
                let s = this.points.map(p => this.val(p, x, y)).reduce((a, b) => a + b, 0);
                pixs[i][j] = s >= D;
            }
        }
        return pixs;
    }

    _toPixs() {
        let pixs = this._scan();
        if (!FILL) {
            let copyPixs1 = [];
            let copyPixs2 = [];
            for (let i = 0; i < pixs.length; i++) {
                copyPixs1[i] = pixs[i].slice();
                copyPixs2[i] = pixs[i].slice();
            }
            for (let i = 1; i < pixs.length - 1; i++) {
                for (let j = 1; j < pixs[i].length - 1; j++) {
                    if (pixs[i][j - 1] && pixs[i][j + 1]) {
                        copyPixs1[i][j] = false;
                    }
                }
            }
            for (let j = 1; j < pixs[0].length - 1; j++) {
                for (let i = 1; i < pixs.length - 1; i++) {
                    if (pixs[i - 1][j] && pixs[i + 1][j]) {
                        copyPixs2[i][j] = false;
                    }
                }
            }
            for (let i = 0; i < pixs.length; i++) {
                for (let j = 0; j < pixs[i].length; j++) {
                    pixs[i][j] = copyPixs1[i][j] || copyPixs2[i][j];
                }
            }
        }
        return pixs;
    }

    draw() {
        this.jiggle();

        stroke(255);
        this._drawPixs(this._toPixs());

        //stroke(color(255, 0, 0));
        //this.points.forEach(p => ellipse(p.x, p.y, 2 * RADIUS));
    }

    _drawPixs(pixs) {
        for (let i = 0; i < pixs.length; i++) {
            let x = this._indexX(i);
            for (let j = 0; j < pixs[i].length; j++) {
                let y = this._indexY(j);
                if (pixs[i][j]) {
                    if (CELL_SIZE === 1)
                        point(x, y);
                    else
                        rect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    val(center, x, y) {
        let dx = center.x - x;
        let dy = center.y - y;
        return func(sqrt(dx * dx + dy * dy));
    }

}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

