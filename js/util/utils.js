/*
*	eventListener
*/
function EventListener(){

	this.listeners = [];

}

EventListener.prototype = {

	constructor:EventListener,

	post:function(type, dataObject){

		//	For each listener
		for(var i = 0; i < this.listeners.length; i++){

			if(this.listeners[i].type===type){

				this.listeners[i].callback.call(this, (!dataObject) ? null : dataObject);

			}
		}
	},

	addEventListener:function(type, callback){

		if(typeof callback === 'function')
		{
			if(typeof type === 'string')
			{
				this.listeners.push({
					type:type,
					callback:callback
				});
			}
			else if(!type)
			{
				throw 'Please reference an event type.'
				return false;
			}
			else
			{
				throw 'Event type should be a string.'
				return false;
			}
		}
		else if(!callback)
		{
			throw 'Please reference an event callback.'
			return false;
		}
		else
		{
			throw 'Event callback is not function.'
			return false;
		}

	},

	removeEventListener:function(type){
		//	Listener list
		for (var i = 0; i < this.listeners.length; i++) {

			if(this.listeners[i].type===type){

				this.listeners.splice(i,1);

			}
		}
	},

	animationListener:function(element, type, callback, prefix){
		var prefix = (prefix.toLowerCase()==='moz') ? '' : prefix.toLowerCase();

		var onEvent = function(e){
			callback.call(this, e);
			element.removeEventListener(prefix+type, onEvent);
		}

		element.addEventListener(prefix+(prefix===''?type.toLowerCase():type), onEvent, false);

	}

}

/*
*	fullBleed
*/

function FullBleed(){

}

FullBleed.prototype.constructor = FullBleed;

FullBleed.prototype.getFullscreen = function(){
	/*
	*	Background image size ratios
	*	@ 	This is not dynamic, update if the background image changes size
	*/
	var ratioW = 1025/740;
	var ratioH = 740/1024;
	//
	var offset = 40;
	var w = 0;
	var h = 0;
	/*
	*
	*/
	if(window.innerWidth*ratioW < window.innerHeight)
	{
		h = window.innerHeight+offset;
		w = (window.innerHeight*ratioH)+offset;
	}
	else
	{
		h = (window.innerWidth*ratioW)+offset;
		w = window.innerWidth+offset;
	}
	console.log("w:"+w);
	/*
	*	Return fullscreen dimensions
	*/
	return {
		w:w,
		h:h
	}
}

FullBleed.prototype.makeFullscreen = function(t){
	/*
	*	Get dimensions
	*/
	var fs = this.getFullscreen();
	/*
	*	Apply dimensions
	*/
	t.style.width = fs.w+'px';
	t.style.height = fs.h+'px';
	t.style.marginLeft = -(fs.w/2)+'px';
	t.style.marginTop = -(fs.h/2)+'px';

}

/*
*	imageLoader
*/

function LoadImages(){

	this.listeners = [];
	this.images = [];

}

LoadImages.prototype = {

	constructor: LoadImages,

	post:function(type){
		//	For each listener
		for(var i = 0; i < this.listeners.length; i++){

			if(this.listeners[i].type===type){

				switch(type){

					case 'onLoad':
						this.listeners[i].callback.call(this, {images:this.images});
						break;
					default:
						return false;
						break;

				}
			}
		}
	},
	removeEventListener:function(type){
		//	Listener list
		for (var i = 0; i < this.listeners.length; i++) {

			if(this.listeners[i].type===type){

				this.listeners.splice(i,1);

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

	load:function(srcArray){

		var self = this;

		var imageLoad = function(srcArray){

			var _img = null;
			var _imgArray = [];
			var _length = srcArray.length;

			//	Create image objects
			for(var i = 0; i < srcArray.length; i++){

				var _img = new Image();

		        _img.onload = function() {

		            --_length;
		            if(_length <= 0) imageLoaded(_imgArray)

		        }

		        _img.onerror = function(){

		        	throw 'Image location or URL not found.';

		        }

		        _img.src = srcArray[i];
		        _imgArray.push(_img);

			}
		}


		var imageLoaded = function(imageArray){

			self.images = imageArray;
			self.post('onLoad');

		}

		imageLoad(srcArray);
	}
}

/*
*	requestAnimation
*/
requestAnimationFrame = (function(){

	return	window.requestAnimationFrame       	||
			window.webkitRequestAnimationFrame 	||
			window.mozRequestAnimationFrame    	||
			window.oRequestAnimationFrame 		||
		 	function(fn){
				window.setTimeout(fn, 1000/60);
			};

})();
