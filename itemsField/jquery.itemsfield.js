// JavaScript Document
	
(function($) {
	$.widget( "ui.itemsField", {
		
		options: { 
			source: [],
			multiple: 'auto',
			inputMinSize : 5
		},
		
		_key : {
			'enter': 13,
			'tab': 9,
			'comma': 188,
			'backspace': 8,
			'leftarrow': 37,
			'uparrow': 38,
			'rightarrow': 39,
			'downarrow': 40,
			'exclamation': 33,
			'slash': 47,
			'colon': 58,
			'at': 64,
			'squarebricket_left': 91,
			'apostrof': 96
		},
		
		_create: function() {
			
			this.element.hide();
			
			if(this.options.multiple === 'auto') {
				if(this.element.attr('multiple') || this.element.attr('name').match(/\[\]$/i)) {
					this.element.attr('multiple','multiple');
					this.options.multiple = true;
				} else {
					this.element.removeAttr('multiple');
					this.options.multiple = false;
				}
			}
			
			//Parts
			this.container = $('<div class="'+this.widgetBaseClass+'"></div>');
			this.background = $('<div class="background"></div>')
			this.input = $('<input type="text" size="'+this.options.inputMinSize+'" />');
			
			//Construction
			this.element.after(this.container);
			this.container.append(this.input);
			this.container.append(this.background);
			this.container.append('<div style="clear:both;"></div>');
			
			//Events
			this.container.on("click", "a.ui-icon-close", $.proxy(function(e) {
				var it = $(e.target).data(this.namespace+'.itemsField');
				this.removeItem(it.data(this.namespace+'.itemsField.option'));
			}, this));
			this.input.autocomplete({
				appendTo : this.container,
				source : this.options.source,
				select : $.proxy(function(event,ui) {
					event.preventDefault();
					event.stopPropagation();
					this.input.val('');
					this.addItem.call(this,ui.item);
				},this)
			});
			this.background.click($.proxy(function() {
				this.input.focus();
			},this));
			this.background.dblclick($.proxy(function() {
				this.input.get(0).select();
			},this));
			this.input.keydown($.proxy(function(e) {
				var keycode =  e.keyCode ? e.keyCode : e.which;
				var val = $(e.target).val();
				if(keycode == this._key.backspace && !val.length && this.items) {
					var lastItem = this.items.last();
					if(!lastItem.is('.ui-state-active')) {
						lastItem.addClass('ui-state-active').removeClass('ui-state-default');
					} else {
						lastItem.find('.ui-icon-close').click();
					}
				} else if(
					(keycode == this._key.enter || keycode == this._key.comma || keycode == this._key.tab) && 
					val.length && 
					$(e.target).is(':focus')
				) {
					
					this.addItem({'label' : val});
					this.input.val('');
					this.input.focus();
					return false;
					
				} else {
					
					
				}

			},this));
			this.input.blur($.proxy(function(e) {
				if(this.items && this.items.filter('.ui-state-active').length) {
					this.items.filter('.ui-state-active').removeClass('ui-state-active').addClass('ui-state-default');
				}
			},this));
			this.input.keypress($.proxy(function(e) {
				if (e.keyCode == this._key.enter) {
					return false;
				}
				//auto expand input
				var val = this.input.val();
				var newsize = (this.options.inputMinSize > val.length) ? this.options.inputMinSize : (val.length + 1);
				this.input.attr("size", Math.ceil(newsize*1.2));
			},this));
			
			//Refresh elements
			this.refresh();
		},
		refresh: function() {
			// Keep track of the generated list items
			this.items = this.items || $();
			// Use a class to avoid working on options that have already been created
			this.element.find( "option:selected:not(."+this.widgetBaseClass+"-option)" ).each( $.proxy(function( i, el ) {
		 		if(!$(el).text().length) return;
				// Add the class so this option will not be processed next time the list is refreshed
				var $el = $( el ).addClass( this.widgetBaseClass+"-option" ),
					text = $el.text(),
					it = $( '<span class="'+this.widgetBaseClass+'-item  ui-corner-all"></span>' )
						.text(text)
						.addClass('ui-state-default')
						.data( this.namespace+'.itemsField.option', el )
						.insertBefore( this.input ),
					link = $('<a href="#" class="ui-icon ui-icon-close"></a>')
						.data(this.namespace+'.itemsField',it)
						.appendTo(it);
		 
				// Save it into the item cache
				this.items = this.items.add( it );
		 
			},this));
		 
			// If the the option associated with this list item is no longer contained by the
			// real select element, remove it from the list and the cache
			this.items = this.items.filter( $.proxy(function( i, it ) {
				var isInOriginal = $.contains( this.element[0], $.data( it, this.namespace+'.itemsField.option' ) );
				if ( !isInOriginal ) {
					 $(it).fadeOut('fast',function() {
						$(this).remove(); 
					 });
				}
				return isInOriginal;
			}, this ));
			
			//this.list.find('li.'+this.widgetBaseClass+'-item')
		},
		
		addItem : function(it) {
			
			this.element.append('<option '+(typeof(it.value) != 'undefined' ? 'value="'+it.value+'" ':'')+'selected="selected">'+it.label+'</option>');
			this.refresh();
			
		},
		
		removeItem : function(it) {
			this.element.find('option').each(function() {
				if($(this).get(0) == $(it).get(0)) {
					$(this).remove();
				}
			});
			this.refresh();
		},
		
		_itemRemove: function( e ) {
			e.preventDefault();
			 $(e.target).parents('.'+this.widgetBaseClass+'-item').eq(0).fadeOut('fast',function() {
				$(this).remove(); 
			 });
		},
		
		// Use the _setOption method to respond to changes to options
		_setOption: function( key, value ) {
			switch( key ) {
				case "clear":
				// handle changes to clear option
				break;
			}
			
			// In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
			$.Widget.prototype._setOption.apply( this, arguments );
			// In jQuery UI 1.9 and above, you use the _super method instead
			this._super( "_setOption", key, value );
		},
		
		// Use the destroy method to clean up any modifications your widget has made to the DOM
		destroy: function() {
			// In jQuery UI 1.8, you must invoke the destroy method from the base widget
			$.Widget.prototype.destroy.call( this );
			// In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
		}
	});
	
}(jQuery));