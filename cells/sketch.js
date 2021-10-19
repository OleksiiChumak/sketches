//const CELLS = 1000;
const CELLS = 200;
const WIDTH = 1800;
const HEIGHT = 700;
const PRE_DRAW_GROW = 10;


let COLOR_NUCLEUS;
let COLOR_BORDER;
let COLOR_BODY;


let field;


function setup() {
    createCanvas(WIDTH, HEIGHT);

    COLOR_NUCLEUS = color('white')
    COLOR_BORDER = color('white')
    COLOR_BODY = color(0, 127, 255)


    field = new Field(WIDTH, HEIGHT);

    for (let i = 0; i < CELLS; i++) {
        field.put(new CellPiece(), Math.floor(Math.random() * (WIDTH - 1)), Math.floor(Math.random() * (HEIGHT - 1)));
    }
    for (let i = 0; i < PRE_DRAW_GROW; i++) {
        field.grow();
    }

    /*setInterval(() => {
        makeChange(Math.floor(Math.random() * (WIDTH - 1)), Math.floor(Math.random() * (HEIGHT - 1)));
    }, 5000);*/
}

function mouseClicked() {
    makeChange(mouseX, mouseY)
}


function makeChange(x, y) {
    let cellPiece = field.get(x, y);
    if (!cellPiece) {
        field.put(new CellPiece(), x, y);
    } else {
        cellPiece.removeEntireCell();
        field.refreshBorders();
    }
}

function draw() {
    background('black');
    field.grow();
    field.drawField();
    document.title = getFrameRate();
}

// setInterval(() => {
//     if (field) {
//         let updated = field.grow();
//         // console.log(`Updated ${updated}`);
//     }
// }, 0);


class Field {
    width
    height
    pieces
    #piecesCopy
    #img

    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.pieces = Array(width).fill().map(() => Array(height).fill());
        this.#piecesCopy = Array(width).fill().map(() => Array(height).fill());
        this.#img = createImage(width, height);
    }

    #checkBounds(x, y) {
        if (this.isOutOfBounds(x, y)) {
            throw new Error(`${x} ${y} is out of bounds`);
        }
    }

    isOutOfBounds(x, y) {
        if (x < 0 || x > this.width - 1) {
            return true;
        }
        if (y < 0 || y > this.height - 1) {
            return true;
        }
        return false;
    }


    put(piece, x, y) {
        this.#checkBounds(x, y);
        if (!this.isEmpty(x, y)) {
            this.remove(x, y);
        }
        this.pieces[x][y] = piece;
        piece.onAdd(this, x, y);
    }


    remove(x, y) {
        this.#checkBounds(x, y);
        let oldPiece = this.pieces[x][y];
        if (oldPiece != null) {
            oldPiece.onRemove();
        }
        this.pieces[x][y] = null;
        this.#img.set(x, y, null);
    }

    drawField() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let piece = this.pieces[x][y];
                if (piece != null && piece.drawable) {
                    piece.drawCell(this.#img);
                }
            }
        }
        this.#img.updatePixels();
        image(this.#img, 0, 0);
    }

    grow() {
        let updated = 0;
        this.forEach(piece => {
            if (piece.updatable && piece.isOnField()) {
                updated++;
                piece.growCell()
            }
        })
        return updated;
    }

    refresh() {
        this.forEach(cell => cell.refresh());
    }

    refreshBorders() {
        this.forEach(cell => {
            if (cell.isBorder())
                cell.refresh()

        });
    }

    forEach(func) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.#piecesCopy[x][y] = this.pieces[x][y];
            }
        }
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.#piecesCopy[x][y]) {
                    func(this.#piecesCopy[x][y])
                }
            }
        }
    }

    get(x, y) {
        this.#checkBounds(x, y);
        return this.pieces[x][y];
    }

    isEmpty(x, y) {
        return !this.get(x, y);
    }

}

class CellPiece {

    static #NEIGHBORS_DELTAS = [[-1, 1], [0, 1], [1, 1],
        [-1, 0], [1, 0],
        [-1, -1], [0, -1], [1, -1]];

    updatable = true;
    drawable = true;
    #cachedBorder = null;
    #growDistance = null;

    constructor(nucleus = null) {
        this.nucleus = nucleus;
        if (!nucleus) {
            this.#growDistance = 0;
        }
    }

    removeEntireCell() {
        this.field.forEach(cell => {
                if (cell !== this && this.belongsToSameCell(cell)) {
                    this.field.remove(cell.x, cell.y);
                }
            }
        )
        this.field.remove(this.x, this.y);
    }

    onAdd(filed, x, y) {
        if (this.isOnField()) {
            throw "Can't be added. It's already belongs to field"
        }
        this.field = filed;
        this.x = x;
        this.y = y;
        this.distanceToNucleus = this.#calculateDistanceToNucleus();
    }

    onRemove() {
        if (!this.isOnField()) {
            throw "Can't be removed. It doesn't belong to field"
        }
        this.field = null;
        this.x = null;
        this.y = null;
        this.distanceToNucleus = null;
    }

    isOnField() {
        return !!this.field;
    }

    belongsToSameCell(anotherPiece) {
        if (!anotherPiece) {
            return false;
        } else {
            return this.#getNucleusCell() === anotherPiece.#getNucleusCell();
        }
    }

    refresh() {
        this.updatable = true;
        this.drawable = true;
        this.#cachedBorder = null;
    }

    growCell() {
        if (!this.isOnField()) {
            throw "Can't grow. It doesn't belong to field"
        }
        if (this.#isNucleus()) {
            this.#growDistance++;
        } else if (this.nucleus.#growDistance < this.distanceToNucleus) {
            return;
        }

        let grew = false;
        this.#loopOverNeighbors((x, y) => {
            let neighbor = this.field.get(x, y);
            if (neighbor == null) {
                this.#growOn(x, y);
                grew = true;
             }/*else if(!this.belongsToSameCell(neighbor) && this.distanceToNucleus < neighbor.distanceToNucleus){
               this.#growOn(x, y);
                 grew = true;
             }*/
        });
        this.updatable = grew || this.#isNucleus();
    }

    #growOn(x, y) {
        this.field.put(new CellPiece(this.#getNucleusCell()), x, y);
    }

    #getNucleusCell() {
        if (this.#isNucleus()) {
            return this;
        } else {
            return this.nucleus;
        }
    }

    #isNucleus() {
        return !this.nucleus;
    }

    #hasPlaceToGrow() {
        let placeToGrow = false;
        this.#loopOverNeighbors((x, y) => {
            let neighbor = this.field.get(x, y);
            if (!neighbor) {
                placeToGrow = true;
            }
        });
        return placeToGrow;
    }

    #isBorder() {
        let border = false;
        this.#loopOverNeighbors((x, y) => {
            let neighbor = this.field.get(x, y);
            if (!this.belongsToSameCell(neighbor)) {
                border = true;
            }
        });
        return border;
    }

    #calculateDistanceToNucleus() {
        if (this.#isNucleus()) {
            return 0;
        } else {
            let dx = this.x - this.nucleus.x;
            let dy = this.y - this.nucleus.y;
            return Math.sqrt(dx * dx + dy * dy)
        }
    }

    #loopOverNeighbors(func) {
        CellPiece.#NEIGHBORS_DELTAS.forEach(delta => {
            let nx = this.x + delta[0];
            let ny = this.y + delta[1];
            if (!field.isOutOfBounds(nx, ny)) {
                func(nx, ny);
            }
        });
    }

    isBorder() {
        return this.#cachedBorder === true || this.#isBorder();
    }

    drawCell(img) {
        if (!this.updatable) {
            this.drawable = false;
        }
        if (this.#isNucleus()) {
            img.set(this.x, this.y, COLOR_NUCLEUS);
            return;
        }
        if (!this.updatable && this.#cachedBorder == null) {
            this.#cachedBorder = this.#isBorder();
        }

        if (this.isBorder()) {
            img.set(this.x, this.y, COLOR_BORDER);
        } else {
            img.set(this.x, this.y, COLOR_BODY);
        }
    }
}

