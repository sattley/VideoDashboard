{


	class Slide {
		constructor(el) {
			this.DOM = {el: el};
			// The image wrap element.
            this.DOM.imgWrap = this.DOM.el.querySelector('.slide__img-wrap');
            // The texts: the parent wrap, title, number and side text.
            this.DOM.texts = {
                wrap: this.DOM.el.querySelector('.slide__title-wrap'),
                title: this.DOM.el.querySelector('.slide__title'),
                number: this.DOM.el.querySelector('.slide__subtitle')
            };
            this.DOM.animatedLine = this.DOM.el.querySelector('.slide__line');
            // Calculate the sizes of the image wrap. 
            this.calcSizes();
            // And also the transforms needed per position. 
            // We have 5 different possible positions for a slide: center, bottom right, top left and outside the viewport (top left or bottom right).
            this.calcTransforms();
            // Init/Bind events.
            this.initEvents();
		}
		// Gets the size of the image wrap.
        calcSizes() {
            this.width = this.DOM.imgWrap.offsetWidth;
            this.height = this.DOM.imgWrap.offsetHeight;
        }
		// Gets the transforms per slide position.
        calcTransforms() {
            /*
            Each position corresponds to the position of a given slide:
            0: left top corner outside the viewport
            1: left top corner (prev slide position)
            2: center (current slide position)
            3: right bottom corner (next slide position)
            4: right bottom corner outside the viewport
            5: left side, for when the content is shown
            */
            this.transforms = [
                {x: -1*(winsize.width/2+this.width), y: -1*(winsize.height/2+this.height), rotation: -30},
                {x: -1*(winsize.width/2), y: -1*(winsize.height/2), rotation: 0},
                {x: 0, y: 0, rotation: 0},
                {x: winsize.width/2, y: winsize.height/2, rotation: 0},
                {x: winsize.width/2+this.width, y: winsize.height/2+this.height, rotation: 30},
                {x: -1*(winsize.width/2 - this.width/2 - winsize.width*0.075), y: 0, rotation: 0}
            ];
        }
        // Init events:
        // Mouseevents for mousemove/tilt/scale on the current image, and window resize.
        initEvents() {
            // When resizing the window recalculate size and transforms, since both will depend on the window size.
            this.resizeFn = () => {
                this.calcSizes();
                this.calcTransforms();
            };
            window.addEventListener('resize', this.resizeFn);
        }
        // Positions one slide (left, right or current) in the viewport.
        position(pos) {
            TweenMax.set(this.DOM.imgWrap, {
                x: this.transforms[pos].x, 
                y: this.transforms[pos].y, 
                rotationX: 0,
                rotationY: 0,
                opacity: 1,
                rotationZ: this.transforms[pos].rotation
            });
        }
        // Sets it as current.
        setCurrent(isContentOpen) {
            this.isCurrent = true;
            this.DOM.el.classList.add('slide--current', 'slide--visible');
            // Position it on the current´s position.
            this.position(isContentOpen ? 5 : 2);
        }
        // Position the slide on the left side.
        setLeft(isContentOpen) {
            this.isRight = this.isCurrent = false;
            this.isLeft = true;
            this.DOM.el.classList.add('slide--visible');
            // Position it on the left position.
            this.position(isContentOpen ? 0 : 1);
        }
        // Position the slide on the right side.
        setRight(isContentOpen) {
            this.isLeft = this.isCurrent = false;
            this.isRight = true;
            this.DOM.el.classList.add('slide--visible');
            // Position it on the right position.
            this.position(isContentOpen ? 4 : 3);
        }
        // Reset classes and state.
        reset() {
            this.isRight = this.isLeft = this.isCurrent = false;
            this.DOM.el.classList = 'slide';
        }
        hide() {
            TweenMax.set(this.DOM.imgWrap, {x:0, y:0, rotationX:0, rotationY:0, rotationZ:0, opacity:0});
        }
        // Moves a slide to a specific position defined in settings.position.
        // Also, moves it from position settings.from and if we need to reset the image scale when moving the slide then settings.resetImageScale should be true.
        moveToPosition(settings) {
            return new Promise((resolve, reject) => {
                /*
                Moves the slide to a specific position:
                -2: left top corner outside the viewport
                -1: left top corner (prev slide position)
                0: center (current slide position)
                1: right bottom corner (next slide position)
                2: right bottom corner outside the viewport
                3: left side, for when the content is shown
                */
                TweenMax.to(this.DOM.imgWrap, .8, {
                    ease: Power4.easeInOut,
                    delay: settings.delay || 0,
                    startAt: settings.from !== undefined ? {
                        x: this.transforms[settings.from+2].x,
                        y: this.transforms[settings.from+2].y,
                        rotationX: 0,
                        rotationY: 0,
                        rotationZ: this.transforms[settings.from+2].rotation
                    } : {},
                    x: this.transforms[settings.position+2].x,
                    y: this.transforms[settings.position+2].y,
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: this.transforms[settings.position+2].rotation,
                    onStart: settings.from !== undefined ? () => TweenMax.set(this.DOM.imgWrap, {opacity: 1}) : null,
                    onComplete: resolve 
                });
            });
        }
        hideTexts() {
        	TweenMax.to(this.DOM.texts.wrap, 0.4, {opacity: 0});
        }
        showTexts() {
        	TweenMax.set([this.DOM.texts.wrap,this.DOM.animatedLine], {opacity: 1});
        }
	}

	class Content {
		constructor(el) {
			this.DOM = {el: el};
			this.DOM.title = this.DOM.el.querySelector('.content__title');
			this.DOM.assetWrap = this.DOM.el.querySelector('.content__asset-wrap');
		}
		show() {
			this.DOM.el.classList.add('content__item--current');

            TweenMax.staggerTo([this.DOM.title,this.DOM.assetWrap], 0.8, {
                ease: Power4.easeOut,
                delay: 0.4,
                opacity: 1,
                startAt: {y: 40},
                y: 0
            }, 0.05, slideshow.showComplete, [this.DOM.assetWrap, this.DOM.el]);
		}
		hide() {
			this.DOM.el.classList.remove('content__item--current');

			TweenMax.staggerTo([this.DOM.title,this.DOM.assetWrap].reverse(), 0.3, {
                ease: Power3.easeIn,
                opacity: 0,
                y: 10
            }, 0.01);
		}
	}

	class Slideshow {
		constructor(el) {
			this.DOM = {el: el};
            // The slides.
            this.slides = [];
            Array.from(this.DOM.el.querySelectorAll('.slide')).forEach(slideEl => this.slides.push(new Slide(slideEl)));
            // The total number of slides.
            this.slidesTotal = this.slides.length;
            // At least 4 slides to continue...
            if ( this.slidesTotal < 4 ) {
                return false;
            }
            // Current slide position.
            this.current = 0;
            // deco is the background square behind each slide and the thing that animates full screen when clicking into a slide
            this.DOM.deco = this.DOM.el.querySelector('.slideshow__deco');

            this.contents = [];
            Array.from(document.querySelectorAll('.content > .content__item')).forEach(contentEl => this.contents.push(new Content(contentEl)));

            // Set the current/next/previous slides. 
            this.render();
            this.currentSlide.showTexts();
		}
		render() {
            // The current, next, and previous slides.
            this.currentSlide = this.slides[this.current];
            this.nextSlide = this.slides[this.current+1 <= this.slidesTotal-1 ? this.current+1 : 0];
            this.prevSlide = this.slides[this.current-1 >= 0 ? this.current-1 : this.slidesTotal-1];
            this.currentSlide.setCurrent();
            this.nextSlide.setRight();
            this.prevSlide.setLeft();
        }
        // Navigate the slideshow.
        navigate(direction) { // navigate(callback,direction)
            // If animating return.
            if ( this.isAnimating ) return;
            this.isAnimating = true;

            const upcomingPos = direction === 'next' ? 
                    this.current < this.slidesTotal-2 ? this.current+2 : Math.abs(this.slidesTotal-2-this.current):
                    this.current >= 2 ? this.current-2 : Math.abs(this.slidesTotal-2+this.current);
            
            this.upcomingSlide = this.slides[upcomingPos];

            // Update current.
            this.current = direction === 'next' ? 
                    this.current < this.slidesTotal-1 ? this.current+1 : 0 :
                    this.current > 0 ? this.current-1 : this.slidesTotal-1;
            
            // Move slides (the previous, current, next and upcoming slide).
            this.prevSlide.moveToPosition({position: direction === 'next' ? -2 : 0, delay: direction === 'next' ? 0 : 0.14}).then(() => {
                if ( direction === 'next' ) {
                    this.prevSlide.hide();
                }
            });
            
            this.currentSlide.moveToPosition({position: direction === 'next' ? -1 : 1, delay: 0.07 });
            this.currentSlide.hideTexts();
            
            // this.bounceDeco(direction, 0.07);
            this.nextSlide.moveToPosition({position: direction === 'next' ? 0 : 2, delay: direction === 'next' ? 0.14 : 0 }).then(() => {
                if ( direction === 'prev' ) {
                    this.nextSlide.hide();
                }	
            });

            if ( direction === 'next' ) {
                this.nextSlide.showTexts();
            }
            else {
                this.prevSlide.showTexts();
            }
            
            this.upcomingSlide.moveToPosition({position: direction === 'next' ? 1 : -1, from: direction === 'next' ? 2 : -2, delay: 0.21 }).then(() => {
                // Reset classes.
                [this.nextSlide,this.currentSlide,this.prevSlide].forEach(slide => slide.reset());
                this.render();
                this.isAnimating = false;
                // can probably call slideshow.showContent() directly
                slideshow.afterNavigate();
            });
        }

        afterNavigate() {
        	setTimeout(function() {
			 	slideshow.showContent();
			},600);
        }

        animateLine(reverse) {
            
            if(reverse) {
                var leftPos = this.contents[this.current].DOM.el.offsetLeft - (this.contents[this.current].DOM.el.offsetLeft * (17.5/100));
                var lineEl = this.currentSlide.DOM.animatedLine;
                var lineTl = new TimelineMax({delay:0});
                var lineTlEasing = Power4.easeInOut;
                lineTl.add( TweenLite.to(lineEl, 0.8, {  width: 0, x: leftPos, ease: lineTlEasing}));
                lineTl.play();
            } else {
                var leftPos = this.contents[this.current].DOM.el.offsetLeft - (this.contents[this.current].DOM.el.offsetLeft * (17.5/100));
                var lineEl = this.currentSlide.DOM.animatedLine;
                var lineTl = new TimelineMax({delay:0});
                var lineTlEasing = Power4.easeInOut;
                lineTl.add( TweenLite.to(lineEl, 0.8, {  width: this.contents[this.current].DOM.el.offsetWidth, x: leftPos, ease: lineTlEasing}));
                lineTl.play();
            }
        }

        showContent(finishShowContent) {
        	if ( this.isContentOpen || this.isAnimating ) return;
            
            this.isContentOpen = true;
            this.DOM.el.classList.add('slideshow--previewopen');

            slideshow.animateLine();

            TweenMax.to(this.DOM.deco, .8, {
                ease: Power4.easeInOut,
                scaleX: winsize.width/this.DOM.deco.offsetWidth,
                scaleY: winsize.height/this.DOM.deco.offsetHeight,
                x: -40,
                y: 40,
                onComplete: slideshow.finishShowContent,
                onCompleteParams: [this.DOM.deco]
            });
            // Move away right/left slides.
            this.prevSlide.moveToPosition({position: -2});
            this.nextSlide.moveToPosition({position: 2});
            // Position the current slide and reset its image scale value.
            this.currentSlide.moveToPosition({position: 3, resetImageScale: true});
            // Show content and back arrow (to close the content).
            this.contents[this.current].show();
            // Hide texts.
            this.currentSlide.hideTexts();
        }
        // callback method for showContent
        finishShowContent() {
        	// not being used currently
            console.log('slide in');
        }
        hideContent() {
            if ( !this.isContentOpen || this.isAnimating ) return;

            this.DOM.el.classList.remove('slideshow--previewopen');

            // animate line back to size
            slideshow.animateLine(true);
            // Hide content.
            this.contents[this.current].hide();

            TweenMax.to(this.DOM.deco, .8, {
                ease: Power4.easeInOut,
                scaleX: 1,
                scaleY: 1,
                x: 0,
                y: 0,
                onComplete: this.finishHideContent
            });
            // Move in right/left slides.
            this.prevSlide.moveToPosition({position: -1});
            this.nextSlide.moveToPosition({position: 1});
            // Position the current slide.
            this.currentSlide.moveToPosition({position: 0}).then(() => {
                this.isContentOpen = false;
            });
            // Show texts.
            // this.currentSlide.showTexts();
        }
        // callback method for hideContent
        finishHideContent() {
        	slideshow.navigate('next');
        }

        // callback method for when content is shown and then playing the video
		showComplete(assetWrap, contentItem) {
			this.isVideo = assetWrap.getElementsByTagName('video').length > 0 ? true : false;
			if(this.isVideo) { // 
				var video = assetWrap.getElementsByTagName('video')[0];
				video.addEventListener("ended",function() { slideshow.hideContent(); });

                var videoTimeline = new TimelineMax({delay:0});
                var videoTimelineEasing = Power4.easeInOut;

                // videoTimeline.add( TweenLite.to(assetWrap, 0, {position: 'fixed', bottom: '-20%', right: '-30%', scaleXY: 0, height: '0', width: '0'}), "one");
                // videoTimeline.add( TweenLite.to(video, 0, {scaleXY: 0}), "one");

                // video.pause();

                

                videoTimeline.add( TweenLite.to(assetWrap, 0.5, {opacity: 0}));

                videoTimeline.add( TweenLite.to(assetWrap, 0.9, {position: 'fixed', left: '40%', top: '40%', transformOrigin: "40% 40%", scale: 0}),"-=0.1");

                videoTimeline.add( TweenLite.to(assetWrap, 0.9, {opacity: 1, left: 0, right: 0, top: 0, bottom: 0, scale: 1, onComplete: function() {video.play();}}), "two");
                // videoTimeline.add( TweenLite.to(video, 0.9, { width: '100vw', height: 'auto', scaleXY: 1}), "two-=0.9");

                // videoTimeline.add( TweenLite.to(video, 1.6, { width: '100vw', height: '100vh', ease: videoTimelineEasing}), "two-=1.6"); // "heroMiddleLabel+=0.5"

                // videoTimeline.play();
                // remove video play
				
                // uncomment slideshow.hideContent()
                // slideshow.hideContent();
			} else {
				// content is not a video so we just let it hang for a bit before we call hideContent
				setTimeout(function() {
				 	slideshow.hideContent();
				},6000);
			}
		}
	}


	// Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

	// Init slideshow.
    const slideshow = new Slideshow(document.querySelector('.slideshow'));

	setTimeout(function() {
	 	slideshow.showContent();
	},1000);

}