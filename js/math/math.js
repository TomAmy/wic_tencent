
/*
*	Vector3
*/

Vector3 = function ( x, y, z ) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
};
Vector3.prototype = {
	constructor: Vector3,
	set: function ( x, y, z ) {
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	},
	length: function () {
		return Math.sqrt( this.lengthSq() );
	},
	lengthSq: function () {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}
}

/*
*	Quaternion
*/
Quaternion = function( x, y, z, w ) {
	this.set(
		x || 0,
		y || 0,
		z || 0,
		w !== undefined ? w : 1
	);
};
Quaternion.prototype = {
	constructor: Quaternion,
	set: function ( x, y, z, w ) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		return this;
	},
	setFromRotationMatrix: function ( m ) {
		// Adapted from: http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
		function copySign(a, b) {
			return b < 0 ? -Math.abs(a) : Math.abs(a);
		}
		var absQ = Math.pow(m.determinant(), 1.0 / 3.0);
		this.w = Math.sqrt( Math.max( 0, absQ + m.n11 + m.n22 + m.n33 ) ) / 2;
		this.x = Math.sqrt( Math.max( 0, absQ + m.n11 - m.n22 - m.n33 ) ) / 2;
		this.y = Math.sqrt( Math.max( 0, absQ - m.n11 + m.n22 - m.n33 ) ) / 2;
		this.z = Math.sqrt( Math.max( 0, absQ - m.n11 - m.n22 + m.n33 ) ) / 2;
		this.x = copySign( this.x, ( m.n32 - m.n23 ) );
		this.y = copySign( this.y, ( m.n13 - m.n31 ) );
		this.z = copySign( this.z, ( m.n21 - m.n12 ) );
		this.normalize();
		return this;
	},
	normalize: function () {
		var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );
		if ( l === 0 ) {
			this.x = 0;
			this.y = 0;
			this.z = 0;
			this.w = 0;
		} else {
			l = 1 / l;
			this.x = this.x * l;
			this.y = this.y * l;
			this.z = this.z * l;
			this.w = this.w * l;
		}
		return this;
	}
}

/*
*	Matrix4
*/
Matrix4 = function ( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {
	this.set(
		( n11 !== undefined ) ? n11 : 1, n12 || 0, n13 || 0, n14 || 0,
		n21 || 0, ( n22 !== undefined ) ? n22 : 1, n23 || 0, n24 || 0,
		n31 || 0, n32 || 0, ( n33 !== undefined ) ? n33 : 1, n34 || 0,
		n41 || 0, n42 || 0, n43 || 0, ( n44 !== undefined ) ? n44 : 1
	);
};
Matrix4.prototype = {
	constructor: Matrix4,
	set: function( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {
		this.n11 = n11; this.n12 = n12; this.n13 = n13; this.n14 = n14;
		this.n21 = n21; this.n22 = n22; this.n23 = n23; this.n24 = n24;
		this.n31 = n31; this.n32 = n32; this.n33 = n33; this.n34 = n34;
		this.n41 = n41; this.n42 = n42; this.n43 = n43; this.n44 = n44;
		return this;
	},
	decompose: function ( translation, rotation, scale ) {
		var x = Matrix4.__v1;
		var y = Matrix4.__v2;
		var z = Matrix4.__v3;
		x.set( this.n11, this.n21, this.n31 );
		y.set( this.n12, this.n22, this.n32 );
		z.set( this.n13, this.n23, this.n33 );
		translation = ( translation instanceof Vector3 ) ? translation : new Vector3();
		rotation = ( rotation instanceof Quaternion ) ? rotation : new Quaternion();
		scale = ( scale instanceof Vector3 ) ? scale : new Vector3();
		scale.x = x.length();
		scale.y = y.length();
		scale.z = z.length();
		translation.x = this.n14;
		translation.y = this.n24;
		translation.z = this.n34;
		// scale the rotation part
		var matrix = Matrix4.__m1;
		matrix.copy( this );
		matrix.n11 /= scale.x;
		matrix.n21 /= scale.x;
		matrix.n31 /= scale.x;
		matrix.n12 /= scale.y;
		matrix.n22 /= scale.y;
		matrix.n32 /= scale.y;
		matrix.n13 /= scale.z;
		matrix.n23 /= scale.z;
		matrix.n33 /= scale.z;
		rotation.setFromRotationMatrix( matrix );
		return [ translation, rotation, scale ];
	},
	copy: function ( m ) {
		this.set(
			m.n11, m.n12, m.n13, m.n14,
			m.n21, m.n22, m.n23, m.n24,
			m.n31, m.n32, m.n33, m.n34,
			m.n41, m.n42, m.n43, m.n44
		);
		return this;
	},
	determinant: function () {
		var n11 = this.n11, n12 = this.n12, n13 = this.n13, n14 = this.n14,
		n21 = this.n21, n22 = this.n22, n23 = this.n23, n24 = this.n24,
		n31 = this.n31, n32 = this.n32, n33 = this.n33, n34 = this.n34,
		n41 = this.n41, n42 = this.n42, n43 = this.n43, n44 = this.n44;
		//TODO: make this more efficient
		//( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )
		return (
			n14 * n23 * n32 * n41-
			n13 * n24 * n32 * n41-
			n14 * n22 * n33 * n41+
			n12 * n24 * n33 * n41+

			n13 * n22 * n34 * n41-
			n12 * n23 * n34 * n41-
			n14 * n23 * n31 * n42+
			n13 * n24 * n31 * n42+

			n14 * n21 * n33 * n42-
			n11 * n24 * n33 * n42-
			n13 * n21 * n34 * n42+
			n11 * n23 * n34 * n42+

			n14 * n22 * n31 * n43-
			n12 * n24 * n31 * n43-
			n14 * n21 * n32 * n43+
			n11 * n24 * n32 * n43+

			n12 * n21 * n34 * n43-
			n11 * n22 * n34 * n43-
			n13 * n22 * n31 * n44+
			n12 * n23 * n31 * n44+

			n13 * n21 * n32 * n44-
			n11 * n23 * n32 * n44-
			n12 * n21 * n33 * n44+
			n11 * n22 * n33 * n44
		);
	}
}
Matrix4.__v1 = new Vector3();
Matrix4.__v2 = new Vector3();
Matrix4.__v3 = new Vector3();
Matrix4.__m1 = new Matrix4();
Matrix4.__m2 = new Matrix4();
