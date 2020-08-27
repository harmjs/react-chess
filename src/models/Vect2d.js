const Vect2d = function(x, y) 
{
    this.x = x;
    this.y = y;
}

Vect2d.deserialize = function(key)
{
    const [x, y] = key.split(",");
    return new Vect2d(x, y);
}

Vect2d.prototype = {
    serialize: function()
    {
        return this.x + "," + this.y;
    },
    add: function(vect2d)
    {
        return new Vect2d(this.x + vect2d.x, this.y + vect2d.y);
    },
    subtract: function(vect2d)
    {
        return new Vect2d(this.x - vect2d.x, this.y - vect2d.y);
    },
    multiply: function(scalar)
    {
        return new Vect2d(this.x * scalar, this.y * scalar);
    },
    divide: function(scalar)
    {
        return new Vect2d(this.x / scalar, this.y / scalar);
    },
    transform: function(transform)
    {
        return new Vect2d(
            this.x * transform.scale.x + this.y * transform.skew.x 
                + transform.translate.x,
            this.y * transform.scale.y + this.x * transform.skew.y 
                + transform.translate.y);
    },
    round: function()
    {
        return new Vect2d(Math.round(this.x), Math.round(this.y));
    }
}

Vect2d.ONE = new Vect2d(1, 1);
Vect2d.ZERO = new Vect2d(0, 0);

export default Vect2d;