{


	class Slide {
		constructor(el) {
			this.DOM = {el: el};
			// The image wrap element.
            this.DOM.imgWrap = this.DOM.el.querySelector('.slide__img-wrap');
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
                {x: -1*(winsize.width/2-this.width/3), y: -1*(winsize.height/2-this.height/3), rotation: 0},
                {x: 0, y: 0, rotation: 0},
                {x: winsize.width/2-this.width/3, y: winsize.height/2-this.height/3, rotation: 0},
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
        	console.log("position called");
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
                
                // Reset image scale when showing the content of the current slide.
                if ( settings.resetImageScale ) {
                    TweenMax.to(this.DOM.img, .8, {
                        ease: Power4.easeInOut,
                        scale: 1
                    });
                }
            });
        }
	}

	class Content {
		constructor(el) {

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

            // Set the current/next/previous slides. 
            this.render();
		}
		render() {
			console.log("render");
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
            // this.currentSlide.hideTexts();
            
            // this.bounceDeco(direction, 0.07);
            
            this.nextSlide.moveToPosition({position: direction === 'next' ? 0 : 2, delay: direction === 'next' ? 0.14 : 0 }).then(() => {
                if ( direction === 'prev' ) {
                    this.nextSlide.hide();
                }
            });

            if ( direction === 'next' ) {
                // this.nextSlide.showTexts();
            }
            else {
                // this.prevSlide.showTexts();
            }
            
            this.upcomingSlide.moveToPosition({position: direction === 'next' ? 1 : -1, from: direction === 'next' ? 2 : -2, delay: 0.21 }).then(() => {
                // Reset classes.
                [this.nextSlide,this.currentSlide,this.prevSlide].forEach(slide => slide.reset());
                this.render();
                this.isAnimating = false;
            });

            // callback;
            setTimeout(function() {
            	slideshow.navigate('next')
            },2000);

        }
		
	}


	// Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

	// Init slideshow.
    const slideshow = new Slideshow(document.querySelector('.slideshow'));


 	//    function autoPlay() {
	//     setTimeout(function() {
	//     	slideshow.navigate(autoPlay(),'next');
	//     }, 2000);
	// }

	// autoPlay();
	setTimeout(function() {
		slideshow.navigate('next')
	},2000);


}