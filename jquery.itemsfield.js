// JavaScript Document
	
(function($) {
	$.widget( "ui.itemsField", {
		
		options: { 
			source: [],
			multiple: 'auto'
		},
		
		_create: function() {
			
			this.element.hide();
			
			if(this.options.multiple === 'auto') {
				if(this.element.attr('multiple') || this.element.attr('name').match(/\[\]$/i)) {
					this.options.multiple = true;
					this.element.attr('multiple','multiple');
				} else {
					this.options.multiple = false;
				}
			}
			
			//Parts
			this.container = $('<div class="'+this.widgetBaseClass+'"></div>');
			this.background = $('<div class="background"></div>')
			this.input = $('<input type="text" />');
			
			this.element.after(this.container);
			this.container.append(this.input);
			this.container.append(this.background);
			this.container.append('<div style="clear:both;"></div>');
			
			//Events
			this.container.on("click", "a.ui-icon-close", $.proxy(this._itemRemove, this));
			this.input.autocomplete({
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
			this.input.keyup(function(e) {
				var keycode =  e.keyCode ? e.keyCode : e.which;
				if(keycode == 8 && !$(this).val().length) {
					var lastItem = this.items.last();
					if(!lastItem.is('.ui-state-hover')) {
						lastItem.addClass('ui-state-hover').removeClass('ui-state-default');
					} else {
						lastItem.find('.ui-icon-close').click();
					}
				}
			});
			this.input.blur(function(e) {
				this.items.filter('.ui-state-hover').removeClass('ui-state-hover').addClass('ui-state-default');
			});
			
			//Refresh elements
			this.refresh();
		},
		refresh: function() {
			// Keep track of the generated list items
			this.items = this.items || $();
			// Use a class to avoid working on options that have already been created
			this.element.find( "option:not(."+this.widgetBaseClass+"-option):selected" ).each( $.proxy(function( i, el ) {
		 
				// Add the class so this option will not be processed next time the list is refreshed
				var $el = $( el ).addClass( this.widgetBaseClass+"-option" ),
					text = $el.text(),
					linkElement = text + '<a href="#" class="ui-icon ui-icon-close"></a>',
					item = $( "<span class='"+this.widgetBaseClass+"-item ui-state-default ui-corner-all'>" + linkElement + "</span>" )
						.data( "option.multi", el )
						.insertBefore( this.input );
		 
				// Save it into the item cache
				this.items = this.items.add( item );
		 
			},this));
		 
			// If the the option associated with this list item is no longer contained by the
			// real select element, remove it from the list and the cache
			this.items = this.items.filter( $.proxy(function( i, item ) {
				var isInOriginal = $.contains( this.element[0], $.data( item, "option.multi" ) );
				if ( !isInOriginal ) {
					$( item ).remove();
				}
				return isInOriginal;
			}, this ));
			
			//this.list.find('li.'+this.widgetBaseClass+'-item')
		},
		
		addItem : function(item) {
			
			this.element.append('<option value="'+item.value+'" selected="selected">'+item.label+'</option>');
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