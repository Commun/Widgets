// JavaScript Document
	
(function($) {
	
	$.widget( "ui.itemsField", {
		
		options: { 
			source: [],
			multiple: 'auto',
			inputMinSize : 5,
			create : 'text',
			showOnFocus : true,
			labelNoresult : 'Aucun résultat',
			labelAdd : 'Créer un item',
			labelPlaceholder : 'Entrez des mots-clés...'
		},
		
		_normalizeOptions : function() {
			
			if(this.options.multiple === 'auto') {
				if(this.element.attr('multiple') || this.element.attr('name').match(/\[\]$/i)) {
					this.element.attr('multiple','multiple');
					this.options.multiple = true;
				} else {
					this.element.removeAttr('multiple');
					this.options.multiple = false;
				}
			}
			
			if(typeof(this.options.create) == 'string' && this.options.create == 'text') {
				this.options.create = {
					'type' : 'text',
					'keys' : [$.ui.keyCode.ENTER,$.ui.keyCode.COMMA,$.ui.keyCode.TAB]
				};
			} else if(typeof(this.options.create) == 'function') {
				this.options.create = {
					'type' : 'function',
					'callback' : this.options.create
				};
			}
			
		},
		
		_create: function() {
			
			this._normalizeOptions();
			
			this.element.hide();
			this.element.data(this.namespace+'.itemsField',this);
			
			//Parts
			this.container = $('<div class="'+this.widgetBaseClass+'"></div>');
			if(!this.options.multiple) this.container.addClass(this.widgetBaseClass+'-single');
			this.background = $('<div class="background"></div>')
			this.input = $('<input type="text" size="'+this.options.inputMinSize+'" />');
			
			//Construction
			this.element.after(this.container);
			this.container.append(this.input);
			this.container.append(this.background);
			this.container.append('<div style="clear:both;"></div>');
			
			//Events
			this.container.on("click", "a.ui-icon-close", $.proxy(function(e) {
				e.preventDefault();
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
					this._updateInputSize();
					this.addItem.call(this,ui.item);
				},this)
			});
			this.autocomplete = this.input.data( "autocomplete" );
			this.autocomplete._response = function( content ) {
				if ( !this.options.disabled ) {
					content = this._normalize( (content || []) );
					this._suggest( content );
					this._trigger( "open" );
				} else {
					this.close();
				}
				this.pending--;
				if ( !this.pending ) {
					this.element.removeClass( "ui-autocomplete-loading" );
				}
			};
			this.autocomplete._renderMenu = $.proxy(function( ul, items ) {
				$.each( items, $.proxy(function( index, it ) {
					this.autocomplete._renderItem( ul, it );
				},this));
				if(!items.length) {
					var $li = $('<li class="ui-autocomplete-noresult">'+this.options.labelNoresult+'</li>');
					ul.append($li);
				}
				var $li = $('<li class="ui-autocomplete-buttons"></li>');
				var $button = $('<button>'+this.options.labelAdd+'</button>');
				$li.append($button);
				$button.button({
					icons: {
						primary:'ui-icon-plus'
					}
				});
				$button.bind('click',$.proxy(function(e) {
					e.preventDefault();
					this.createItem.call(this,e);
				},this));
				ul.append($li);
			},this);
			this.background.click($.proxy(function() {
				this.input.focus();
			},this));
			this.background.dblclick($.proxy(function() {
				this.input.get(0).select();
			},this));
			this.input.keydown($.proxy(function(e) {
				var keycode =  e.keyCode ? e.keyCode : e.which;
				var val = $(e.target).val();
				var isFocus = $(e.target).is(':focus');
				
				if(keycode == $.ui.keyCode.BACKSPACE && !val.length && this.items) {
					var lastItem = this.items.last();
					if(!lastItem.is('.ui-state-active')) {
						lastItem.addClass('ui-state-active').removeClass('ui-state-default');
					} else {
						lastItem.find('.ui-icon-close').click();
					}
				} else if(val.length && isFocus && this.options.create.type == 'text' && $.inArray(keycode,this.options.create.keys) != -1) {
					this._addItemFromInput();
					return false;
				}
				this._updateInputSize();
			},this));
			this.input.blur($.proxy(function(e) {
				if(this.items && this.items.filter('.ui-state-active').length) {
					this.items.filter('.ui-state-active').removeClass('ui-state-active').addClass('ui-state-default');
				}
				this._updateInputSize();
			},this));
			this.input.keypress($.proxy(function(e) {
				if (e.keyCode == $.ui.keyCode.ENTER) {
					return false;
				}
				//auto expand input
				this._updateInputSize();
			},this));
			this.input.focus($.proxy(function(e) {
				this._updateInputSize();
				if(this.options.showOnFocus) {
					if(this.input.val().length) {
						this.autocomplete._search(this.input.val());
					} else {
						this.autocomplete._suggest([]);
					}
				}
			}, this));
			placeholderSupport = ("placeholder" in document.createElement("input"));
			if(!placeholderSupport){
				this.input.attr('title',this.options.labelPlaceholder);
				this.input.hint();
			} else {
				this.input.attr('placeholder',this.options.labelPlaceholder);
			}
			if(this.options.labelPlaceholder.length) {
				this._updateInputSize();
			}
			
			//Refresh elements
			this.refresh();
		},
		
		_updateInputSize : function() {
			var val = $.trim(this.input.val()).length ? this.input.val():this.options.labelPlaceholder;
			this.input.attr("size", this._getSizeFromText(val));
		},
		
		_getSizeFromText : function(text) {
			var minSize = this.options.labelPlaceholder.length > this.options.inputMinSize.length ? this.options.labelPlaceholder:this.options.inputMinSize;
			var newsize = (minSize > text.length) ? minSize : (text.length + 1);
			return Math.ceil(newsize*1.2);
		},
		
		refresh: function() {
			// Keep track of the generated list items
			this.items = this.items || $();
			// Use a class to avoid working on options that have already been created
			this.element.find( "option:selected:not(."+this.widgetBaseClass+"-option)" ).each( $.proxy(function( i, el ) {
		 		if(!$(el).text().length) return;
				
				var $el = $(el).addClass( this.widgetBaseClass+"-option" );
				var $it = $('<span class="'+this.widgetBaseClass+'-item  ui-corner-all"></span>')
				$it.data( this.namespace+'.itemsField.option',el);
				$it = this._renderItem($it,$el);
				
				// Save it into the item cache
				this.items = this.items.add($it);
		 
			},this));
		 
			// If the the option associated with this list item is no longer contained by the
			// real select element, remove it from the list and the cache
			this.items = this.items.filter( $.proxy(function( i, it ) {
				var isInOriginal = $.contains( this.element[0], $.data( it, this.namespace+'.itemsField.option' ) );
				if ( !isInOriginal ) {
					$(it).hide();
					$(it).remove();
				}
				return isInOriginal;
			}, this ));
			
			if(!this.options.multiple) {
				if(this.items.length) this.input.hide();
				else this.input.show();
			}
			
			//this.list.find('li.'+this.widgetBaseClass+'-item')
		},
		
		_renderItem : function($it,$option) {
			var text = $option.text();
			$it.html('<span class="'+this.widgetBaseClass+'-label">'+text+'</span>');
			$it.addClass('ui-state-default');
			$it.insertBefore( this.input );
			
			var $closeLink = $('<a href="#" class="ui-icon ui-icon-close"></a>')
			$closeLink.data(this.namespace+'.itemsField',$it)
			$closeLink.appendTo($it);
			return $it;
		},
		
		_addItemFromInput : function() {
			this.addItem({'label' : this.input.val()});
			this.input.val('');
			this.input.autocomplete( "close" );
			this.input.focus();
		},
		
		createItem : function(e) {
			
			switch(this.options.create.type) {
				case 'text':
					this._addItemFromInput();
				break;
				case 'function':
					this.options.create.callback.call(this,$.proxy(function(it) {
						this.input.val('');
						this.input.autocomplete( "close" );
						this.addItem(it);
					},this));
				break;
				case 'dialog':
					$('<div></div>').dialog({
						modal : true,
						resizable : true,
						draggable : true
					})
				break;
				case 'in':
					
				break;
			}
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
			this.input.focus();
			this._updateInputSize();
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
					
				break;
			}
			
			$.Widget.prototype._setOption.apply( this, arguments );
			this._super( "_setOption", key, value );
		},
		
		destroy: function() {
			$.Widget.prototype.destroy.call( this );
		}
		
	});
	
}(jQuery));