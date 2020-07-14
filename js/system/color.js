export { Color };

// =========================================================================
/**
 * class representing a color used in particles and consisting of red, blue, green, and alpha channels
 */
class Color {
    // CONSTRUCTOR ---------------------------------------------------------
    /**
     * Create a new color
     * @param {*} r
     * @param {*} g
     * @param {*} b
     * @param {*} a
     */
    constructor(r, g, b, a=1) {
        this._r = r || 0;
        this._g = g || 0;
        this._b = b || 0;
        this.a = a;
        this.calcHSL();
    }

    // STATIC METHODS ------------------------------------------------------
    static fromHSL(h, s, l, a=1) {
        let c = new Color();
        c._h = h;
        c._s = s;
        c._l = l;
        c.a = a;
        c.calcRGB();
        return c;
    }

    // PROPERTIES ----------------------------------------------------------
    get h() { return this._h; }
    set h(value) { this._h = value; this.calcRGB(); }
    get s() { return this._s; }
    set s(value) { this._s = value; this.calcRGB(); }
    get l() { return this._l; }
    set l(value) { this._l = value; this.calcRGB(); }

    get r() { return this._r; }
    set r(value) { this._r = value; this.calcHSL(); }
    get g() { return this._g; }
    set g(value) { this._g = value; this.calcHSL(); }
    get b() { return this._b; }
    set b(value) { this._b = value; this.calcHSL(); }

    // METHODS -------------------------------------------------------------
    /**
     * using instance RGB values, calculate corresponding HSL values
     */
    calcHSL() {
        let r = this.r/255;
        let g = this.g/255;
        let b = this.b/255;
        let max = Math.max(r, g, b)
        let min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if(max == min){
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        this._h = Math.round(h * 360);
        this._s = Math.round(s * 100);
        this._l = Math.round(l * 100);
    }

    /**
     * helper function to convert hue to rgb
     */
    hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    /**
     * using instance HSL values, calculate corresponding RGB values
     */
    calcRGB() {
        let h = this.h/360;
        let s = this.s/100;
        let l = this.l/100;
        let r, g, b;
        if (s == 0){
            r = g = b = l; // achromatic
        } else {
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = this.hue2rgb(p, q, h + 1/3);
            g = this.hue2rgb(p, q, h);
            b = this.hue2rgb(p, q, h - 1/3);
        }
        this._r = Math.round(r * 255); 
        this._g = Math.round(g * 255); 
        this._b = Math.round(b * 255);
    }

    /**
     * create a copy of the current color
     */
    copy() {
        return new Color(this.r, this.g, this.b, this.a);
    }

    /**
     * convert to string compatable w/ fillStyle/strokeStyle using HSL values
     */
    asHSL(ao) {
        return "hsla(" + this.h + "," + this.s + "%," + this.l + "%," + ((ao == undefined) ? this.a : ao) + ")";
    }

    /**
     * convert to string compatable w/ fillStyle/strokeStyle using HSL values
     */
    asRGB(ao) {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + ((ao == undefined) ? this.a : ao) + ")";
    }

    /**
     * convert to string compatable w/ fillStyle/strokeStyle
     */
    toString() {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }
}
