/*
*	accelerometer
*/
function Accelerometer(){


	//	Vec3
	this.vec3Acc = new Vector3();
	this.vec3AccGrav = new Vector3();
	this.vec3Rotation = new Vector3();
	this.vec3LowPass = new Vector3();
	//
	this.listeners = [];
	//
	this.init();
}

Accelerometer.prototype = {
	
	//	Constructor
	constructor: Accelerometer,
	
	//	Initiate
	init: function(){

		var self = this;
		var tc = 0.5;			//	Time delta constant
		var ox = 0;				//	Old X position
		var oy = 0;				//	Old Y position
		var sm = 15;			//	Smoothing
		var x = 0;
		var y = 0;


		var onMotion = function(e){

			self.vec3Acc = (e.acceleration) ? e.acceleration : 0;
			self.vec3AccGrav = (e.accelerationIncludingGravity) ? e.accelerationIncludingGravity : 0;

			if(e.rotationRate){
				self.vec3Rotation.x = e.rotationRate.alpha;
				self.vec3Rotation.y = e.rotationRate.beta;
				self.vec3Rotation.z = e.rotationRate.gamma;
			}else{
				self.vec3Rotation = 0;
			}

			x = self.vec3AccGrav.x;
			y = self.vec3AccGrav.y;

			/*
			*	Low pass filter X
			*/				
			x = ox + (x - ox) / (sm / tc);
			ox = x;
			/*
			*	Low pass filter Y
			*/				
			y = oy + (y - oy) / (sm / tc);
			oy = y;

			self.vec3LowPass.x = x;
			self.vec3LowPass.y = y;


			self.post('onMotionUpdate');

		}
		/*
		*
		*/
		if (window.DeviceMotionEvent) 
		{
				window.addEventListener('devicemotion', onMotion, false);
			}
			else
			{
				return false;
			}

	},

	post:function(type){
		//	For each listener
		for(var i = 0; i < this.listeners.length; i++){

			if(this.listeners[i].type===type){

				switch(type){
					case 'onMotionUpdate':
						this.listeners[i].callback.call(this, {vec3:this.vec3AccGrav});
						break;
					default:
						return false;
						break;
				}
			}
		}
	},

	addEventListener:function(type, callback){
		//	Listener list
		this.listeners.push({
			type:type,
			callback:callback
		});
	},

	removeEventListener:function(type){

		for (var i = 0; i < this.listeners.length; i++) {
			if(this.listeners[i].type===type){
				this.listeners.splice(i,1);
			}
		};
		
	}

}

/*
*	blocker
*/
function Blocker(){

	this.vec3 = new Vector3();
	/*
	*	Ranges LEFT, RIGHT, UP, DOWN
	*/
	this.range = {};
	/*
	*
	*/
	this.rangeSpanX = 80;
	this.rangeSpanY = 180;
	/*
	*
	*/
	this.rangeL = (this.rangeSpanX/2);
	this.rangeR = -(this.rangeSpanX/2);
	/*
	*
	*/
	this.rangeU = 180;
	this.rangeD = 0;
	/*
	*	Range offSets
	*/
	this.offsetX = 0;
	// this.offsetY = 0;
	/*
	*	Previous measurements
	*/
	this.lastX = 0;
	this.lastY = 0;
	/*
	*	Rotations
	*/
	this.rotationsX = 0;
	this.rotationsY = 0;

}

Blocker.prototype = {

	constructor: Blocker,

	set:function(e){

		this.rangeSpanX = e.x;
		this.rangeSpanY = e.y;
		//
		this.rangeL = (this.rangeSpanX/2);
		this.rangeR = -(this.rangeSpanX/2);

	},

	block:function (e){
		/*
		*	Put X on a linear measurement instead of cirular (e.g. -Infinite <> Infinite and not 0 <> 360):
		*/
		if((this.lastX-e.x) < -180) // If the lastX - e.x (current X) is less than -180 (e.g. lastX = 10˚ and e.x = 350˚)
		{
			/*
			*	This means that the user if moving to the RIGHT past 2πr
			*/
			this.rotationsX--;
		}
		else if((this.lastX-e.x) > 180) // If the lastX - e.x (current X) is greater than 180 (e.g. lastX = 350˚ and e.x = 10˚)
		{
			/*
			*	This means that the user if moving to the LEFT past 2πr
			*/
			this.rotationsX++;
		}
		/*
		*	Set the new X position to e.x (current X) + (rotationsX * 360)
		*/
		var x = e.x+(this.rotationsX*360)
		/*
		*
		*/
		if(x > this.rangeL){	//	If X is greater than its LEFT range
			/*
			*	Catch offset
			*/
			this.offsetX = x - (this.rangeSpanX/2);
			/*
			*	Update ranges
			*/
			this.rangeL = x;
			this.rangeR = x - this.rangeSpanX;
		}
		else if(x < this.rangeR) { 	//	Else if X is less than its RIGHT range
			/*
			*	Catch offset
			*/
			this.offsetX = x + (this.rangeSpanX/2);
			/*
			*	Update ranges
			*/
			this.rangeL = x + this.rangeSpanX;
			this.rangeR = x;
		}
		/*
		*	Update X
		*/
		x -= this.offsetX;
		/*
		*	Set lastX
		*/
		this.lastX = e.x;
		/*
		*	Put Y on a linear measurement instead of cirular (e.g. -Infinite <> Infinite and not 0 <> 360):
		*/
		if((this.lastY-e.y) < -180) // If the lastY - e.y (current Y) is less than -180 (e.g. lastY = 10˚ and e.y = 350˚)
		{
			/*
			*	This means that the user if moving to the RIGHT past 2πr
			*/
			this.rotationsY--;
		}
		else if((this.lastY-e.y) > 180) // If the lastY - e.y (current Y) is greater than 180 (e.g. lastY = 350˚ and e.y = 10˚)
		{
			/*
			*	This means that the user if moving to the LEFT past 2πr
			*/
			this.rotationsY++;
		}
		/*
		*	Set the new Y position to e.y (current Y) + (rotationsY * 360)
		*/
		var y = e.y+(this.rotationsY*360)
		/*
		*
		*/
		if(y > this.rangeU){	//	If Y is greater than its LEFT range
			/*
			*	Catch offset
			*/
			// this.offsetY = y + 180;
			/*
			*	Update ranges
			*/
			this.rangeU = y;
			this.rangeD = y - this.rangeSpanY;
		}
		else if(y < this.rangeD) { 	//	Else if Y is less than its RIGHT range
			/*
			*	Catch offset
			*/
			// this.offsetY = y;
			/*
			*	Update ranges
			*/
			this.rangeU = y + this.rangeSpanY;
			this.rangeD = y;
		}
		/*
		*
		*/
		// y -= this.offsetY;
		/*
		*	Set lastY
		*/
		if(e.y <= 0) {
			e.y = 0;
		}
		else if(e.y >= 180) {
			e.y = 180;
		}
		this.lastY = e.y;
		/*
		*
		*/
		this.vec3.set(x,y,e.z);
		/*
		*
		*/
		return this.vec3;
	}
}

/*
*	gyro
*/
function toRad(deg){ var radian = (deg*Math.PI) / 180; return radian;}
function toDeg(rad){ var degree = (rad*180) / Math.PI; return degree;}

function Gyro(user){

	//	3D Sample
	this.s = document.createElement('DIV');
	//	Sample Matrix
	this.matrix = new Matrix4();
	//	Set co-ords
	this.vec3 = new Vector3();
	//	Orientation
	this.orientation = 0;
	//	Mozilla invert
	this.invert = 1;
	//	Prefix
	this.prefix = user.prefix;
	//
	this.listeners = []
	//	Initiate
	this.init();

}

Gyro.prototype = {
	
	//	Constructor
	constructor: Gyro,
	
	//	Initiate
	init: function(){
		//	Append the sample to the body
		document.body.appendChild(this.s);
		//	Set the orientation
		this.updateOrientation(null);
		//	Invert mozilla signal
		this.invert = (this.prefix.js.toLowerCase()==='moz') ? -1 : 1;
		//	Start degree check
		this.degree();

	},

	post:function(type){
		//	For each listener
		for(var i = 0; i < this.listeners.length; i++){

			if(this.listeners[i].type===type){

				switch(type){
					case 'onMotionUpdate':
						this.listeners[i].callback.call(this, {orientation:this.orientation, vec3:this.vec3});
						break;
					default:
						return false;
						break;
				}
			}
		}
	},

	addEventListener:function(type, callback){
		//	Listener list
		this.listeners.push({
			type:type,
			callback:callback
		});
	},

	removeEventListener:function(type){

		for (var i = 0; i < this.listeners.length; i++) {
			if(this.listeners[i].type===type){
				this.listeners.splice(i,1);
			}
		};
		
	},

	degree:function(){
		/*
		*
		*/
		var self = this;
		var x = 0;				//	X co-ordinate
		var y = 0;				//	Y co-ordinate
		var z = 0;				//	Z co-ordinate
		var q = {};				//	Quarternion object
		var s = self.s;			//	3D sample
		var lx = 0;				//	Last X
		var rx = 0;				//	Rotations around X
		var tc = 0.5;			//	Time delta constant
		var ox = 0;				//	Old X position
		var oy = 0;				//	Old Y position
		var oz = 0;				//	Old Z position
		var sm = 0;				//	Smoothing
		var ts = [];			//	Timestamp Array
		var td = 0;				//	Timestamp delta
		var ds = [];			//	Timestamp delta list
		var fr = 0;				//	Fail Rate
		var sl = 50;			//	Sampling length
		/*
		*
		*	
		*
		*/
		var updateDegree = function(e){

			//	Set the orientation
			self.updateOrientation(null);

			if(self.orientation==90 || self.orientation==-90){

				self.vec3.set(e.alpha*self.invert, ((e.gamma)*(self.orientation/90)*-1)*self.invert, (e.beta*((self.orientation/90)))*self.invert);

			}else{

				//	Update sample
				s.style[self.prefix.js+'Transform'] = "rotateY(" + -e.gamma + "deg) rotateX(" + e.beta + "deg) rotateZ(" + e.alpha + "deg)";
				//	Get the sample's styles
				var cs = window.getComputedStyle(s, null);
				//	Retrieve matrix3d and split out the individual nodes
				var n = cs.getPropertyValue(self.prefix.css + 'transform').split('(')[1].split(')')[0].split(',');
				//	Update matrix
				self.matrix.set(n[0],n[1],n[2],n[3],n[4],n[5],n[6],n[7],n[8],n[9],n[10],n[11],n[12],n[13],n[14],n[15])
				//	Decompose matrix to get quarternion
				q = self.matrix.decompose()[1];
				//	Set atanX
				var atanX = q.w*q.w - q.x*q.x - q.y*q.y + q.z*q.z
				//	Set pitch from quarternions
				var pitch = Math.atan2(2*(q.y*q.z + q.w*q.x), atanX);
				//	Set X portait
				x = (self.orientation==180) ? e.alpha + -e.gamma : e.alpha + e.gamma
				y = (toDeg(pitch) < 0) ? toDeg(pitch)*-1 : toDeg(pitch)
				z = (toDeg(Math.asin(-2*(q.x*q.z - q.w*q.y))))
				/*
				*	Put X on a linear measurement instead of cirular (e.g. -Infinite <> Infinite and not 0 <> 360):
				*/
				if((lx-x) < -180) // If the lastX - x (current X) is less than -180 (e.g. lastX = 10˚ and x = 350˚)
				{	
					/*
					*	This means that the user if moving to the RIGHT past 2πr
					*/
					rx--;
				}
				else if((lx-x) > 180) // If the lastX - x (current X) is greater than 180 (e.g. lastX = 350˚ and x = 10˚)
				{
					/*
					*	This means that the user if moving to the LEFT past 2πr
					*/
					rx++;
				}
				/*
				*	Delcare previous X before updating
				*/
				lx = x
				/*
				*	Update the X position to x (current X) + (rotationsX * 360)
				*/
				x += (rx*360);
				/*
				*
				*/
				if(sl > 0){
					/*
					*	Collect time stamp
					*/
					ts.unshift(Date.now()/1000);
					/*
					*	If the time stamp list is over the history length, reduce
					*/
					while(ts.length > 5){ ts.pop() }
					/*
					*	Get the time delta 
					*/
					td = (((ts[0]%60) - (ts[ts.length-1]%60))*100).toFixed(1);
					/*
					*	If the time delta is less than 15 (aka more gyro samples per second means the device has an erratic signal), fail the sample data, else success (good signal). Then add result to delta sample.
					*/
					ds.unshift((td <  15) ? 0 : 1);
					/*
					*	If time delta sample (Fail) list is greater than history, reduce
					*/
					while(ds.length > 20){ ds.pop() }
					/*
					*	Reset the fail rate
					*/
					fr = 0;
					/*
					*	Sum up the list
					*/
					for(var i = 0; i < ds.length; i++){
						fr += ds[i];
					}
					/*
					*	If the sum is less than the delta sample length, it need more smoothing as the device has an erratic signal, else the signal is fine to use.
					*/
					((fr/ds.length-1) <  0) ? sm = 25 : sm = 3;
					/*
					*	Reduce sample length. By "sl = 0" the device should be calibrated.
					*/
					sl--;
				}
				/*
				*	Apply Low pass filter X
				*/				
				x = ox + (x - ox) / (sm / tc);
				ox = x;
				/*
				*	Apply Low pass filter Y
				*/				
				y = oy + (y - oy) / (sm / tc);
				oy = y;
				/*
				*	Apply Low pass filter Z
				*/				
				z = oz + (z - oz) / (sm / tc);
				oz = z;
				/*
				*
				*/
				self.vec3.set(x*self.invert, y*self.invert, z*self.invert);

			}
			/*
			*
			*/
			self.post('onMotionUpdate');

		}

		window.addEventListener('deviceorientation', updateDegree, false);

	},

	updateOrientation:function(e){
		//
		var self = this;
		//	Get orientation
		switch(window.orientation) 
		{  
			case -90: 	//	Landscape
				//	Set orientation
				self.orientation = window.orientation;
			break; 
			case 0: 	//	Portrait
				//	Set orientation
				self.orientation = window.orientation;
			break;
			case 90: 	//	Landscape
				//	Set orientation
				self.orientation = window.orientation;
			break;
			case 180: 	//	Portrait
				//	Set orientation
				self.orientation = window.orientation;
			break;
		}
	}
}

/*
*	inertia
*/
function reset(){
	//	Initial co-ords
	this.currentX = 0;
	this.currentY = 0;
	//	Touch start caching variables
	this.touchStartX = 0;
	this.touchStartY = 90;
	//	Current touch caching variables
	this.touchCurrentX = 0;
	this.touchCurrentY = 0;
	//	Last current touch caching variables
	this.touchLastCurrentX = 0;
	this.touchLastCurrentY = 0;
	//	The delta value of the current co-ords variables
	this.deltaX = 0;
	this.deltaY = 0;
	//	Increment
	this.time = 0;
	//
	this.vec3.set(0,0,0)
}


function Inertia(easeFunction, duration, scalar){

	this.easeFunction = easeFunction;
	//	Is the app tracking the delta
	this.trackDelta = false;
	//	Duration of the inertia
	this.duration = duration;
	//	Scalar to boost the delta value
	this.scalar = scalar;
	//	Vec3 Object
	this.vec3 = new Vector3();
	//
	reset.call(this);
	//
	this.listeners = [];
	//
	this.delta = {
		x:[],
		y:[]
	}
	this.deltaHistory = 5;
	//
	this.init();
}

Inertia.prototype = {

	constructor: Inertia,

	init:function(){
		this.events();
		this.ease();
	},

	reset:function(){
		reset.call(this);
	},

	post:function(type){

		//	For each listener
		for(var i = 0; i < this.listeners.length; i++){

			if(this.listeners[i].type===type){

				switch(type){
					case 'onMotionUpdate':
						this.listeners[i].callback.call(this, {vec3:this.vec3});
						break;
					default:
						return false;
						break;

				}
			}
		}
	},

	addEventListener:function(type, callback){
		//	Listener list
		this.listeners.push({
			type:type,
			callback:callback
		});
	},

	removeEventListener:function(type){
		//	Listener list
		for (var i = 0; i < this.listeners.length; i++) {

			if(this.listeners[i].type===type){
				this.listeners.splice(i,1);

			}

		};
	},

	events:function(){

		var self = this;

		var eventCatcher = function (e){

			var touchPoints = (typeof e.changedTouches !== 'undefined') ? e.changedTouches : [e];

			if(e.type.match(/down|start/i)){
				//	Cache touch starting position
				self.touchStartX = parseInt(touchPoints[0].clientX);
				self.touchStartY = parseInt(touchPoints[0].clientY);
				//	Track the movement delta
				self.trackDelta = true;
				//
				this.deltaX	= 0;
				this.deltaY = 0;
				//
				self.delta.x = [];
				self.delta.y = [];
			}

			if(e.type.match(/move/i)){
				e.preventDefault();
				//
				if(self.trackDelta){
					//	On more, update the slide
					self.vec3.x = (self.currentX + parseInt(touchPoints[0].clientX)) - self.touchStartX;
					self.vec3.y = (self.currentY + parseInt(touchPoints[0].clientY)) - self.touchStartY;
					//	Cache the current co-ords on the touch
					self.touchCurrentX = parseInt(touchPoints[0].clientX);
					self.touchCurrentY = parseInt(touchPoints[0].clientY);
					//
					self.post('onMotionUpdate');
					//
					self.getDelta();
				}
			}

			if(e.type.match(/up|end|leave/i)){
				//	Cache last touch starting position for the inertia to take over
				self.touchStartX = self.vec3.x;
				self.touchStartY = self.vec3.y;
				//	Stop trackin the movement delta
				self.trackDelta = false;
				//	Reset the inertia timer to 0
				self.time = 0;
			}

			if(e.type.match(/cancel/i)){
				//
				this.deltaX	= 0;
				this.deltaY = 0;
				//
				self.delta.x = [];
				self.delta.y = [];
				//
				e.preventDefault();
			}
		}


		if(window.navigator.msPointerEnabled){
			//
			if(typeof document.body.style.msTouchAction !== 'undefined') {
				document.body.style.msTouchAction = 'none';
			}
			//	msPointerEvents
			window.addEventListener("MSPointerDown", eventCatcher, false);
  			window.addEventListener("MSPointerMove", eventCatcher, false);
  			window.addEventListener("MSPointerUp", eventCatcher, false);

		}else if('ontouchstart' in window){
			//	TouchEvents
			window.addEventListener('touchstart', eventCatcher, false);
			window.addEventListener('touchmove', eventCatcher, false);
			window.addEventListener('touchend', eventCatcher, false);
			window.addEventListener("touchleave", eventCatcher, false);
			window.addEventListener("touchcancel", eventCatcher, false);
		}

		//	desktop catch all
		window.addEventListener("mousedown", eventCatcher, false);
			window.addEventListener("mousemove", eventCatcher, false);
			window.addEventListener("mouseup", eventCatcher, false);

	},

	/*
	*
	*	Easing equations: http://www.gizma.com/easing/
	*
	*/

	linearTween:function (t, b, c, d) {
		return c*t/d + b;
	},

	easeInQuad:function (t, b, c, d) {
		t /= d;
		return c*t*t + b;
	},

	easeOutQuad:function(t, b, c, d) {
		t /= d;
		return -c * t*(t-2) + b;
	},

	easeInOutQuad:function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t + b;
		t--;
		return -c/2 * (t*(t-2) - 1) + b;
	},

	easeInCubic:function (t, b, c, d) {
		t /= d;
		return c*t*t*t + b;
	},

	easeOutCubic:function (t, b, c, d) {
		t /= d;
		t--;
		return c*(t*t*t + 1) + b;
	},

	easeInOutCubic:function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t*t + b;
		t -= 2;
		return c/2*(t*t*t + 2) + b;
	},

	easeInQuart:function (t, b, c, d) {
		t /= d;
		return c*t*t*t*t + b;
	},

	easeOutQuart:function (t, b, c, d) {
		t /= d;
		t--;
		return -c * (t*t*t*t - 1) + b;
	},

	easeInOutQuart:function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t*t*t + b;
		t -= 2;
		return -c/2 * (t*t*t*t - 2) + b;
	},

	easeInQuint:function (t, b, c, d) {
		t /= d;
		return c*t*t*t*t*t + b;
	},

	easeOutQuint:function (t, b, c, d) {
		t /= d;
		t--;
		return c*(t*t*t*t*t + 1) + b;
	},

	easeInOutQuint:function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t*t*t*t + b;
		t -= 2;
		return c/2*(t*t*t*t*t + 2) + b;
	},

	easeInSine:function (t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},

	easeOutSine:function (t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},

	easeInOutSine:function (t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},

	easeInExpo:function (t, b, c, d) {
		return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
	},

	easeOutExpo:function (t, b, c, d) {
		return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
	},

	easeInOutExpo:function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
		t--;
		return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
	},

	easeInCirc:function (t, b, c, d) {
		t /= d;
		return -c * (Math.sqrt(1 - t*t) - 1) + b;
	},

	easeOutCirc:function (t, b, c, d) {
		t /= d;
		t--;
		return c * Math.sqrt(1 - t*t) + b;
	},

	easeInOutCirc:function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		t -= 2;
		return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
	},

	/*
	*
	*	Easing equations end
	*
	*/

	getDelta:function(){

		//	The delta = the current X - the last X
		this.deltaX = this.touchCurrentX - this.touchLastCurrentX;
		this.deltaY = this.touchCurrentY - this.touchLastCurrentY;
		//	Update the last X for the next run
		this.touchLastCurrentX = this.touchCurrentX;
		this.touchLastCurrentY = this.touchCurrentY;
		//
		this.delta.x.unshift(this.deltaX);
		this.delta.y.unshift(this.deltaY);
		//
		while(this.delta.x.length > this.deltaHistory){
			this.delta.x.pop();
		}
		//
		while(this.delta.y.length > this.deltaHistory){
			this.delta.y.pop();
		}

	},

	ease:function (){

		var self = this;

		// shim layer with setTimeout fallback
		window.requestAnimFrame = (function(){

			return		window.requestAnimationFrame       ||
						window.webkitRequestAnimationFrame ||
						window.mozRequestAnimationFrame    ||
						function( callback ){
							window.setTimeout(callback, 1000 / 60);
						};

		})();

		(function animate(){

			requestAnimFrame(animate);

			if(!self.trackDelta && self.time <= self.duration){

				/*
				*	@:self[self.easeFunction](t, b, c, d)
				*		t: Current time
				*		b: Start X/Y/ALPHA etc position
				*		c: End X/Y/ALPHA etc position
				*		d: Duration
				*/

				self.currentX = self[self.easeFunction](self.time, self.touchStartX, self.deltaX*self.scalar, self.duration);
				self.currentY = self[self.easeFunction](self.time, self.touchStartY, self.deltaY*self.scalar, self.duration);
				//
				self.vec3.x = self.currentX;
				self.vec3.y = self.currentY;
				//
				self.time++;
				//
				self.post('onMotionUpdate');

			}else{
				//	Reset delta
				self.deltaX = []
				self.deltaY = []
			}

		})();
	}
}







