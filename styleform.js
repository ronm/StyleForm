/**************************/
/*** StyleForm ************/
/*** by Ron Marcelle ******/
/*** Licensed under MIT ***/
/**************************/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.StyleForm = factory();
  }
}(this, function () {
	
	let keyMap = { UP: 38, DOWN: 40, ENTER: 13 },
		selector = 'select,input[type="checkbox"],input[type="radio"]',
		selectTemplate = '<div class="select-wrapper"><div class="selected"></div><div class="options-wrapper"></div></div>',
		frag = document.createRange().createContextualFragment(selectTemplate);

	/* FORM: SELECTS */
	class StyleSelect {
    
	    constructor(element = null) {		    
	    	this.element = element;
	    	this.options = [].slice.apply(element.children);
			this.wrapper = frag.querySelector(".select-wrapper");
			this.optionsWrapper = frag.querySelector(".options-wrapper");
			this.selectedWrapper = frag.querySelector(".selected");
			this.current = this.element.selectedIndex;
			this.state = 0;
			this.element.styleProcessed = true;

			if ('ontouchstart' in window) { this.wrapper.classList.add("touch"); }

			this.element.addEventListener("change", () => {
				this.optionsWrapper.querySelector(".active ").classList.remove("active");
				this.optionsWrapper.children[this.element.selectedIndex].classList.add("active");
			});
	      
			this.wrapper.addEventListener("keydown", event => {
				let key = event.which;
				if ( key === keyMap.UP || key === keyMap.DOWN || key === keyMap.ENTER ) {
					if ( key === keyMap.ENTER ) {
						event.preventDefault();
						if ( this.state ) {
							this.close();
						} else {
							this.open();
						}
					} else {
						if ( !this.state ) {
							this.open();				
						} else if ( key === keyMap.UP && this.options[this.current-1] ) {
							this.set(this.current-1);
						} else if ( key === keyMap.DOWN && this.options[this.current+1] ) {					
							this.set(this.current+1);					
						}
					}
				}
			});
	      
			this.optionsWrapper.addEventListener("click", event => {
	        	event.stopPropagation();
	
				if ( this.state ) {
					var i;
					[].slice.apply( this.optionsWrapper.children ).forEach(function(el, n) { 
						if (el.contains( event.target ) || el === event.target) { i = n; } 
					});
					
					this.set( i );
					this.close();				
				}
			});
			
			this.selectedWrapper.addEventListener("click", event => {
	        	event.stopPropagation();
	
				if ( this.state ) {
					this.close();				
				} else {
					this.open();
				}
			});			
			
			this.element.addEventListener("focus", () => { this.focused = true; });
			this.element.addEventListener("blur", () => { this.focused = false; });
				
			this.options.forEach((o,i) => {
	        		var temp = '<div class="item' + (o.selected?' active':'') + '">' + o.innerHTML + '</div>';
				if ( o.selected ) { 
					this.current = i;
					this.selectedWrapper.innerHTML = o.innerHTML;
				}
				this.optionsWrapper.innerHTML += temp;
			});
	
			this.wrapper.style.width = (this.element.clientWidth+50)+"px";
			this.element.parentNode.insertBefore(this.wrapper, this.element);
			this.wrapper.insertBefore(this.element, this.wrapper.children[0]);
			this.wrapper.style.height = this.selectedWrapper.clientHeight + "px";
	    }

	    open() {
		    this.state = 1;
			this.wrapper.classList.add("open");
			this.close = () => { this._close(this); };
			document.documentElement.addEventListener("click", this.close);
			
			var pageBottom = document.body.clientHeight,
				wrapperBottom = pageYOffset + this.optionsWrapper.getBoundingClientRect().bottom;
			
			if ( wrapperBottom > pageBottom ) {
				this.optionsWrapper.style.height = (this.optionsWrapper.scrollHeight - (wrapperBottom - pageBottom)) + "px";
			}			
		}
	    
		_close() {
			this.state = 0;
			[].slice.apply(document.querySelectorAll('.select-wrapper.open')).forEach(el => el.classList.remove("open"));
			document.documentElement.removeEventListener("click", this.close);
			this.close = null;
		}
	
		set(i) { 
			let change;
	
			try {
				change = new Event("change", { 'bubbles': true });
			} catch (e) {
				change = document.createEvent('Event');
				change.initEvent('change', true, true);
			}
	
			this.current = i;
			this.options[i].selected = true;
			this.element.dispatchEvent(change);
			this.selectedWrapper.innerHTML = this.options[i].innerHTML;
		} 
	}
	/* FORM: SELECTS */
  
  
	/* FORM: CHECKBOXES & RADIOS*/		
	class StyleInput {
    		constructor(element) {
			let wrapper = document.createElement('span'),
		    		takeover = wrapper.cloneNode();

			element.styleProcessed = true;
			wrapper.classList.add("form-item-takeover");
			wrapper.setAttribute("data-type", element.type);
			element.parentNode.insertBefore(wrapper, element);
			wrapper.appendChild(element);
			wrapper.appendChild(takeover);
			takeover.classList.add("takeover");
    		}
	} 
	/* FORM: CHECKBOXES & RADIOS*/
  
	return class StyleForm {
		constructor(elements = [].slice.apply(document.querySelectorAll(selector))) {
			this.elements = [];
			this.watching = false;
			this.add(elements);
    		}

		add(elements) {
			(Array.isArray(elements) ? elements : [elements]).forEach(element => {
				if ( !element.styleProcessed ) {
					if ( element.tagName.toLowerCase() === "select" ) {
						this.elements.push(new StyleSelect(element));
					} else {
						this.elements.push(new StyleInput(element));
					}
				}
			});
		}

		watch() {
		    	if ( "MutationObserver" in window && !this.watching ) {
				let 	observer = new MutationObserver(mutations => {
					mutations.filter(m => { try { return m.addedNodes[0].nodeType === 1; } catch(e) { return false; } })
					.map(m => m.addedNodes[0])
					.forEach(n => {
						if (!n.styleProcessed) {
							var tagName = n.tagName && n.tagName.toLowerCase(), s;
							if ( tagName === "input" && ["checkbox","radio"].indexOf(n.type) > -1 ) {
								new StyleInput(n);
							} else if ( tagName === "select" ) {
								new StyleSelect(n);
							} else {
								let elements = [].slice.apply( n.querySelectorAll(selector) );
								if ( elements.length ) {
									this.add( elements );
								}
							}
						}							
					});
				});
				observer.observe(document.documentElement, { childList: true, subtree: true });      
				this.watching = true;
			}

			return this;
		}
	}
}));