const POPULATIONS = 50;

const WINNERS = 30;

const TRIANGLES = 100;

const MUTATION_CHANCE = 0.01;
const COLOR_MUTATION = 50;
const POSITION_MUTATION = 50;

const TIMEOUT = 0;

let generation = 0;

let width;
let height;
let data;

let winnerCtx;
let images = [];
let bestDistance = undefined;

(function () {
    let srtImg = new Image();
    srtImg.src = 'img.jpg';

    srtImg.onload = function () {
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');

        canvas.width = srtImg.width;
        canvas.height = srtImg.height;
        ctx.drawImage(srtImg, 0, 0);

        width = srtImg.width;
        height = srtImg.height;
        data = ctx.getImageData(0, 0, width, height).data;

        let winnerCanvas = document.getElementById('winnerCanvas');
        winnerCanvas.width = srtImg.width;
        winnerCanvas.height = srtImg.height;
        winnerCtx = winnerCanvas.getContext('2d');
        //createChart();
        createImages();
        run();
    };
})();

function createImages() {
    let populationContainer = document.getElementById('populationContainer');
    for (let i = 0; i < POPULATIONS; i++) {
        let newCanvas = document.createElement('canvas');
        newCanvas.setAttribute("id", `canvas${i}`);
        newCanvas.width = width;
        newCanvas.height = height;
        images.push(Img.random(newCanvas.getContext('2d')));
        populationContainer.appendChild(newCanvas);
    }
}

function run(timeout = 0) {
    setTimeout(() => {
        drawImages();
        mutateImages();
        run(TIMEOUT);
    }, timeout);
}

function drawImages() {
    images.forEach(img => img.draw());
}

function mutateImages() {
    images.sort((i1, i2) => i1.distance() - i2.distance());

    if (!bestDistance || bestDistance > images[0].distance()) {
        bestDistance = images[0].distance();
        images[0].draw(winnerCtx);
    }
    document.title = `G: ${generation++}. Likeness: ${likeness(bestDistance).toFixed(3)}%`;

    newImages = [];
    for (let i = 0; i < images.length; i++) {
        newImages.push(images[i % WINNERS].mutate(images[i].ctx));
    }

    images = newImages;
}

function likeness(distance) {
    return 100 * (1 - distance / (255 * 4 * width * height));
}


class Img {
    constructor(ctx, triangels) {
        this.ctx = ctx;
        this.triangles = triangels;
    }

    draw(ctx = this.ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        this.triangles.forEach(t => t.draw(ctx));
    }

    distance() {
        if (typeof this._distance === "undefined") {
            let imgData = this.ctx.getImageData(0, 0, width, height).data;
            this._distance = 0;
            for (let i = 0; i < data.length; i++) {
                this._distance += Math.abs(data[i] - imgData[i]);
            }
        }
        return this._distance;
    }

    mutate(context = this.ctx) {
        return new Img(context, this.triangles.map(t => t.mutate()));
    }

    static random(ctx) {
        let triangles = [];
        for (let i = 0; i < TRIANGLES; i++) {
            triangles.push(Triangle.random());
        }
        return new Img(ctx, triangles);
    }


}

class Triangle {
    constructor(p1, p2, p3, color) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b},${this.color.a / 255})`;
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineTo(this.p3.x, this.p3.y);
        ctx.fill();
    }

    mutate() {
        return new Triangle(
            this.p1.mutate(),
            this.p2.mutate(),
            this.p3.mutate(),
            this.color.mutate()
        );
    }

    static random() {
        return new Triangle(
            Point.random(),
            Point.random(),
            Point.random(),
            Color.random()
        )
    }
}


function noise(magnitude) {
    return Math.random() * magnitude - magnitude / 2;
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    mutate() {
        if (Math.random() <= MUTATION_CHANCE) {
            return new Point(this.x + noise(POSITION_MUTATION), this.y + noise(POSITION_MUTATION));
        } else {
            return this.copy();
        }
    }

    copy() {
        return new Point(this.x, this.y);
    }

    static random() {
        return new Point(width * Math.random(), height * Math.random());
    }
}

class Color {
    constructor(r, g, b, a) {
        this.r = Color._norm(r);
        this.g = Color._norm(g);
        this.b = Color._norm(b);
        this.a = Color._norm(a);
    }

    static _norm(c) {
        return Math.min(Math.max(0, c), 255);
    }

    mutate() {
        if (Math.random() <= MUTATION_CHANCE) {
            return new Color(
                this.r + noise(COLOR_MUTATION),
                this.g + noise(COLOR_MUTATION),
                this.b + noise(COLOR_MUTATION),
                this.a + noise(COLOR_MUTATION)
            );
        } else {
            return this.copy();
        }
    }

    copy() {
        return new Color(
            this.r,
            this.g,
            this.b,
            this.a
        );
    }

    static random() {
        return new Color(255 * Math.random(), 255 * Math.random(), 255 * Math.random(), 255 * Math.random());
    }
}
