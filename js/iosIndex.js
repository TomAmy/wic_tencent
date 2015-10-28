(function(){

	//检查设备支持情况
	var user = new UserSupport(); //	Create new User for device/lang/prefix detection
	var vec3 = new Vector3(); //	3D vector object
	var motion = null; //	Motion var to hold the motion type depending on user support (inertia, gyro)
	var inertia = null; //	Inertia container
	var gyro = null; //	Gyro container
	var initialised = false; //	Initiation boolean
	var useGyro = null; //	Should we use the gyro?
	var blocker = new Blocker(); //	Blocker to control the degree of the 360˚ view the user can access
	var range = null; //	The range on degrees the user can view before being blocked by the blocker
	var motionCancelled = false; //	Has the motion been cancelled. We should cancel the motion the save on CPU usage when viewing video etc
	var imageLoader = new LoadImages();
	/*
	 *
	 *	Support event
	 *
	 */
	var onSupportUpdate = function(e) {
		//对象e是UserSupport对象的测试结果
		//重置user
		user = e;
		//绑定motion
		if (e.supported) {
			if (!initialised) {
				gyro = (user.gyro) ? new Gyro(user) : null;
				inertia = new Inertia('easeOutQuad', 29, 10);
				useGyro = (user.gyro) ? true : false;
				motion = (useGyro) ? gyro : inertia;
				motion.addEventListener('onMotionUpdate', onMotion);
			};
			initialised = true;

			range = {y: 180};

			if (range) blocker.set(range);

			if (!useGyro) {
				motion.reset();
				onMotion({
					vec3: motion.vec3
				})
			}

		} else {
			alert('User unsupported');
		}
	}
	/*
	 *
	 *	Motion event
	 *
	 */
	var onMotion = function(e) {
		//console.log(vec3);
		vec3.set(e.vec3.x, e.vec3.y, e.vec3.z);
		if (range) vec3 = blocker.block(vec3);
		rotate(vec3);
	}
	var box = $('.t-ios-main .box');
	var track = $('.t-track .track-inner');
	var rotateStr = 'translate3d(0, 0, 500px) rotateZ({2}deg) rotateX(-90deg) rotateX({0}deg) rotateY({1}deg) rotateY(0deg)';
	var trackStr = 'rotateX({0}deg) rotate({1}deg)';
	var rotate = function(e){
		var rotateEnd = rotateStr.replace('{1}', e.x * -1).replace('{0}', e.y).replace('{2}', (e.z % 3600000) * -1);
		var trackEnd = trackStr.replace('{0}', e.y - 30).replace('{1}', -1*e.x%360);
		box[0].style.webkitTransform = rotateEnd;
		track[0].style.webkitTransform = trackEnd;
	}

	var onKillMotion = function() {

		if (!motionCancelled) {
			/*
			 *	Remove current motion event
			 */
			motion.removeEventListener('onMotionUpdate', onMotion);
			/*
			 *	Clear the motion variable
			 */
			motion = null;
			/*
			 *
			 */
			motionCancelled = true;
		} else {
			/*
			 *	Set the motion variable to its new type
			 */
			motion = (useGyro) ? gyro : inertia;
			/*
			 *	Listen to new motion type
			 */
			motion.addEventListener('onMotionUpdate', onMotion);
			/*
			 *
			 */
			motionCancelled = false;
		}
	}

	var iscroll = null;
	function _initRotate(){
		//设备完成测试时，会触发自定义事件supportStatusUpdate :2
		user.addEventListener('supportStatusUpdate', onSupportUpdate);

		//图片加载完成之后，执行设备测试:1
		user.test();

		//绑定弹窗点击事件
		$('.t-info').on('click','.btn-close', function(e){
			if(user.device.model == 'android'){
				$('.t-ios-main').show();
				$('.mask').hide();
			}			
			$('.info-content-'+$(this).attr('data-class')).hide();
			iscroll.destroy();
			iscroll = null;
			$('.t-info').removeClass('show');	
			onKillMotion();
		});

		$('.t-ios-main').on('click','.btn-open', function(e){		
			if(user.device.model == 'android'){
				$('.t-ios-main').hide();
				$('.mask').show();
			}	
			var className = $(this).attr('data-class');	
			$('.t-info').addClass('show')
						.css('-webkit-transform','translate3d(0px, 0px, 0)');
			$('.info-content-'+className).show();
			iscroll = new IScroll($('.info-content-'+className)[0]);
			$('.btn-close').attr('data-class',className);
			onKillMotion();
		});				
	}

	//添加其他loading的内容
	var preloadimgs = [
		'./img/s.jpg',
		'./img/d.jpg',
		'./img/n.jpg',
		'./img/w.jpg',
		'./img/e.jpg',
		'./img/u.jpg'
	];

	//解锁
	var showDotWin = function(callback){
		var dotUp = $('.up-dot');
		var dotLeft = $('.left-dot');
		var dotRight = $('.right-dot');
		var dotPosition = [];
		var dotList = [dotUp, dotRight, dotLeft];
		var dotClicked = [];
		var index = -1;
		var oldLine = null;
		var dotStartEvent = function(e){
			e.preventDefault();
			//把点的位置存到变量
			var tp;
			for (var i = 0; i < dotList.length; i++) {
				tp = dotList[i];
				dotPosition.push({
					x: tp.offset().left,
					y: tp.offset().top,
					w: tp.width(),
					h: tp.height()
				});
			};
			//判断起点位置是否在第一个点
			var dotOne = dotPosition[0];
			var evt = e.touches[0];
			if (evt.clientX >= dotOne.x && evt.clientX <= dotOne.w + dotOne.x && evt.clientY >= dotOne.y && evt.clientY <= dotOne.h + dotOne.y) {
				dotList[0].addClass('active');
				dotClicked.push(dotList[0]);
				oldLine = $('.line-box').filter('[data-class='+ dotList[0].attr('data-class') +']').addClass('active');
				dotList[0].removeClass('shank');
				index = 1;
				$(document).on('touchmove', dotMoveEvent);
				$(document).on('touchend', dotEndEvent);
			};
		}
		var dotMoveEvent = function(e){
			if (index == dotList.length) {
				return;
			};
			var dotN = dotPosition[index];
			var evt = e.touches[0];
			if (evt.clientX >= dotN.x && evt.clientX <= dotN.w + dotN.x && evt.clientY >= dotN.y && evt.clientY <= dotN.h + dotN.y) {
				dotList[index].addClass('active');
				dotClicked.push(dotList[index]);
				oldLine.addClass('show').removeClass('active');
				oldLine = $('.line-box').filter('[data-class='+ dotList[index].attr('data-class') +']').addClass('active');
				index++;
			};
			if (index == dotList.length) {
				oldLine.addClass('show').removeClass('active')
				//滑动成功
				$('.t-deblocking .txt-1').addClass('fadeInUp');
				$('.t-deblocking .txt-3').addClass('fadeInDown');
				$(document).off('touchstart', dotStartEvent);
				callback && callback();
				setTimeout(function(){
					$('.t-deblocking').addClass('fadeOut');
					setTimeout(function(){
						$('.t-deblocking').remove();
						setTimeout(function(){
							$('.t-guide').hide();
						}, 2000);						
					}, 2000)
				}, 2000);
			};
		}
		var dotEndEvent = function(e){
			if (index != dotList.length) {
				for (var i = 0; i < dotClicked.length; i++) {
					dotClicked[i].removeClass('active');
				};
				dotClicked = [];
				index = -1;
				oldLine = null;
				$('.up-dot').addClass('shank');
				$('.line-box').removeClass('active show');
				$('.line-1').addClass('active');
			};
			$(document).off('touchmove', dotMoveEvent);
			$(document).off('touchend', dotEndEvent);
		}
		$(document).on('touchstart', dotStartEvent);
	}

	imageLoader.addEventListener('onLoad', function(){
		
		$('.t-load').hide();
		$('.t-deblocking').show();

		//初始化rotate
		showDotWin(_initRotate);
		
	});
	imageLoader.load(preloadimgs);


})();
